from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent
VENDOR_DIR = ROOT_DIR / ".vendor"

for candidate in (VENDOR_DIR, ROOT_DIR):
    if candidate.exists():
        candidate_str = str(candidate)
        if candidate_str not in sys.path:
            sys.path.insert(0, candidate_str)
