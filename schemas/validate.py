#!/usr/bin/env python3
"""Validate Rennova example documents against their schemas.

Usage:  python3 schemas/validate.py
Exit:   0 all valid, 1 validation failure, 3 jsonschema not installed.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAIRS = [
    ("schemas/capture-plan.schema.json", "examples/capture-plans/bathroom-renovation.json"),
    ("schemas/job-pack.schema.json", "examples/job-packs/bathroom-renovation-richmond.json"),
]


def main() -> int:
    try:
        import jsonschema
    except ImportError:
        print("jsonschema is not installed. Run: pip install jsonschema", file=sys.stderr)
        return 3

    failures = 0
    for schema_path, example_path in PAIRS:
        schema = json.loads((ROOT / schema_path).read_text())
        instance = json.loads((ROOT / example_path).read_text())
        validator = jsonschema.Draft202012Validator(schema)
        errors = sorted(validator.iter_errors(instance), key=lambda e: list(e.path))
        if errors:
            failures += 1
            print(f"FAIL  {example_path}")
            for error in errors[:20]:
                location = "/".join(str(p) for p in error.path) or "(root)"
                print(f"        {location}: {error.message}")
        else:
            print(f"PASS  {example_path}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
