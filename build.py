#!/usr/bin/env python3
"""
Build script for the blog.

Renders all .html and .md files in src/ to build/.
- .html files are rendered as Jinja2 templates, then wrapped in the base layout.
- .md files have YAML frontmatter parsed; the body is converted to HTML,
  then wrapped in the base layout.

Anything starting with '_' is treated as a partial/layout and not emitted.
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path

import frontmatter
import jinja2
import markdown
import yaml
from jinja2 import FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "build"
POSTS_DIR = SRC / "posts"
PORTFOLIO_DIR = SRC / "portfolio"
BASE_TEMPLATE_NAME = "_base.html"


def render_markdown_body(text: str) -> str:
    return markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "toc", "nl2br"],
    )


def slug_from_path(path: Path, base: Path) -> str:
    rel = path.relative_to(base).with_suffix("")
    return str(rel).replace(os.sep, "/")


def output_path_for(src_path: Path, base: Path, out_root: Path) -> Path:
    rel = src_path.relative_to(base)
    if src_path.suffix == ".md":
        rel = rel.with_suffix(".html")
    return out_root / rel


def collect_collection(directory: Path) -> list[dict]:
    """Collect all .md files in a directory, parse frontmatter, sort by date desc."""
    items: list[dict] = []
    if not directory.exists():
        return items
    for md_path in sorted(directory.glob("*.md")):
        post = frontmatter.load(md_path)
        meta = dict(post.metadata)
        meta.setdefault("title", md_path.stem.replace("-", " ").title())
        meta["slug"] = slug_from_path(md_path, SRC)
        meta["body_html"] = render_markdown_body(post.content)
        if isinstance(meta.get("date"), datetime):
            meta["date_iso"] = meta["date"].strftime("%Y-%m-%d")
        else:
            meta["date_iso"] = str(meta.get("date", ""))
        items.append(meta)
    items.sort(key=lambda x: x.get("date") or datetime.min, reverse=True)
    return items


def load_site_config() -> dict:
    path = SRC / "site.yaml"
    if path.exists():
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return {}


def build_context() -> dict:
    site = load_site_config()
    return {
        "site_title": site.get("title", "My Site"),
        "site_description": site.get("description", ""),
        "site_tagline": site.get("tagline", ""),
        "posts": collect_collection(POSTS_DIR),
        "portfolio": collect_collection(PORTFOLIO_DIR),
        "build_time": datetime.now().strftime("%Y-%m-%d %H:%M UTC"),
    }


def render_html_file(
    src_path: Path, jinja_env: jinja2.Environment, context: dict
) -> str:
    template = jinja_env.get_template(str(src_path.relative_to(SRC)))
    return template.render(**context)


def render_markdown_file(src_path: Path, context: dict) -> str:
    post = frontmatter.load(src_path)
    meta = dict(post.metadata)
    meta.setdefault("title", src_path.stem.replace("-", " ").title())
    meta["body_html"] = render_markdown_body(post.content)
    if isinstance(meta.get("date"), datetime):
        meta["date_iso"] = meta["date"].strftime("%Y-%m-%d")
    else:
        meta["date_iso"] = str(meta.get("date", ""))
    return context["__layout"].render(
        **{**context, "page": meta, "content": meta["body_html"]}
    )


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    jinja_env = FileSystemLoader(str(SRC))
    jinja_env = jinja2.Environment(
        loader=jinja_env,
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    context = build_context()

    # Pre-render the base layout (so markdown files can use it).
    layout_template = jinja_env.get_template(BASE_TEMPLATE_NAME)
    context["__layout"] = layout_template

    written: list[Path] = []
    for src_path in SRC.rglob("*"):
        if not src_path.is_file():
            continue
        rel = src_path.relative_to(SRC)
        if rel.parts[0].startswith("_") and rel.name == BASE_TEMPLATE_NAME:
            continue
        if rel.parts[0].startswith("_"):
            # treat as partial, skip
            continue
        if src_path.suffix not in {".html", ".md"}:
            continue

        out_path = output_path_for(src_path, SRC, OUT)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        if src_path.suffix == ".html":
            rendered = render_html_file(src_path, jinja_env, context)
        else:
            rendered = render_markdown_file(src_path, context)

        out_path.write_text(rendered, encoding="utf-8")
        written.append(out_path)
        print(f"  {rel} -> {out_path.relative_to(OUT)}")

    print(f"\nBuilt {len(written)} page(s) into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
