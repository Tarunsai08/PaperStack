#!/usr/bin/env python3
"""Mark curriculum entries as written for every article file that exists, and sync track_order.

Run after writing articles by hand:  python tools/mark_written.py
"""
import glob
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
import build_index as bi  # noqa: E402

arts = {}
for p in bi.article_files():
    d, _ = bi.parse_article(p.read_text(encoding="utf-8"))
    arts[d["id"]] = (p, d)
for f in sorted(glob.glob(str(ROOT / "content/curriculum/*.json"))):
    cur = json.load(open(f, encoding="utf-8"))
    changed = False
    for e in cur["entries"]:
        if e["id"] not in arts:
            continue
        path, d = arts[e["id"]]
        if e["status"] != "written":
            e["status"], e["written_by"] = "written", d.get("generated_by")
            changed = True
            print("written:", e["id"])
        if e["subject"] != "ml" and d.get("track_order") != e["order"]:
            s = path.read_text(encoding="utf-8").replace(f"track_order: {d['track_order']}\n", f"track_order: {e['order']}\n", 1)
            path.write_text(s, encoding="utf-8")
            print("track_order:", e["id"], d.get("track_order"), "->", e["order"])
    if changed:
        json.dump(cur, open(f, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
