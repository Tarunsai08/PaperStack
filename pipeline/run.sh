#!/usr/bin/env bash
# Generate new PaperStack articles on your own computer.
#
#   ./pipeline/run.sh                          # use whichever providers have keys in .env
#   ./pipeline/run.sh --provider ollama        # local model only (start Ollama first)
#   ./pipeline/run.sh --provider ollama --count 1
#   ./pipeline/run.sh --provider ollama --arxiv 2106.09685
#
# For Ollama, give the model a big enough context window, for example:
#   OLLAMA_CONTEXT_LENGTH=32768 ollama serve
#   ollama pull qwen2.5:14b
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

for arg in "$@"; do
  if [ "$arg" = "ollama" ]; then
    export PAPERSTACK_USE_LOCAL=1
    if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
      echo "Ollama is not running. Start it with: OLLAMA_CONTEXT_LENGTH=32768 ollama serve" >&2
      exit 1
    fi
  fi
done

python3 pipeline/generate_article.py "$@"
python3 pipeline/build_index.py
echo
echo "Review the new files in content/papers/, then commit them:"
echo "  git add content && git commit -m \"[content] New articles\" && git push"
