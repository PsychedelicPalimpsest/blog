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

But we know the operating system _does_ unlock the flash, after all that [Arc_Unarc](https://wikiti.brandonw.net/index.php?title=83Plus:BCALLs:4FD8) system routine does it somehow. 

Ordinarily, this is the point where I go on a heroic story on how I alone found one, possibly with a massive fuzzing campaign. I did, in fact, spends several days fuzzing every unlock sequence in the OS, but then I remembered something. I'm an idiot, somebody probably did this at some point before!
<a href="https://www.omnimaga.org/asm-language/flash-snacks/msg407110/#msg407110">
    ![](/posts/abusing-the-flash/the_mad_joob.png)
    ![](/posts/abusing-the-flash/discovery.png)
</a>
Yup, second page of google, quite convenient! 

## Steal all the ram!

This is what most people are here for. You see, in the old days calculators had a 8 ram paged, 5 of which were unused by the operating system, a whopping 80KB of unused space, but, then TI attacked. Starting in ASIC version $55 <sup>[[1]](https://www.cemetech.net/projects/uti/viewtopic.php?t=8913&postdays=0&postorder=asc&start=0&sid=c835d231a96b736e20d54b0c6328dc44) [[2]](https://www.omnimaga.org/other-calculator-discussion-and-news/the-missing-84-extra-ram-pages-(hardware-change)/)</sup>, all the unused ones were locked away, leaving us with:

|Ram page||
|--|--|
|$80| The default C000h ram page, no code execution allowed. Used by the OS as user variable overflow from 8000h|
|$81| The default 8000h ram page, code execution allowed, but mostly used up by the OS|
|$83| Almost entirly unused (apart from the equation history), and we can execute code!|

This leaves us with only a single page for us to have our way with! (Without corrupting user data)

But, what if we didn't have to corrupt user data? The answer is simple, flush all that ram to flash! The Ti-84 flash chip is advertised as `Minimum 1,000,000 program/erase cycles per sector guaranteed` <sup>[[3]](https://wikiti.brandonw.net/images/a/a0/AM29F400BT.pdf) </sup>, so as long as we don't put it in a loop we should be safe.

But the question is, where do we stash it? There are a few options:
1. Store as a variable: Annoying, lots of system calls
2. Store in a known unused sector: Closer, but could brick a calc if our assumptions are wrong
3. Use the OS designated temp sector: ...

Yeah, the OS has _swap sector_ built in for temporary usage, and we can ask the OS for it specifically with [FindSwapSector](https://wikiti.brandonw.net/index.php?title=83Plus:BCALLs:5095). But what are the cons, well this routine is kind of dangerous (up to TIs typical quality standards). These are some of the ways is can ruin your day:

1. In a worse case scenario, it defaults to page 8 **EVEN IF SOMETHING IS THERE**, causing possible variable corruption
2. If you fail to mark the sector as swap (by writing $FE to the first byte of the sector), it has a habbit of overwriting your app pages. As such, uninstalling random apps for the fun of it

***So I will leave you with one warning***: For the love of GOD, set the first byte $FE

But lets get into the meat and potatos! You want 32KB of ram right???? The answer is simple, use page $83, and then back up all the users variables in $81 (aka the typical 8000h ram page). 



```asm
    call flashunlock
        bcall _FindSwapSector


    call flashlock
```







## Appendix: Flash unlock routines
Sourced from: [snacks.zip](https://www.omnimaga.org/asm-language/flash-snacks/?action=dlattach;attach=25773) by [the_mad_joob](https://www.omnimaga.org/profile/the_mad_joob/)
```asm
;#####

;flashunlock - fast variant

;DESCRIPTION
;Unlocks the flash chip.
;Inspired by thepenguin77's code.

;WARNINGS
;UNLOCKING FLASH OPENS A DOOR TO SOME DANGEROUS THINGS.
;DON'T IF YOU'RE A BEGINNER.
;IT'S HIGHLY RECOMMENDED TO CALL flashlock WHEN YOU'RE DONE.

;IN
;interrupts : disabled
;bank 2 : RAM page $01 (system default)
;code location : anywhere (see NOTES)
;stack location : bank 3
;free stack space : 40+ bytes (call included)

;OUT
;interrupt mode : 1
;b = $40
;hl = $0007
;sp = unchanged
;all other registers = ?

;NOTES
;The following addresses are written to, don't have your code there :
;   $8100>$817B
;   $81D4>$81FE
;   $82A2
;   $83E8>$83E9
;   $83EB
;   $83EE
;   $84DB>$84DC
;   $9834
;   $9836>$9837
;   $983A
;If you want their content preserved, use the non-destructive variant instead.
PUBLIC flashunlock
flashunlock:

	ld a,$14
	ld bc,flashunlock_ram_end-flashunlock_ram_start
	ld de,flashunlock_ram_start-flashunlock_return+$81E3
	ld hl,$8167
	ld iy,$0031 ; must be $0031
	ld ($83EE),a ; must be $08>$15
	ld ($84DB),hl ; must be $8167
	ld ($9834),a ; must be $03>$FF
	add a,l
	ld ($983A),a ; must be close enough to but under $80
	ld hl,flashunlock_ram_start
	ldir

	in a,($06)
	push af

	in a,($02)
	rra
	or %10111111
	ld d,a
	and $7B

	jp flashunlock_ram_start-flashunlock_return+$81E3

flashunlock_ram_start:

	out ($06),a

	ld hl,($5092)

	ld a,d
	and $7C
	out ($06),a

	ld a,$10
	cpir

	jp (hl)

flashunlock_return:

	ld hl,24
	add hl,sp
	ld sp,hl
	ld hl,$0007
	ld (hl),$FF
	ld b,%01000000

	pop af
	out ($06),a

flashunlock_wait:

	ld a,(hl)

	rla
	ret c

	and b
	jp z,flashunlock_wait-flashunlock_return+$81E3

	ld a,(hl)

	rla
	ret c

	ld (hl),$F0

	ret

flashunlock_ram_end:



;flashlock - app variant

;DESCRIPTION
;Locks the flash chip.

;IN
;interrupts : disabled
;code location : bank 1|3
;stack location : bank 1|3
;free stack space : 6 bytes (call included)

;OUT
;interrupt mode : 1
;a = page in bank 2
;f = %???????0
;b = a
;c = ?
;hl = ?

PUBLIC flashlock
flashlock:

	in a,($07)
	ld b,a

	in a,($02)
	rra
	or %10111111
	ld c,a
	and $7B
	out ($07),a

	ld hl,($8F3C)
	ld a,h
	xor %11000000
	ld h,a

	ld a,c
	and $7C
	out ($07),a

	call flashlock_jump

	ld a,b
	out ($07),a

	ret

flashlock_jump:
	jp (hl)

```
