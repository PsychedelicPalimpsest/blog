---
title: OncoPath
date: 2025-04-19
description: " HACKATHON: Multimodal Cancer Metastasis Risk Prediction"
---


![](https://github.com/OSU-Hackathon-Team/HackClaude26/raw/main/data/oncopath_hero.png)

[repo](https://github.com/OSU-Hackathon-Team/HackClaude26)

**OncoPath** is an AI-driven clinical decision-support platform that predicts organ-specific metastatic risk by fusing longitudinal clinical data, 101-gene mutation profiles, and tumor pathology imaging. Trained on the MSK-MET cohort across all 21 metastatic destinations, the platform lets clinicians and researchers run real-time "What-If" simulations to see how specific mutations (e.g., *TP53*, *KRAS*, *HER2*) shift cancer progression across the body.

## Problem
Cancer prognosis hinges on a complex interplay between a patient's clinical profile, tumor genomics, and histology — but clinicians typically reason about these signals in isolation. Existing tools either ignore the genomic layer, lack visual feedback, or fail to surface the organotropism patterns (KRAS→colorectal liver spread, HER2→breast-to-liver) that drive treatment planning.

## Solution
- **Multimodal fusion engine** — XGBoost tabular models augmented with embeddings from the Phikon pathology foundation model, plus an ensemble layer that triggers image-based reasoning when image confidence is decisive (>70% / <30%).
- **3D Metastatic HUD** — Interactive Three.js viewer that renders risk intensity as a dynamic anatomical heatmap across the human body.
- **OncoBot clinical assistant** — Domain-restricted RAG chatbot built on Anthropic Claude that surfaces interpreted clinical insights directly in the dashboard.
- **Real-time mutation toggling** — Sub-50 ms inference against 21 organ-specific models via a FastAPI backend, so users instantly see the impact of flipping a mutation on or off.
- **Temporal simulation** — Gompertz-based timeline modeling of metastatic spread with treatment-adjusted modes (chemotherapy, oral, etc.).
- **Clinical audit trail** — SHAP interpretability plus a "Genomic Lift" report that validates predictions against published organotropism patterns.

## Tech Stack

**Frontend** — Next.js 15 (App Router) + TypeScript + React 19; Three.js, React Three Fiber, React Three Drei for the 3D viewer; Tailwind CSS v4, Radix UI, lucide-react, Framer Motion; Zustand for client state; Clerk for auth; Anthropic SDK for streaming chat.

**Backend & AI** — FastAPI + Uvicorn inference service; XGBoost + Scikit-learn for 21 organ-specific classifiers; PyTorch + HuggingFace Transformers + Phikon (pathology foundation model) for image embeddings; SHAP for model interpretability; Anthropic Claude (Haiku & Sonnet) for the RAG clinical assistant; Joblib for model serialization.

**Data & Infrastructure** — Supabase (PostgreSQL, auth, storage); Pandas / NumPy / SciPy for data processing; MSK-MET multi-omic dataset as the training corpus; Python 3.9+ / Node.js 18+ runtime.

## Results
- 21 organ-specific XGBoost models deployed, with top performers reaching AUC 0.93 (Female Genital), 0.91 (Male Genital), 0.83 (Bladder) on the MSK-MET cohort.
- Positive **Genomic Lift** on the clinically complex sites where the model needs to read genuine genomic signal rather than shortcuts: Liver (+0.026), Lung (+0.025), CNS/Brain (+0.022), Bone (+0.015).
- Audited against oncological literature for known organotropism (e.g., HER2 → 8.5% Liver Risk Lift; KRAS → Colorectal patterns).
- Multimodal ensemble surfaces per-simulation `visual_lift` to quantify pathology-image influence on each risk estimate.


