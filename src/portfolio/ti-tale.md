---
title: TI-Tale
date: 2026-07-31
description: "An experimental game engine for the TI-84"
---

![](hello-work.png)


- Developing a custom Z80 game engine for TI-83 Plus hardware using z88dk, with hand-written assembly for
  interrupt handling, RAM paging, and flash memory management
- Implemented 4-level greyscale rendering on a 1-bit display via timed buffer swapping and
  crystal-timer-driven interrupts (~60 Hz)
- Built cooperative multitasking runtime with separate game-loop and compositor tasks under strict memory
  and cycle constraints
- Designed room/object architecture with Python code generation for multi-page ROM layout and scalable
  content structure
- Optimized hot paths by relocating critical routines to executable RAM and tuning interrupt dispatch for
  audio, display, and game tick

[repo](https://github.com/PsychedelicPalimpsest/TI-tale)
