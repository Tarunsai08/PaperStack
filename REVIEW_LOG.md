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
| `paper-going-deeper-with-convolutions` | 2107 | 8.6 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Venue/year fixed to CVPR 2015 (arXiv 2014); full author name. One newsroom-briefing analogy replaces the loose inspection-team one. 1x1 cost table recomputed (120.4M vs 12.4M multiply-adds); GAP weight count; unverifiable VGG/param-count table and single-crop numbers removed, claims kept to the paper (12x fewer params than AlexNet, 1.5B multiply-adds, 6.67% top-5, 0.6% GAP gain). |
| `paper-the-llama-3-herd-of-models` | 1695 | 8.6 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Removed inconsistent failure-breakdown table, benchmark table and the wrong Llama 2 token count. Banquet-kitchen analogy reused throughout; 6ND compute check (3.8e25, matches paper); GQA KV-cache arithmetic from the 405B config. Interruption stats and DPO details kept qualitative. |
| `paper-efficient-streaming-language-models-with-attention-sinks` | 2294 (over length) | 8.7 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Author name corrected (Guangxuan Xiao); venue ICLR 2024. Classroom analogy; cache-contents table; clear "no long-term memory" warning; facts limited to the abstract (4M tokens, 22.2x). |
| `paper-high-resolution-image-synthesis-and-semantic-manipulation-wi` | 1980 | 8.7 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Venue/year fixed to CVPR 2018. Mural-and-three-critics analogy; receptive-field table across the pyramid (illustrative 70 px patch); feature-matching worked example. Exact mIoU/preference percentages and embedding size removed as unverified; results kept qualitative. |
| `paper-stop-explaining-black-box-machine-learning-models-for-high-s` | 2226 (over length) | 8.7 | 6 | 9.8 heuristic, 8.5+ editorial | rewritten | Venue/year Nature Machine Intelligence 2019. Sealed-machine-vs-checklist analogy; made-up scoring table clearly labelled; arguments structured; incentives section. |
| `paper-aggregated-residual-transformations-for-deep-neural-networks` | 2279 (over length) | 8.8 | 7 | 9.7 heuristic, 8.5+ editorial | rewritten | Venue CVPR 2017. Review-team analogy; exact weight counts per block (69.6k vs 70.1k) and widening cost; claims match the abstract (2nd place ILSVRC 2016). |
| `paper-bertopic-neural-topic-modeling-with-a-class-based-tf-idf-pro` | 2273 (over length) | 8.9 | 6 | 9.5 heuristic, 8.5+ editorial | rewritten | Author name expanded. Post-room analogy; c-TF-IDF formula with symbols and a computed example; topic-count and when-to-use sections. |
| `paper-blip-2-bootstrapping-language-image-pre-training-with-frozen` | 2191 | 8.9 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Venue ICML 2023; full authors. Fixed wrong 108M trainable-parameter claim (54x matches the 188M Q-Former). Photographer, assistant and 32 index cards analogy; bottleneck size table (263,168 vs 24,576 numbers); attention masks per objective explained. Unverified NoCaps score removed. |
| `paper-distributed-representations-of-words-and-phrases-and-their-c` | 2262 (over length) | 8.9 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Re-tracked to Teaching Machines Language; venue NeurIPS. New spice-kitchen analogy reused; worked subsampling table; phrase score explained; claims kept qualitative; links to fastText and CLIP. |
| `paper-unet-redesigning-skip-connections-to-exploit-multiscale-feat` | 2132 | 8.9 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | First author name fixed (Zongwei Zhou), full author list. School-stages analogy covers both semantic gap and pruning; worked node X0,2 channel table; pruning node-count table. Unverified IoU, speed and memory percentages removed; findings kept qualitative. |
| `paper-inception-v4-inception-resnet-and-the-impact-of-residual-con` | 1716 | 9.0 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Venue/year fixed to AAAI 2017; full authors. Editing-desks analogy (retype vs margin notes vs light pencil); residual-scaling worked example and variance exercise. Removed unverifiable error table and the incorrect Llama residual-scaling claim; 3.08% ensemble result kept from the abstract. |
| `paper-minigpt-4-enhancing-vision-language-understanding-with-advan` | 2076 | 9.1 | | | pending | |
| `paper-nnu-net-a-self-configuring-method-for-deep-learning-based-bi` | 2012 | 9.1 | | | pending | |
| `paper-denoising-diffusion-implicit-models` | 2227 (over length) | 9.2 | 6 | 9.8 heuristic, 8.5+ editorial | rewritten | Re-tracked to Machines That Create; venue ICLR 2021. Mountain-road analogy; equations with every symbol explained; one-pixel worked example; inversion section. |
| `paper-quantization-and-training-of-neural-networks-for-efficient-i` | 2044 | 9.2 | | | pending | |
| `paper-training-data-efficient-image-transformers-distillation-thro` | 2010 | 9.2 | | | pending | |
| `paper-improved-denoising-diffusion-probabilistic-models` | 2211 (over length) | 9.3 | 6 | 10.0 heuristic, 8.5+ editorial | rewritten | Re-tracked to Machines That Create. Engine-tuning analogy; learned variance, hybrid loss, cosine schedule explained with symbols; importance sampling explained; no invented numbers. |
| `paper-self-consistency-improves-chain-of-thought-reasoning-in-lang` | 1677 | 9.3 | | | pending | |
| `paper-a-survey-of-large-language-models` | 2044 | 9.4 | | | pending | |
| `paper-blip-bootstrapping-language-image-pre-training-for-unified-v` | 2148 | 9.4 | | | pending | |
| `paper-large-language-models-encode-clinical-knowledge` | 1766 | 9.4 | | | pending | |
| `paper-real-time-single-image-and-video-super-resolution-using-an-e` | 2087 | 9.4 | | | pending | |
| `paper-elucidating-the-design-space-of-diffusion-based-generative-m` | 1991 | 9.5 | | | pending | |
| `paper-tree-of-thoughts-deliberate-problem-solving-with-large-langu` | 1899 | 9.5 | | | pending | |
| `paper-learning-phrase-representations-using-rnn-encoder-decoder-fo` | 1873 | 9.6 | | | pending | |
| `paper-swin-transformer-hierarchical-vision-transformer-using-shift` | 2009 | 9.6 | | | pending | |
| `paper-taming-transformers-for-high-resolution-image-synthesis` | 2211 (over length) | 9.6 | 6 | 9.5 heuristic, 8.5+ editorial | rewritten | Venue CVPR 2021. Mosaic-tile analogy; sequence-length table; bits-per-image estimate; clear two-stage diagram; VQGAN+CLIP and latent diffusion history. |
| `paper-opt-open-pre-trained-transformer-language-models` | 1918 | 9.7 | | | pending | |
| `paper-large-language-models-are-zero-shot-reasoners` | 1565 | 9.9 | | | pending | |
| `paper-enriching-word-vectors-with-subword-information` | 2103 | 10.0 | | | pending | |
| `paper-thumbs-up-sentiment-classification-using-machine-learning-te` | 1759 | 10.0 | | | pending | |
