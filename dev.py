#!/usr/bin/env python3
"""
Dev server: watches src/, rebuilds on change, serves build/ with live reload.

Usage:
    python dev.py              # http://localhost:8000
    PORT=9000 python dev.py    # custom port
    HOST=0.0.0.0 python dev.py # bind on all interfaces
"""

import os
import queue
import sys
import threading
import time
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import build

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "build"
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "127.0.0.1")
WATCH_EXTS = {".html", ".md", ".yaml", ".yml"}
DEBOUNCE_SECONDS = 0.15
POLL_SECONDS = 0.25
SSE_HEARTBEAT_SECONDS = 15.0
SSE_PATH = "/__reload"

os.environ["BLOG_DEV"] = "1"

_clients: list[queue.Queue] = []
_clients_lock = threading.Lock()
_building_lock = threading.Lock()


def _add_client() -> queue.Queue:
    q: queue.Queue = queue.Queue()
    with _clients_lock:
        _clients.append(q)
    return q


def _remove_client(q: queue.Queue) -> None:
    with _clients_lock:
        try:
            _clients.remove(q)
        except ValueError:
            pass


def _broadcast(msg: str) -> None:
    with _clients_lock:
        for q in list(_clients):
            try:
                q.put_nowait(msg)
            except queue.Full:
                pass


def _snapshot_mtimes() -> dict[Path, float]:
    snap: dict[Path, float] = {}
    for p in SRC.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix not in WATCH_EXTS:
            continue
        try:
            snap[p] = p.stat().st_mtime
        except OSError:
            pass
    return snap


def _watch_loop() -> None:
    mtimes = _snapshot_mtimes()
    last_change: float | None = None
    while True:
        time.sleep(POLL_SECONDS)
        current = _snapshot_mtimes()
        changed = False
        for path, mtime in current.items():
            if mtimes.get(path) != mtime:
                mtimes[path] = mtime
                changed = True
        for path in list(mtimes):
            if path not in current:
                del mtimes[path]
                changed = True
        if changed:
            last_change = time.monotonic()
        if last_change is None:
            continue
        if (time.monotonic() - last_change) < DEBOUNCE_SECONDS:
            continue
        last_change = None
        if not _building_lock.acquire(blocking=False):
            continue
        try:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"\n[{ts}] change detected, rebuilding...")
            try:
                build.main(atomic=True)
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"[{ts}] rebuild done.")
                _broadcast("reload")
            except SystemExit:
                raise
            except Exception as exc:
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"[{ts}] rebuild failed: {exc!r}")
        finally:
            _building_lock.release()


class _Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUT), **kwargs)

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == SSE_PATH:
            self._handle_sse()
            return
        super().do_GET()

    def _handle_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        self.wfile.flush()
        q = _add_client()
        try:
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()
            while True:
                try:
                    msg = q.get(timeout=SSE_HEARTBEAT_SECONDS)
                    payload = f"event: reload\ndata: {msg}\n\n".encode("utf-8")
                    self.wfile.write(payload)
                    self.wfile.flush()
                except queue.Empty:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        finally:
            _remove_client(q)

    def log_message(self, fmt: str, *args) -> None:
        ts = datetime.now().strftime("%H:%M:%S")
        sys.stderr.write(f"[{ts}] {fmt % args}\n")


def main() -> None:
    print(f"Building initial site into {OUT.name}/...")
    build.main(atomic=True)
    print(f"\nDev server: http://{HOST}:{PORT}")
    print("Watching src/ for changes. Ctrl+C to stop.\n")

    watcher = threading.Thread(target=_watch_loop, daemon=True)
    watcher.start()

    server = ThreadingHTTPServer((HOST, PORT), _Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping dev server.")


if __name__ == "__main__":
    main()
