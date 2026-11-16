import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import install as installer
import package_skill as packaging
sys.path.pop(0)


class DistributionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.source = self.base / packaging.SKILL_NAME
        for name in packaging.PUBLISHED_FILES:
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("version one\n", encoding="utf-8")
        (self.base / "LICENSE").write_text("Example licence\n", encoding="utf-8")
        self.home = self.base / "home"
        self.home.mkdir()

    def targets(self, agent="both", **kwargs):
        return installer.destinations(agent, home=self.home, environ={}, **kwargs)

    def test_user_and_project_paths_and_environment_overrides(self):
        paths = self.targets()
        self.assertEqual(self.home / ".agents/skills/auto-au-applications", paths[0]["target"])
        self.assertEqual(self.home / ".claude/skills/auto-au-applications", paths[1]["target"])
        overrides = installer.destinations("both", home=self.home, environ={
            "CODEX_HOME": str(self.base / "custom-codex"),
            "CLAUDE_CONFIG_DIR": str(self.base / "custom-claude")})
        self.assertEqual(self.base / "custom-codex/skills/auto-au-applications", overrides[0]["target"])
        project = self.targets(scope="project", project_dir=self.base)
        # Project roots are canonicalised, including macOS /var and Windows short-name aliases.
        project_root = self.base.resolve()
        self.assertEqual(project_root / ".agents/skills/auto-au-applications", project[0]["target"])
        self.assertEqual(project_root / ".claude/skills/auto-au-applications", project[1]["target"])

    def test_dry_run_creates_nothing_and_real_install_has_all_published_files(self):
        targets = self.targets()
        report = installer.install(self.source, targets, dry_run=True)
        self.assertTrue(report["dry_run"])
        self.assertEqual([], list(self.home.iterdir()))
        installer.install(self.source, targets)
        for item in targets:
            self.assertTrue((item["target"] / "SKILL.md").is_file())
            self.assertTrue((item["target"] / "LICENSE").is_file())
            self.assertFalse((item["target"] / "tests").exists())

    def test_conflict_in_second_target_prevents_first_target_mutation(self):
        targets = self.targets()
        occupied = targets[1]["target"]
        occupied.mkdir(parents=True)
        (occupied / "private.txt").write_text("preserve", encoding="utf-8")
        with self.assertRaises(ValueError):
            installer.install(self.source, targets)
        self.assertFalse(targets[0]["target"].parent.exists())
        self.assertEqual("preserve", (occupied / "private.txt").read_text(encoding="utf-8"))

    def test_update_preserves_unknown_files_and_recoverable_backup(self):
        targets = self.targets("codex")
        installer.install(self.source, targets)
        target = targets[0]["target"]
        private = target / "application-data" / "profile.json"
        private.parent.mkdir()
        private.write_text('{"private":"preserve"}', encoding="utf-8")
        (target / "custom.txt").write_text("extra", encoding="utf-8")
        (self.source / "SKILL.md").write_text("version two", encoding="utf-8")
        report = installer.install(self.source, targets, update=True)
        self.assertEqual("version two", (target / "SKILL.md").read_text(encoding="utf-8"))
        self.assertEqual('{"private":"preserve"}', private.read_text(encoding="utf-8"))
        self.assertEqual("extra", (target / "custom.txt").read_text(encoding="utf-8"))
        backup = Path(report["targets"][0]["backup"])
        self.assertEqual("version one\n", (backup / "SKILL.md").read_text(encoding="utf-8"))
        self.assertEqual(private.read_bytes(), (backup / "application-data/profile.json").read_bytes())
        self.assertEqual(target.parent.parent / "autoapply-backups", backup.parent)
        self.assertFalse(backup.is_relative_to(target.parent))

    def test_failed_replacement_restores_original_directory(self):
        targets = self.targets("codex")
        installer.install(self.source, targets)
        target = targets[0]["target"]
        original = Path.rename

        def fail_stage(path, destination):
            if path.name.startswith(".auto-au-applications.stage-"):
                raise PermissionError("simulated blocked rename")
            return original(path, destination)

        with mock.patch.object(Path, "rename", fail_stage), self.assertRaises(OSError):
            installer.install(self.source, targets, update=True)
        self.assertEqual("version one\n", (target / "SKILL.md").read_text(encoding="utf-8"))
        self.assertFalse(any(target.parent.glob(".auto-au-applications.stage-*")))

    def test_destination_appearing_during_staging_is_preserved_without_update(self):
        targets = self.targets("codex")
        target = targets[0]["target"]
        original = installer.shutil.copy2

        def create_conflict(source, destination):
            if not target.exists():
                target.mkdir()
                (target / "private.txt").write_text("preserve", encoding="utf-8")
            return original(source, destination)

        with mock.patch.object(installer.shutil, "copy2", side_effect=create_conflict), self.assertRaises(ValueError):
            installer.install(self.source, targets)
        self.assertEqual("preserve", (target / "private.txt").read_text(encoding="utf-8"))
        self.assertFalse((target / "SKILL.md").exists())

    def test_archive_is_rooted_clean_and_deterministic(self):
        for name in ("profile.json", "applications.json", "application-data/cv.pdf",
                     "tests/private.py", "scripts/__pycache__/cache.pyc", "references/private.json"):
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("DO NOT PUBLISH", encoding="utf-8")
        first, second = self.base / "first.zip", self.base / "second.zip"
        packaging.package(self.source, first)
        packaging.package(self.source, second)
        self.assertEqual(first.read_bytes(), second.read_bytes())
        with zipfile.ZipFile(first) as archive:
            names = archive.namelist()
            expected = {f"auto-au-applications/{name}" for name in packaging.PUBLISHED_FILES} | {"auto-au-applications/LICENSE"}
            self.assertEqual(expected, set(names))
            self.assertTrue(all(not name.startswith(("/", "\\")) and ".." not in Path(name).parts for name in names))
            self.assertTrue(all(b"DO NOT PUBLISH" not in archive.read(name) for name in names))

    def test_archive_no_overwrite_without_force(self):
        output = self.base / "skill.zip"
        output.write_bytes(b"preserve")
        with self.assertRaises(ValueError):
            packaging.package(self.source, output)
        self.assertEqual(b"preserve", output.read_bytes())
        packaging.package(self.source, output, force=True)
        self.assertTrue(zipfile.is_zipfile(output))

    def test_installer_cli_uses_isolated_home_and_config_environment(self):
        environ = dict(os.environ, HOME=str(self.home), USERPROFILE=str(self.home))
        environ.pop("CODEX_HOME", None)
        environ.pop("CLAUDE_CONFIG_DIR", None)
        result = subprocess.run([sys.executable, str(ROOT / "scripts/install.py"), "--agent", "both", "--dry-run"],
                                env=environ, capture_output=True, text=True, check=True)
        destinations = json.loads(result.stdout)["targets"]
        self.assertEqual(str(self.home / ".agents/skills/auto-au-applications"), destinations[0]["target"])
        self.assertEqual(str(self.home / ".claude/skills/auto-au-applications"), destinations[1]["target"])
        self.assertEqual([], list(self.home.iterdir()))


if __name__ == "__main__":
    unittest.main()
