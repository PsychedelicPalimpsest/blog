---
title: McPuppeteer
date: 2025-07-25
description: "A scripting tool for Minecraft"
---

![](https://avatars.githubusercontent.com/u/210643394)
[Github Org](https://github.com/McPuppeteer)

## Overview

The McPuppeteer project is a two-repo toolkit that turns a Minecraft Java Edition
client into a remotely scriptable "bot." A Fabric mod (`McPuppeteer`) opens a
local control surface inside the game, and an async Python client library
(`PyPuppeteer`) speaks to it. Together they expose essentially every action a
human player can perform — moving, looking, chatting, trading, mining,
querying chunks, swapping inventory slots, toggling freecam, and driving
Baritone — as a structured JSON/binary protocol over a TCP socket. Clients
discover the running game via UDP broadcast.

The project is the work of a single author, **PsychedelicPalimpsest**, and is
shipped as `0.0.4` for **Minecraft 1.21.5**.

## Repositories

### `McPuppeteer/` — Java Fabric mod (the server side)

A client-side Fabric mod that listens on localhost for control packets and
intercepts Minecraft internals via Mixin to execute the requested actions.

- **Language / build:** Java 21, Gradle (`fabric-loom` 1.10-SNAPSHOT), with a
  custom Gradle task that bakes the current git hash, build date, and the
  AGPL-3.0 license text into a generated `BuildConstants` class so the running
  mod can hand its source to remote clients (an AGPL network-use requirement).
- **Modding framework:** Fabric Loader 0.16.14, Fabric API, Yarn mappings
  `1.21.5+build.1`, and a `puppeteer.accesswidener` that opens up camera,
  key-binding, chunk-palette, and registry internals that would otherwise be
  private.
- **Required dependency:** `malilib` (sakura fork) — provides the hotkey,
  config GUI, and `Mod Menu` integration.
- **Optional integrations (auto-detected at startup):** Baritone (pathing),
  Tweakeroo (freecam baseline), Litematica, ItemScroller, MiniHUD. Each is a
  `modCompileOnly` dependency, and commands that need them are gated on
  presence in the loaded mod list.
- **Runtime libraries:** Google Gson (wire format), `org.reflections:0.10.2`
  (scans the mod jar for `@PuppeteerCommand` classes to register), and
  Javassist 3.29.2-GA (runtime instrumentation, shaded into the jar).
- **Core architecture:**
  - `PuppeteerServer` — a Java NIO `Selector`-based TCP server bound to a
    random port, plus a UDP broadcaster on `255.255.255.255:43842` that emits
    a `PUPPETEER` magic-prefixed JSON beacon every few seconds containing
    username, uuid, position, and the server's TCP port.
  - `BaseCommand` / `@PuppeteerCommand` — annotation-driven command framework.
    Every feature is one tiny class (e.g. `GetBlock`, `SetHotbarSlot`,
    `BaritoneGoto`); ~70 commands are auto-discovered at startup. Commands
    declare a context (`ANY` / `PRE_PLAY` / `PLAY` / `PLAY_WITH_MOVEMENT`) and
    a list of mod requirements.
  - `PuppeteerServer` implements a full-duplex protocol: clients can poll,
    subscribe to "callbacks" (chat, position, packet events), and even receive
    raw NBT and binary payloads (e.g. for chunk data).
  - Wire format: 1-byte type tag (`'j'` JSON, `'n'` NBT, `'b'` binary) +
    4-byte big-endian length + payload, with the request `id` echoed back
    for correlation.
  - Bundle sub-protocol (`bundle` command) with `INSTANT`, `TICKLY`, and
    `SEQUENTIAL` execution modes for composable action scripting.
  - `Mixin`s (12 of them) patch `MinecraftClient`, `ClientPlayerEntity`,
    `Camera`, `KeyBinding`, `ClientConnection`, `ClientPlayNetworkHandler`,
    `InGameHud`, `LivingEntity`, `Entity`, `ChatHub`, and a Tweekeroo camera
    hook to deliver the modules: **Freecam**, **Freerot** (decoupled camera
    yaw/pitch), **NoWalk**, **Headless mode** (window-free), and forced
    input/rotation overrides.
  - **Reflection utilities** (`me.psychedelicpalimpsest.reflection.*`) maintain
    Yarn-name → obfuscated-name mappings at runtime so packet
    serialization/deserialization tracks Minecraft's constant internal
    renames.
- **Command surface (excerpts):**
  - World: `get block`, `get chunk`, `list loaded chunks`, `search for blocks`.
  - Inventory: `click slot`, `swap slots`, `get player inventory`,
    `get open inventory`, `click inventory button`, `get trades`,
    `select trade`, `set anvil name`, `set beacon effect`,
    `get enchantments`.
  - Input/control: `attack key click`, `use key click`, `force inputs`,
    `get forced input`, `clear force input`, `set directional movement degree`,
    `set directional movement vector`, `clear directional movement`.
  - Actions: `set hotbar slot`, `algorithmic rotation` (with a large set of
    easing curves), `instantaneous rotation`, `auto use`, `auto place`,
    `send chat message`, `execute command`, `display chat message`,
    `overview message`, `sleep`, `panic`.
  - State: `set/get freecam`, `set/get freerot`, `set/get nowalk`,
    `set/get headless`.
  - Mod integrations: `dump/get/set/exec` config helpers for Malilib,
    Tweakeroo, Litematica, ItemScroller, and MiniHUD.
  - Callbacks: `set callbacks`, `get callbacks`, `clear callbacks` for both
    high-level events and per-packet observation (in `NOTIFY_ONLY`,
    `NETWORK_SERIALIZED`, or `OBJECT_SERIALIZED` modes).
  - Meta: `ping`, `get client info`, `get player info`, `get mod list`,
    `list commands`, `sources` (returns git hash + license, per AGPL),
    `bundle`.
- **Licensing:** AGPL-3.0 only. The mod embeds its full license text and
  serves it on demand through the `sources` command so that even network
  users can obtain the corresponding source.

### `PyPuppeteer/` — Python async client library (the client side)

A thin, asyncio-native wrapper around the mod's protocol. Distributed as
`McPuppeteer` on PyPI (the upstream package name reuses the mod's name for
searchability), with the import package itself named `puppet`.

- **Language / build:** Python 3, `setuptools` (`setup.py`), Sphinx
  documentation (`docs/`), GitHub Actions for PyPI publishing and docs
  deployment. The repo includes a `.github/workflows/docs.yml` and
  `python-publish.yml`.
- **Runtime dependency:** `nbtlib==1.12.1` (the only external dep, used to
  parse Minecraft NBT returned in binary wire responses — e.g. block data and
  chunk block-entity lists).
- **Protocol implementation (`puppet/connection.py`):**
  - UDP broadcast listener on port 43842, magic filter `b"PUPPETEER"`.
  - `ClientConnection` opens a TCP stream via `asyncio.open_connection`,
    spawns a background listener task, and dispatches incoming frames to
    per-request asyncio futures keyed by UUID `id`.
  - Supports `j`, `b`, and `n` packet types in both directions and exposes a
    global `PuppeteerError` with typed `PuppeteerErrorType` categories.
  - `ClientConnection.discover()` awaits the first broadcast and auto-connects.
- **High-level API (`puppet/player.py`, ~1400 lines):**
  - A generic `LazyRequest` awaitable — every method on `Player` returns one
    instead of executing immediately. This lets callers compose commands into
    bundles (`bundle_p`, `bundle`) that are sent as a single `bundle` request
    with `INSTANT` / `TICKLY` / `SEQUENTIAL` execution semantics matching the
    mod side.
  - `Player.discover(with_name=...)` for zero-config discovery;
    `async with` context-manager support for both `Player` and
    `ClientConnection`.
  - Full coverage of the mod's command surface, including typed enums in
    `puppet/constants.py`: `CallbackType` (chat, position, yaw, pitch,
    damage, death, inventory, open screen, container contents, etc.),
    `SlotActionType`, `PacketCallbackState`, `Direction`, `BundleMethod`,
    `InputButton`, `RoMethod` (15+ rotation easing curves), and
    `PuppeteerErrorType`.
  - Callback helpers: `set_callback`, `wait_for_callback`, `wait_for_chat`,
    and packet-level `set_packet_callback` / `wait_for_callback` with
    one-shot "NEXT" variants.
  - Inventory abstraction: a hierarchy of `Inventory` subclasses
    (`PlayerInventory`, `Generic9x1`–`9x6`, `Generic3x3`, `Crafter`,
    `ShulkerBox`, `Anvil`, `Grindstone`, `Merchant`, `CartographyTable`,
    `Beacon`, `Furnace`/`BlastFurnace`/`Smoker`, `BrewingStand`,
    `CraftingTable`, `EnchantmentTable`, `Hopper`, `Lectern`, `Loom`,
    `SmithingTable`, `StoneCutter`, `EntityWithInventory`) that model slot
    layouts and expose named accessors (`get_helmet`, `get_blaze_powder`,
    `get_payment_slot`, etc.).
  - Auto-generated mod-config accessors (`dump_<mod>_config`,
    `get_<mod>_config_item`, `set_<mod>_config_item`,
    `exec_<mod>_config_item`) for the five supported Masa-family mods.
  - `puppet/world.py` decodes the mod's compact chunk format (bits-per-block,
    palette NBT list, packed `long[]` array) into a `Chunk` / `Section`
    object tree.
- **Status:** Marked "work in progress" in `README.md`; semantics may still
  shift.

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

## Takeaway

Puppeteer is a self-contained "Minecraft-as-a-service" stack: the Fabric
mod is essentially a programmable Minecraft head (freecam, headless mode,
forced input, packet inspection) and the Python client is the corresponding
scripting surface. The design cleanly separates discovery (UDP broadcast)
from command-and-control (TCP with JSON/NBT/binary frames), uses a
reflective command registry to keep adding features cheap, and intentionally
makes the mod redistributable across the network (it serves its own
sources/license) to stay compatible with AGPL.

