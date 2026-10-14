"""Structured JSON-lines logging for pipeline runs: logs/run-<date>.jsonl."""
from __future__ import annotations

import datetime as dt
import json
import os
import sys
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"


def log_event(event: str, **fields) -> None:
    record = {"ts": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "event": event, **fields}
    line = json.dumps(record, ensure_ascii=False, default=str)
    if os.environ.get("PAPERSTACK_LOG_STDOUT", "1") == "1":
        print(line, file=sys.stderr)
    if os.environ.get("PAPERSTACK_NO_LOG_FILE") == "1":
        return
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_DIR / f"run-{dt.date.today().isoformat()}.jsonl", "a", encoding="utf-8") as f:
        f.write(line + "\n")
