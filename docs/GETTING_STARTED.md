# Getting started

AutoApply AU runs inside Codex or Claude Code. It adds a reusable workflow; your host supplies the model and any search, browser or document capabilities.

## Requirements

- Codex or Claude Code with local skill and file access.
- Python 3.10 or newer for the installer and local helpers.
- Search access for discovering current jobs. Browser/computer-use access for filling forms.
- Your CV, study-completion details, preferences and confirmed work-rights facts when relevant.

The Python scripts have no third-party dependencies and need no API key. Your host may require its own account, subscription, tool configuration or permissions. Installing this skill does not configure those.

## Install from the repository

Clone or download [AutoApplyAU](https://github.com/Minhhh13/AutoApplyAU), then open a terminal in the extracted repository folder:

```sh
python3 scripts/install.py --agent both
```

On Windows, use `py -3` in place of `python3`. Choose `--agent codex` or `--agent claude` if needed. Inspect the destinations first with `--dry-run`.

The standard personal destinations are:

| Agent | Personal installation | Project installation |
|---|---|---|
| Codex | `~/.agents/skills/auto-au-applications` | `.agents/skills/auto-au-applications` |
| Claude Code | `~/.claude/skills/auto-au-applications` | `.claude/skills/auto-au-applications` |

The installer honours `CLAUDE_CONFIG_DIR` for Claude. An explicit `CODEX_HOME` selects that host's `skills` directory as a compatibility option. Use the path your host actually discovers; avoid duplicate same-named copies in multiple search locations.

To install only inside a project:

```sh
python3 scripts/install.py --agent both --scope project --project-dir /path/to/your/project
```

After pulling a later release, update the installed skill with:

```sh
python3 scripts/install.py --agent both --update
```

Keep real applicant data outside the installed skill folder. The installer is not a data migration tool. See its `--help` output for conflict handling and backup behaviour.

## Manual installation

Download [auto-au-applications.zip](https://github.com/Minhhh13/AutoApplyAU/releases/latest/download/auto-au-applications.zip) and extract it. Copy the complete `auto-au-applications` folder into your agent's skills directory from the table above. `SKILL.md`, `scripts`, `assets` and `references` must stay together.

The standalone ZIP contains the skill, not the repository-level installer. You can use manual installation without cloning the source repository. Availability in Claude web/Cowork depends on that product's current skill-import and tool support; local Claude Code installation alone does not install it there.

## First run

Open a fresh chat after installation if the skill is not detected immediately. In Codex:

```text
Use $auto-au-applications. Set up a profile using my CV and transcript.
My application files should go in ./application-data.
Ask only for missing information, then shortlist Australian roles matching me.
```

In Claude Code, invoke `/auto-au-applications` with the same request. Provide your real degree, qualification-completion date, location preferences and availability. The agent should leave unknowns unresolved and ask when they matter.

The skill creates `profile.json`, a local JSON tracker and a folder per application. Both agents can share the same chosen data directory. You can request CSV tracker exports as needed.

## First batch

After reviewing the shortlist:

```text
Prepare and fill the three eligible roles I selected. Leave them at final review.
```

Or, for a specific reviewed batch:

```text
Submit these two reviewed applications. Use my confirmed facts and choices,
and record the actual confirmation for each.
```

Missing required facts, login/MFA/CAPTCHA or unfamiliar material choices can need your input. The agent saves progress and continues independent work when possible.

## Troubleshooting

| Problem | Next step |
|---|---|
| `python` opens the Microsoft Store | Try `py -3 --version`; install a supported Python version if absent. |
| Skill does not appear | Check the complete folder is in the host's discovered directory; open a new chat/session. |
| Existing installation conflict | Inspect it first; use `--update` only for an intended update. |
| No browser tools | Use shortlist/document mode and the generated field mapping; enable supported host browser tools for form filling. |
| Board access blocked | Use the employer page or supply the listing URL; the agent reports the access gap. |
| Submission outcome uncertain | Reconcile portal history or a receipt before retrying. |
| Two agents edit the same application | Give one agent ownership of the portal session and record; parallelise research separately. |

See [example prompts](EXAMPLES.md) and [validation notes](VALIDATION.md).
