#!/usr/bin/env python3
"""Install the portable AutoApply AU skill into Codex or Claude Code."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import uuid

from package_skill import ROOT, SKILL_NAME, skill_files

MANIFEST = ".autoapply-install.json"


def destinations(agent, scope="user", project_dir=None, home=None, environ=None):
    home = Path(home) if home is not None else Path.home()
    environ = os.environ if environ is None else environ
    if scope == "project":
        project = Path(project_dir or Path.cwd()).expanduser().resolve()
        if not project.is_dir():
            raise ValueError("--project-dir must be an existing project directory")
        roots = {"codex": project / ".agents", "claude": project / ".claude"}
    else:
        if project_dir is not None:
            raise ValueError("--project-dir requires --scope project")
        roots = {
            "codex": Path(environ["CODEX_HOME"]).expanduser() if environ.get("CODEX_HOME", "").strip() else home / ".agents",
            "claude": Path(environ["CLAUDE_CONFIG_DIR"]).expanduser() if environ.get("CLAUDE_CONFIG_DIR", "").strip() else home / ".claude",
        }
    chosen = ("codex", "claude") if agent == "both" else (agent,)
    result = []
    for name in chosen:
        target = (roots[name] / "skills" / SKILL_NAME).absolute()
        if any(item["target"].resolve() == target.resolve() for item in result):
            raise ValueError("Codex and Claude destinations coincide; install one agent into that shared directory")
        result.append({"agent": name, "target": target})
    return result


def preflight(source, files, targets, update):
    source = source.resolve()
    for item in targets:
        target = item["target"]
        resolved = target.resolve()
        if resolved.is_relative_to(source) or source.is_relative_to(resolved):
            raise ValueError("Install destination overlaps the skill source")
        if target.is_symlink():
            raise ValueError(f"Refusing a symlinked install destination: {target}")
        for parent in target.parents:
            if parent.exists() and not parent.is_dir():
                raise ValueError(f"Install parent is not a directory: {parent}")
        if target.exists():
            if not target.is_dir():
                raise ValueError(f"Install destination is not a directory: {target}")
            if not update:
                raise ValueError(f"Install already exists: {target}. Use --update to preserve a backup and update published files.")
            backup_root = target.parent.parent / "autoapply-backups"
            if backup_root.is_symlink() or (backup_root.exists() and not backup_root.is_dir()):
                raise ValueError(f"Backup destination must be a real directory: {backup_root}")
            for path in target.rglob("*"):
                if path.is_symlink():
                    raise ValueError(f"Refusing to update a tree containing symlinks: {target}")
            for name in files:
                path = target / name
                if path.exists() and not path.is_file():
                    raise ValueError(f"Published file conflicts with an existing directory: {name}")
                for parent in path.parents:
                    if parent == target:
                        break
                    if parent.exists() and not parent.is_dir():
                        raise ValueError(f"Published directory conflicts with an existing file: {parent.name}")


def discard_stage(stage, expected_parent):
    """Delete only the staging directory this invocation created in its checked parent."""
    if (stage.parent.resolve() != expected_parent.resolve()
            or not stage.name.startswith(f".{SKILL_NAME}.stage-") or stage.is_symlink()):
        raise ValueError("Staging cleanup path failed its boundary check")
    if stage.exists():
        shutil.rmtree(stage)


def install(source, targets, update=False, dry_run=False):
    source = Path(source)
    files = skill_files(source)
    preflight(source, files, targets, update)
    summary = [{"agent": item["agent"], "target": str(item["target"]),
                "action": "update" if item["target"].exists() else "install"} for item in targets]
    if dry_run:
        return {"dry_run": True, "files": len(files), "targets": summary}
    prepared = []
    try:
        # Build every target before swapping any existing install.
        for item, report in zip(targets, summary):
            target = item["target"]
            target.parent.mkdir(parents=True, exist_ok=True)
            stage = Path(tempfile.mkdtemp(prefix=f".{SKILL_NAME}.stage-", dir=target.parent))
            prepared.append((target, stage, report))
            if target.exists():
                if not update:
                    raise ValueError(f"Install destination appeared after preflight; left unchanged: {target}")
                shutil.copytree(target, stage, dirs_exist_ok=True)
            for name, path in files.items():
                destination = stage / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, destination)
            manifest = {"schema_version": 1, "skill": SKILL_NAME,
                        "files": {name: hashlib.sha256((stage / name).read_bytes()).hexdigest() for name in files}}
            (stage / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        for target, stage, report in prepared:
            backup = None
            if target.exists():
                if not update:
                    raise ValueError(f"Install destination appeared after preflight; left unchanged: {target}")
                backup_root = target.parent.parent / "autoapply-backups"
                backup_root.mkdir(parents=True, exist_ok=True)
                stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                backup = backup_root / f"{SKILL_NAME}-{stamp}-{uuid.uuid4().hex[:8]}"
                # Both absolute paths share the explicitly selected config directory.
                if (backup.parent.resolve() != backup_root.resolve()
                        or backup_root.resolve().parent != target.parent.parent.resolve()
                        or target.parent.name != "skills"):
                    raise ValueError("Backup move failed its destination boundary check")
                target.rename(backup)
                report["backup"] = str(backup)
            try:
                stage.rename(target)
            except OSError:
                if backup is not None and not target.exists():
                    backup.rename(target)
                raise
            report["completed"] = True
        return {"dry_run": False, "files": len(files), "targets": summary}
    except OSError as exc:
        # Existing originals are retained in the reported backup locations.
        raise OSError(f"Install did not finish: {exc}. Recovery details: {json.dumps(summary)}") from exc
    finally:
        for target, stage, _ in prepared:
            discard_stage(stage, target.parent)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--agent", choices=("codex", "claude", "both"), required=True)
    parser.add_argument("--scope", choices=("user", "project"), default="user")
    parser.add_argument("--project-dir", type=Path, help="Existing project directory for --scope project; defaults to the working directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print destinations without creating files")
    parser.add_argument("--update", action="store_true", help="Update only published files, preserving unknown files and an original-directory backup")
    args = parser.parse_args(argv)
    try:
        targets = destinations(args.agent, args.scope, args.project_dir)
        print(json.dumps(install(ROOT / SKILL_NAME, targets, args.update, args.dry_run)))
        return 0
    except (ValueError, OSError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
