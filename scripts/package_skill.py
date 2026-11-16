#!/usr/bin/env python3
"""Build the portable AutoApply AU skill archive using Python's standard library."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import zipfile

SKILL_NAME = "auto-au-applications"
ROOT = Path(__file__).resolve().parents[1]
# An explicit distribution inventory prevents accidentally shipping applicant workspaces.
PUBLISHED_FILES = (
    "SKILL.md", "agents/openai.yaml", "assets/packet.template.json",
    "assets/profile.template.json", "references/application-workflow.md",
    "references/australian-market.md", "references/browser-workflow.md",
    "references/setup.md", "references/upstream-reference.md",
    "scripts/application_tracker.py", "scripts/check_packet.py",
)


def skill_files(source):
    """Return published relative paths only; never discover arbitrary local data."""
    source = Path(source)
    if source.is_symlink() or not source.is_dir():
        raise ValueError("Skill source must be a real directory")
    result = {}
    for name in PUBLISHED_FILES:
        path = source / name
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Missing or symlinked distribution file: {name}")
        for parent in path.parents:
            if parent == source:
                break
            if parent.is_symlink():
                raise ValueError(f"Symlinked distribution path: {name}")
        result[name] = path
    # A downloaded release must retain the repository's licence.
    licence = source / "LICENSE"
    if not licence.exists():
        licence = source.parent / "LICENSE"
    if licence.exists():
        if not licence.is_file() or licence.is_symlink():
            raise ValueError("LICENSE must be a regular file")
        result["LICENSE"] = licence
    return result


def package(source, output, force=False):
    source, output = Path(source).resolve(), Path(output).absolute()
    files = skill_files(source)
    if output.suffix.lower() != ".zip":
        raise ValueError("Archive output must use a .zip extension")
    if output.is_symlink() or output.resolve().is_relative_to(source):
        raise ValueError("Archive output cannot be a symlink or inside the skill source")
    if output.exists() and (not force or not output.is_file()):
        raise ValueError("Output already exists; choose a new path or use --force for an existing ZIP")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".zip", delete=False) as handle:
            temporary = Path(handle.name)
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, path in sorted(files.items()):
                entry = zipfile.ZipInfo(f"{SKILL_NAME}/{name}", date_time=(2020, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, path.read_bytes())
        digest = hashlib.sha256(temporary.read_bytes()).hexdigest()
        if force:
            os.replace(temporary, output)
        else:
            # Exclusive creation also refuses an output created after the preflight.
            with output.open("xb") as handle, temporary.open("rb") as incoming:
                shutil.copyfileobj(incoming, handle)
        return {"archive": str(output.resolve()), "files": len(files), "sha256": digest}
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", default="v0.1.0", help="Version used in the default archive name")
    parser.add_argument("--output", type=Path, help="ZIP destination; defaults to dist/auto-au-applications-VERSION.zip")
    parser.add_argument("--force", action="store_true", help="Replace an existing ZIP at --output")
    args = parser.parse_args(argv)
    if not re.fullmatch(r"v?[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?", args.version):
        parser.error("--version must be a semantic version such as v0.1.0")
    output = args.output or ROOT / "dist" / f"{SKILL_NAME}-{args.version}.zip"
    try:
        print(json.dumps(package(ROOT / SKILL_NAME, output, args.force)))
        return 0
    except (ValueError, OSError, zipfile.BadZipFile) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
