---
title: Becoming GOD on the TI-84
date: 2026-06-11
description: Unlocking a flash unlock for fun and profit
---

## Some TI hardware primer 
> <small>_Feel free to skip this one_ </small>

First off, there are many TI-84 varieties, but for this article we are going to be covering the monochrome TI83 and Ti84, those ones are a lot more fun to play with. In these system, they run of a z80 cpu clock at 8Mhz with the ability to go up to 15Mhz, and surrounded in a much of hardware. We can communicate with this hardware with _ports_, like this:

```asm
    ; Read from the status port
    ld a, ($2)


    ; Write to the LCD data port.
    ld a, $FF
    out ($11), a
```

This lets us directly talk with hardware, and we can do a lot of things with it, but nothing permanent.

Just like a regular computer, the calculator has both permanent storage (hereafter referred to as _flash_), and ram for temporary storage. However, any writes to flash get ignored!
```asm
    ; Try to write 0x69 to the bootloaded, does nothing!
    ld a, $69
    ld (0000h), a
```

When you look in the official [System Routine document](https://dn710703.ca.archive.org/0/items/83psdk/83psysroutines.pdf), you find a grand total of **one** routine that can write to flash, [Arc_Unarc](https://wikiti.brandonw.net/index.php?title=83Plus:BCALLs:4FD8), a painfully slow routine who requires you to create a variable to archive. 



## But its not just the flash

A lot of people don't know this, but TI went through an awfully lot of work securing their calculators back in the day, so much so they went on a [rampage](https://en.wikipedia.org/wiki/Texas_Instruments_signing_key_controversy) when people cracked the OS signing keys, DMCAin' anybody who dared to host them. But beyond that, half the IO ports are block off!

These are known as the [_protected ports_](https://wikiti.brandonw.net/index.php?title=Category:83Plus:Ports:By_Address:Protected), any write to them without a very special procedure will be ignored. These are some fun ones we are loosing out on:

| | |
|--|--|
|$22/$23: _Flash Execution Limits_  | Controls what flash sectors are executable.
|$25/$26: _Ram Execution Limits_    | Controls what ram addresses are executable, by default this is at only $83FF (_not actually sure what this means since ram programs are at $9D95 and run fine_)|
|$21: _Flash Size / RAM Size_       |Controls what flash sectors are privledged  


Luckily for us, this protect port unlock sequence has been known for 20 years! 
```asm
    nop
    nop
    im 1
    di
    out (...),a
```
But unfortunately for us, it can only be executed from certain ROM pages, none of which we can (easily) get any code onto:

| Model | OS pages | Possible pages |
| :--- | :--- | :--- |
| TI-83+ | 1Ch, 1Dh, 1Fh | 1Eh |
| TI-84+ | 3Ch, 3Dh, 3Fh | 2Ch-2Eh, 6Ch-6Eh, 3Eh |
| TI-83+ SE | 7Ch, 7Dh, 7Fh | 7Eh |
| TI-84+ SE | 6Fh, 7Ch, 7Dh, 7Fh | 7Eh |

<sup> From the [WikiTi page](https://wikiti.brandonw.net/index.php?title=Category:83Plus:Ports:By_Address:Protected)</sup>


## Exploiting the operating system


## Steal all the ram!

We all like lots of ram, so much so we 
