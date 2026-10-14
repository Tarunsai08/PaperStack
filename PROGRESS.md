# PaperStack build progress

Each session continues from here. Tick items as they land, and commit after each phase or article batch.

Validate content with `python pipeline/build_index.py` (`--partial` allows links to articles not written yet, `--strict` also fails on length warnings).

## Phases

- [x] **Phase 1: Foundation and design system**
  - [x] Vite + React + TS + Tailwind, bundled fonts, light/dark/sepia theme tokens
  - [x] Tab bar, hash routing, page transitions, scroll memory
  - [x] CoverArt (procedural SVG), Skeleton, BottomSheet, ProgressRing
  - [x] MarkdownRenderer: GFM, KaTeX, Mermaid (themed, lazy, error fallback, full-screen pinch zoom), callouts, glossary terms, `article:` links, smart quotes
  - [x] Shared validator: `app/src/lib/frontmatter.ts` + `pipeline/build_index.py`, both tested against `tests/fixtures`
  - [x] `content/tracks.json` + 2 sample articles (1 primer, 1 paper)
- [x] **Phase 2: Seed content** (52 articles, 71,828 words; all pass `build_index.py --strict`)
- [x] **Phase 3: Core screens** (Home, Learn, Track, Article, Search, Library, Settings, Onboarding, streaks, progress; verified end to end in Chromium at 390px)
- [x] **Phase 4: Manual import and content sync** (verified: remote sync against a local copy of the deployed site, prompt copy, validation errors, auto-fix, preview, import into My Additions)
- [x] **Phase 5: Android app and CI** (Capacitor, icons, splash, native plugins, update check, workflows, README)
  - Verified locally with the Android SDK: `assembleDebug` and a keystore-signed `assembleRelease` both build; `aapt2` shows versionCode/versionName injected from Gradle properties; `apksigner` verifies the release signature; all 52 articles are bundled in the APK.
  - Workflows pass `actionlint`. The first real Release and Pages deploy happen on the first push to `main`.
- [x] **Phase 6: Pipeline and automation** (llm.py, fetch, extract, generate, daily workflow, run.sh)
  - 47 pipeline tests (validator, importance scoring, candidate selection, arXiv parsing, section splitting, provider fallback, retries, cache, JSON parsing, full generate flow with a fake model).
  - Integration run in the sandbox: real arXiv metadata + real PDF extraction + real OpenAI SDK against a local fake endpoint wrote a valid article; a re-run skipped it (no duplicates). Without API keys, `generate_article.py` and the daily workflow exit cleanly.
  - Not testable here: real Gemini/Groq calls (no keys in this environment).
- [ ] **Phase 7: Polish and final review**

## Seed articles

### Track 0: Start Here (primers)
- [x] primer-ai-ml-dl-map
- [x] primer-data-features-labels
- [x] primer-loss-functions
- [x] primer-gradient-descent
- [x] primer-classification
- [x] primer-overfitting
- [x] primer-neural-networks
- [x] primer-backprop-intuition
- [x] primer-embeddings
- [x] primer-how-to-read-papers

### Foundations
- [x] paper-turing-test
- [x] paper-perceptron
- [x] paper-backpropagation
- [x] paper-support-vector-networks
- [x] paper-random-forests
- [x] paper-few-useful-things

### Deep learning
- [x] paper-lenet
- [x] paper-deep-autoencoders
- [x] paper-alexnet
- [x] paper-dropout
- [x] paper-adam
- [x] paper-batch-normalization
- [x] paper-resnet
- [x] paper-unet

### Sequences and language
- [x] paper-lstm
- [x] paper-word2vec
- [x] paper-seq2seq
- [x] paper-bahdanau-attention

### Generative
- [x] paper-vae
- [x] paper-gan
- [x] paper-ddpm
- [x] paper-latent-diffusion

### Reinforcement
- [x] paper-dqn
- [x] paper-alphago
- [x] paper-ppo

### Transformers and LLMs
- [x] paper-attention-is-all-you-need
- [x] paper-gpt-1
- [x] paper-bert
- [x] paper-gpt-3
- [x] paper-scaling-laws
- [x] paper-chinchilla
- [x] paper-vit
- [x] paper-clip

### Making LLMs useful
- [x] paper-instructgpt
- [x] paper-chain-of-thought
- [x] paper-rag
- [x] paper-lora
- [x] paper-dpo
- [x] paper-llama

### AI systems
- [x] paper-megatron-lm
- [x] paper-flashattention
- [x] paper-vllm
