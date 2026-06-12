---
title: AceIT
date: 2026-02-22
description: "HACKATHON: An AI interview practice playform."
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/5oSmkfMqiOk?si=5KvRO7YnL34oSVyO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>[repo](https://github.com/OSU-Hackathon-Team/HackAI2026)


# Executive Summary

AceIt is a standout AI interview coaching platform that turns interview practice into a live, high-fidelity simulation. It combines a polished Next.js experience with a Python backend that streams interview responses, analyzes speech and facial/body cues, and stores performance data for later review.

At its core, the product is built around a response-first philosophy: candidates upload a resume and job description, select an interviewer persona, and enter a session that adapts in real time. The backend generates persona-aware questions with Gemini, transcribes responses with Whisper, streams spoken feedback through TTS, and logs biometric and transcript data to Supabase for session history and coaching reports.

What makes the project especially strong is how many parts work together as one cohesive system. The frontend includes a custom avatar-driven interview room, a live coding workspace powered by Pyodide, a biometric HUD, and a reporting dashboard that turns raw session data into clear coaching insights. The backend adds MediaPipe-based visual analysis, PyTorch scoring models, adaptive difficulty, and reusable persona and job libraries that make each interview feel tailored rather than generic.

This is more than a mock interview app. It is a thoughtful training platform that blends AI, real-time media processing, and product-grade UX into a believable interview experience. The team clearly built for speed, realism, and feedback quality at the same time, and the result is a system that feels ambitious, technically sophisticated, and genuinely useful.

## What AceIt Delivers

- Real-time mock interviews grounded in a candidate's resume and target role
- Persona-based interviewers with distinct tones, roles, and difficulty levels
- Live multimodal feedback from audio, video, and transcript signals
- A browser-based Python coding environment for technical interview rounds
- Persistent session history, reports, and performance tracking through Supabase

## Why It Stands Out

- The experience is not just conversational; it is adaptive and stateful.
- The system does not rely on one signal, but combines speech, vision, and text.
- The interface feels intentional, with a strong visual identity and clear feedback loops.
- The architecture is practical enough to extend, but polished enough to demo with confidence.

