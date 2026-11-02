#!/usr/bin/env python3
"""Compile every runnable ```cpp block in content/ with g++ -std=c++17.

A fence written as ```cpp is runnable and must compile on its own (include its headers).
A fence written as ```cpp partial is an intentional fragment and is skipped.
Exit code 1 if any block fails.

Usage: python tools/check_cpp.py [files...]   (default: every article)
"""
from __future__ import annotations

import concurrent.futures as cf
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
import build_index as bi  # noqa: E402

GXX = os.environ.get("CXX", "g++")


def compile_block(code: str) -> str | None:
    with tempfile.NamedTemporaryFile("w", suffix=".cpp", delete=False) as f:
        f.write(code)
        name = f.name
    try:
        r = subprocess.run([GXX, "-std=c++17", "-fsyntax-only", "-Wall", name], capture_output=True, text=True, timeout=120)
        return None if r.returncode == 0 else r.stderr.replace(name, "<block>")
    finally:
        os.unlink(name)


def blocks(paths: list[Path]):
    for p in paths:
        try:
            _, body = bi.parse_article(p.read_text(encoding="utf-8"))
        except bi.ParseError:
            continue
        for i, (info, code) in enumerate(bi.cpp_blocks(body), 1):
            if "partial" not in info.split():
                yield p, i, code


def main(argv: list[str]) -> int:
    paths = [Path(a) for a in argv] or bi.article_files()
    jobs = list(blocks(paths))
    failed = 0
    with cf.ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as ex:
        for (p, i, _), res in zip(jobs, ex.map(lambda j: compile_block(j[2]), jobs)):
            if res:
                failed += 1
                print(f"FAIL {p.relative_to(ROOT) if p.is_absolute() else p} block {i}:\n{res[:2000]}")
    print(f"C++ check: {len(jobs) - failed}/{len(jobs)} runnable blocks compile.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
