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
- [ ] **Phase 2: Seed content** (52 articles, see checklist below)
- [ ] **Phase 3: Core screens** (Home, Learn, Track, Article, Search, Library, Settings, Onboarding, streaks, progress)
- [ ] **Phase 4: Manual import and content sync**
- [ ] **Phase 5: Android app and CI** (Capacitor, icons, splash, native plugins, update check, workflows, README)
- [ ] **Phase 6: Pipeline and automation** (llm.py, fetch, extract, generate, daily workflow, run.sh)
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
- [ ] paper-batch-normalization
- [ ] paper-resnet
- [ ] paper-unet

### Sequences and language
- [ ] paper-lstm
- [ ] paper-word2vec
- [ ] paper-seq2seq
- [ ] paper-bahdanau-attention

### Generative
- [ ] paper-vae
- [ ] paper-gan
- [ ] paper-ddpm
- [ ] paper-latent-diffusion

### Reinforcement
- [ ] paper-dqn
- [ ] paper-alphago
- [ ] paper-ppo

### Transformers and LLMs
- [x] paper-attention-is-all-you-need
- [ ] paper-gpt-1
- [ ] paper-bert
- [ ] paper-gpt-3
- [ ] paper-scaling-laws
- [ ] paper-chinchilla
- [ ] paper-vit
- [ ] paper-clip

### Making LLMs useful
- [ ] paper-instructgpt
- [ ] paper-chain-of-thought
- [ ] paper-rag
- [ ] paper-lora
- [ ] paper-dpo
- [ ] paper-llama

### AI systems
- [ ] paper-megatron-lm
- [ ] paper-flashattention
- [ ] paper-vllm
