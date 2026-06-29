---
title: McPuppeteer
date: 2025-07-25
description: "A scripting tool for Minecraft"
---

![](https://avatars.githubusercontent.com/u/210643394)
[Github Org](https://github.com/McPuppeteer)


The McPuppeteer project is a two-repo toolkit that turns a Minecraft Java Edition
client into a remotely scriptable "bot." A Fabric mod (`McPuppeteer`) opens a
local control surface inside the game, and an async Python client library
(`PyPuppeteer`) speaks to it. Together they expose essentially every action a
human player can perform — moving, looking, chatting, trading, mining,
querying chunks, swapping inventory slots, toggling freecam, and driving
Baritone — as a structured JSON/binary protocol over a TCP socket. Clients
discover the running game via UDP broadcast.

## Technologies Used

| Layer | Technology |
| --- | --- |
| Game version | Minecraft Java Edition **1.21.5** |
| Mod loader | **Fabric Loader 0.16.14** with **Fabric API** and **Yarn** mappings |
| Mod language | **Java 21** (source/target compatibility 21) |
| Build system | **Gradle** + `fabric-loom` 1.10-SNAPSHOT; `withSourcesJar`; git/license/date baked in at build time |
| Bytecode patching | **Mixin** (12 client mixins) + **Fabric AccessWidener** (`puppeteer.accesswidener`) |
| Runtime instrumentation | **Javassist 3.29.2-GA** (shaded), **Reflections 0.10.2** (annotation scan) |
| Serialization | **Gson** |
| Networking (mod) | `java.nio.channels` (`Selector`, `ServerSocketChannel`, `SocketChannel`); `java.net.DatagramSocket` for UDP broadcast |
| UI / config / hotkeys | **malilib** (sakura fork), **Mod Menu** |
| Optional mod integrations | **Baritone API**, **Tweakeroo**, **Litematica**, **ItemScroller**, **MiniHUD** (all `modCompileOnly`, auto-detected) |
| Minecraft internals bridged | Camera, ClientPlayerEntity, ClientConnection, ClientPlayNetworkHandler, KeyBinding, InGameHud, LivingEntity, Entity, ClientChunkManager/PalettedContainer, registries (via `RegistryEntry$Reference` access widening) |
| Client language | **Python 3** |
| Client async model | `asyncio` (TCP), raw non-blocking UDP sockets (broadcast discovery) |
| Client build / packaging | `setuptools` (`setup.py`), Sphinx + RST documentation, GitHub Actions for PyPI + docs |
| Client dependencies | **`nbtlib==1.12.1`** (NBT decoding), Python stdlib only otherwise |
| Wire protocol (shared) | Custom: 1-byte type tag (`'j'`, `'n'`, `'b'`) + 32-bit big-endian length + payload; full-duplex; UUID request id correlation; UDP `b"PUPPETEER"` discovery on `255.255.255.255:43842` |
| Licensing | Mod: **AGPL-3.0 only**; client library: **GPL-3.0** |


