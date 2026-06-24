---
title: Ti84 z80 C compiler support
date: 2023-12-11
description: "Added support for the Ti84 calculator in a major z80 C compiler"
---


Contributed code to Z88DK C compiler adding compatibility for the TI-84 using binary patching and Z80 assembly. This took quite a bit of work as I had to learn the standards of Z88DK in order to get the code merged.

Here, I wrote out: 
* A custom CRT0 file to define the proper binary format of TI-84 apps.
* An app signing module of the build system.
* A binary pathing trick that allow code on one bank to call another bank. 
* And a codegen component that adds an interface for banked functions.

PR: [link](https://github.com/z88dk/z88dk/pull/2454)
