"""Read-only Badgey editor-startup source controls. Never execute workspace tasks."""

from __future__ import annotations

import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class BadgeyEditorSourceSafety(unittest.TestCase):
    def test_task_list_is_explicitly_inert(self):
        task_file = ROOT / ".vscode/tasks.json"
        self.assertEqual(
            json.loads(task_file.read_text(encoding="utf-8-sig")),
            {"version": "2.0.0", "tasks": []},
        )

    def test_editor_settings_have_no_automatic_task_or_concealment(self):
        settings = json.loads((ROOT / ".vscode/settings.json").read_text(encoding="utf-8-sig"))
        for field in ("task.allowAutomaticTasks", "tasks", "terminal.integrated.hideOnStartup",
                      "debug.openDebug"):
            with self.subTest(field=field):
                self.assertNotIn(field, settings)

    def test_hidden_bootstrap_and_disguised_font_absent(self):
        self.assertFalse((ROOT / ".vscode/ini").exists())
        self.assertFalse((ROOT / "public/fonts/fa-solid-600.ttf").exists())

    def test_config_script_not_hidden(self):
        ignore = (ROOT / ".gitignore").read_text(encoding="utf-8-sig").splitlines()
        rules = {line.strip().lower() for line in ignore
                 if line.strip() and not line.lstrip().startswith("#")}
        self.assertNotIn("config.bat", rules)


if __name__ == "__main__":
    unittest.main()
