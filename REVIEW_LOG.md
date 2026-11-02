# Review log: pipeline-generated articles

Articles written by the daily pipeline (`generated_by` starting with `gemini`, `groq` or `ollama`) are reviewed against the same bar as the Claude-written ones and rewritten when they fall below it. Rewrites keep `id`, `slug` and `paper_url`, check facts against the paper, and set `generated_by: "claude-revised"`.

## Rubric

Each criterion is scored 0-10: hook, central analogy (introduced and reused), intuition before maths, structure and paragraph length, diagrams, callouts, glossary use, quiz, factual accuracy, length, no filler.

- **Heuristic score** comes from `python tools/review_score.py` (structure, callouts, analogy reuse, paragraph length, filler words, length). It cannot judge accuracy or real engagement. For reference, the 52 Claude-written ML articles average **9.7**.
- **Editorial score** is a human-style read for clarity, engagement, analogy quality and accuracy. It is the score that decides a rewrite (bar: 8).

Calibration read (`paper-going-deeper-with-convolutions`): readable and correctly structured, but the analogy maps loosely onto the idea, jargon arrives before intuition in places, paragraphs run long, and filler words appear. Typical editorial score for this batch: about 6-7. **Decision: every pipeline article gets a full rewrite**, prioritising the 8 that exceed the length limit (they fail `build_index.py --strict`).

## Status

| Article | Words | Heuristic before | Editorial before | After | Status | Notes |
|---|---|---|---|---|---|---|
| `paper-going-deeper-with-convolutions` | 2107 | 8.6 | | | pending | |
| `paper-the-llama-3-herd-of-models` | 1695 | 8.6 | | | pending | |
| `paper-efficient-streaming-language-models-with-attention-sinks` | 2294 (over length) | 8.7 | | | pending | |
| `paper-high-resolution-image-synthesis-and-semantic-manipulation-wi` | 1980 | 8.7 | | | pending | |
| `paper-stop-explaining-black-box-machine-learning-models-for-high-s` | 2226 (over length) | 8.7 | | | pending | |
| `paper-aggregated-residual-transformations-for-deep-neural-networks` | 2279 (over length) | 8.8 | | | pending | |
| `paper-bertopic-neural-topic-modeling-with-a-class-based-tf-idf-pro` | 2273 (over length) | 8.9 | | | pending | |
| `paper-blip-2-bootstrapping-language-image-pre-training-with-frozen` | 2191 | 8.9 | | | pending | |
| `paper-distributed-representations-of-words-and-phrases-and-their-c` | 2262 (over length) | 8.9 | | | pending | |
| `paper-unet-redesigning-skip-connections-to-exploit-multiscale-feat` | 2132 | 8.9 | | | pending | |
| `paper-inception-v4-inception-resnet-and-the-impact-of-residual-con` | 1716 | 9.0 | | | pending | |
| `paper-minigpt-4-enhancing-vision-language-understanding-with-advan` | 2076 | 9.1 | | | pending | |
| `paper-nnu-net-a-self-configuring-method-for-deep-learning-based-bi` | 2012 | 9.1 | | | pending | |
| `paper-denoising-diffusion-implicit-models` | 2227 (over length) | 9.2 | | | pending | |
| `paper-quantization-and-training-of-neural-networks-for-efficient-i` | 2044 | 9.2 | | | pending | |
| `paper-training-data-efficient-image-transformers-distillation-thro` | 2010 | 9.2 | | | pending | |
| `paper-improved-denoising-diffusion-probabilistic-models` | 2211 (over length) | 9.3 | | | pending | |
| `paper-self-consistency-improves-chain-of-thought-reasoning-in-lang` | 1677 | 9.3 | | | pending | |
| `paper-a-survey-of-large-language-models` | 2044 | 9.4 | | | pending | |
| `paper-blip-bootstrapping-language-image-pre-training-for-unified-v` | 2148 | 9.4 | | | pending | |
| `paper-large-language-models-encode-clinical-knowledge` | 1766 | 9.4 | | | pending | |
| `paper-real-time-single-image-and-video-super-resolution-using-an-e` | 2087 | 9.4 | | | pending | |
| `paper-elucidating-the-design-space-of-diffusion-based-generative-m` | 1991 | 9.5 | | | pending | |
| `paper-tree-of-thoughts-deliberate-problem-solving-with-large-langu` | 1899 | 9.5 | | | pending | |
| `paper-learning-phrase-representations-using-rnn-encoder-decoder-fo` | 1873 | 9.6 | | | pending | |
| `paper-swin-transformer-hierarchical-vision-transformer-using-shift` | 2009 | 9.6 | | | pending | |
| `paper-taming-transformers-for-high-resolution-image-synthesis` | 2211 (over length) | 9.6 | | | pending | |
| `paper-opt-open-pre-trained-transformer-language-models` | 1918 | 9.7 | | | pending | |
| `paper-large-language-models-are-zero-shot-reasoners` | 1565 | 9.9 | | | pending | |
| `paper-enriching-word-vectors-with-subword-information` | 2103 | 10.0 | | | pending | |
| `paper-thumbs-up-sentiment-classification-using-machine-learning-te` | 1759 | 10.0 | | | pending | |
