---
title: LibbyRip
date: 2026-06-10
description: "Extract and convert audiobooks in browser with userscripts"
---


![](https://github.com/PsychedelicPalimpsest/LibbyRip/blob/main/imgs/export.png?raw=true)

[Repo](https://github.com/PsychedelicPalimpsest/LibbyRip/tree/main)


Userscript with ~1000 active users and an active community.

A Tampermonkey userscript that intercepts and downloads DRM-protected content from the Libby/OverDrive platforms, supporting both **audiobooks** (MP3) and **eBooks** (EPUB). This is done by hooking global functions (`JSON.parse` and `Function.prototype.bind`) and passively collecting the results.


## Audiobook Pipeline

| Step | Detail |
|---|---|
| URL reconstruction | Combines `BIF.objects.spool.components` paths with intercepted `odreadCmptParams` tokens |
| Chapter preview | Injects `<audio>` elements with live stream URLs |
| Bulk MP3 download | Parallel `fetch()` calls, individual blob downloads |
| Single MP3 export | Fetches all parts → pipes into **FFmpeg.wasm** for concatenation |

### FFmpeg.wasm Integration
A ~50MB FFmpeg.wasm bundle is loaded **lazily and asynchronously** to avoid page slowdown. It is used to:
- Concatenate split MP3 parts via a `concat` demuxer
- Embed ID3 metadata (title, artist, album)
- Embed cover art
- Inject chapter markers via **FFmpeg chapter metadata format** (`FFMETADATA1`)

---

## eBook Pipeline

| Step | Detail |
|---|---|
| Content extraction | Forces all spine components to load via `_loadContent()`, then polls until complete |
| Decryption | Uses the captured `.bind()` argument (decryption function) to decrypt each chapter's HTML |
| XHTML normalization | Parses HTML with `DOMParser`, lowercases all tags, adds EPUB namespaces, rewrites asset `src` paths, and re-serializes with `XMLSerializer` |
| Asset gathering | Scrapes `<img>`, `<image>`, and `<link>` tags from chapter iframes to build an asset manifest, then fetches each |
| EPUB assembly | Programmatically generates `content.opf` (OPF package), `toc.ncx` (NCX navigation), `META-INF/container.xml`, and `mimetype` using `createDocument`/`createElementNS` |

---

## Download / Packaging

- **client-zip** (`unpkg.com/client-zip@2.5.0`) — streaming ZIP generation in the browser, used for both the audiobook chapter dump and EPUB packaging
- **File System Access API** (`showSaveFilePicker`) — used for streaming ZIP/EPUB directly to disk, bypassing the need to buffer the entire file in memory
- **Blob URL fallback** — for browsers lacking File System Access API support, the ZIP is buffered into a Blob and downloaded via a synthetic `<a>` click
- client-zip is fetched in the **extension context** (where CSP does not apply) and injected into the page world via a promise-based handshake (`__libregrabClientZipReady`)

---

## Technologies & APIs Referenced

- Tampermonkey / Greasemonkey userscript API
- FFmpeg.wasm (custom bundled build)
- client-zip v2.5.0
- File System Access API (`showSaveFilePicker`, `createWritable`, `pipeTo`)
- Web Crypto / `crypto.randomUUID()`
- `DOMParser` / `XMLSerializer`
- `URL` API
- Blob / Object URLs
- `fetch` API
- `setInterval` polling
- DOM injection via `<script>` tag serialization
