# Blog

A static blog + portfolio, rendered by GitHub Actions, hosted on GitHub Pages.

## Layout

```
build.py              # build script (run by Actions, and locally)
requirements.txt
src/
  site.yaml           # site title / description / tagline
  _base.html          # centered layout (do not edit per-page styling here)
  index.html          # homepage — uses inline Jinja2 to list posts
  about.html          # example static page
  posts/              # markdown blog posts
  portfolio/          # markdown portfolio entries
.github/workflows/build.yml   # rebuilds + deploys on push to main
```

## Adding a blog post

Create `src/posts/your-slug.md`:

```markdown
---
title: My new post
date: 2026-06-15
description: One-line summary shown on the homepage.
---

Body in standard markdown. Save, commit, push. GitHub Actions rebuilds
the site and the new post appears on the homepage.
```

## Adding a portfolio entry

Same as a blog post, but in `src/portfolio/`. The portfolio index page
picks it up automatically.

## Editing a page

- **HTML pages** (`src/index.html`, `src/about.html`, etc.) — edit them
  directly. They use Jinja2; the available variables are `posts`,
  `portfolio`, `site_title`, `site_description`, `site_tagline`, and
  `build_time`.
- **Markdown pages** — frontmatter is YAML; everything below the closing
  `---` is standard markdown.

## Local preview

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py
python -m http.server --directory build
```

Then open http://localhost:8000.

## First-time setup on GitHub

1. Push this repo to GitHub.
2. Repo → **Settings → Pages** → set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow builds and deploys automatically.
