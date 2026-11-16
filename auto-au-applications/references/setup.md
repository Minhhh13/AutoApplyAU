# AutoApply AU setup and invocation

AutoApply AU is an Agent Skill for Codex and Claude Code. The model follows its workflow using the host's available search, browser and document tools. Bundled Python helpers maintain local records and check application packets. Use Python 3.10 or newer for this project; the scripts use only its standard library and require no API keys. Access to a host model and its tools is configured separately and may require a subscription or paid API access.

## Prerequisites

- A configured Codex or Claude Code installation with model access and permission to read the chosen job-search directory and run local Python helpers.
- A working Python 3.10+ interpreter: check `python3 --version` on macOS/Linux, `py -3 --version` on Windows, or `python --version` if that command resolves to a supported version.
- Search or browsing tools for current opportunity research. **Form filling and submission also require an enabled host browser/computer-use integration.** Installing this skill does not install that integration or grant account/tool permissions.
- Appropriate document/export tools to produce the employer's requested CV and supporting files. Without an exporter, the agent can produce an editable draft and identify the remaining conversion step.

The skill does not depend on the upstream project's Chrome extension or a particular model. If form-control tools are unavailable, it can still research roles, prepare documents and provide a field-by-field handoff.

## Install from the repository

Clone [Minhhh13/AutoApplyAU](https://github.com/Minhhh13/AutoApplyAU), or choose **Code → Download ZIP** on GitHub and extract the archive. Open a terminal in the repository root containing both `scripts/install.py` and the `auto-au-applications` folder.

With Git:

```text
git clone https://github.com/Minhhh13/AutoApplyAU.git
cd AutoApplyAU
```

Install for both products under your user account:

macOS/Linux:

```text
python3 scripts/install.py --agent both --dry-run
python3 scripts/install.py --agent both
```

Windows:

```text
py -3 scripts/install.py --agent both --dry-run
py -3 scripts/install.py --agent both
```

Use `--agent codex` or `--agent claude` for only one product. `--dry-run` previews destinations without installing. For a project-scoped installation, choose the project directory explicitly:

```text
python3 scripts/install.py --agent both --scope project --project-dir "/absolute/path/to/MY_JOB_SEARCH"
```

On Windows, use `py -3` and a path such as `"C:\path\to\MY_JOB_SEARCH"`. `MY_JOB_SEARCH` denotes your chosen directory; substitute a real path. Keep private applicant data out of any repository you share.

An existing destination is preserved unless you supply `--update`. After obtaining the latest repository files, rerun with the same agent/scope options plus `--update` to replace the published skill files. The installer preserves other existing files and keeps the previous installation in an `autoapply-backups` directory outside skill discovery; inspect its output for the exact backup path. It rejects symlinked installation trees. Avoid loading multiple copies with the same skill name.

## Installation locations and standalone skill archives

The installer copies the entire published skill, preserving `SKILL.md`, references, assets and helper scripts. Its default locations are:

| Product | User scope | Project scope |
|---|---|---|
| Codex | `~/.agents/skills/auto-au-applications` | `<project>/.agents/skills/auto-au-applications` |
| Claude Code | `~/.claude/skills/auto-au-applications` | `<project>/.claude/skills/auto-au-applications` |

`~` means your home directory. For configured hosts, the installer honours an explicit `CODEX_HOME` by using `<CODEX_HOME>/skills/auto-au-applications`, and `CLAUDE_CONFIG_DIR` by using `<CLAUDE_CONFIG_DIR>/skills/auto-au-applications` for user scope. `CODEX_HOME/skills` is a compatibility path for hosts using that layout; current public Codex discovery documentation lists `~/.agents/skills`. Use the dry run to inspect the destination and the skill selector to confirm discovery. Do not add a second copy to another location merely to troubleshoot a stale session.

If you downloaded a **skill-only ZIP**, extract it and manually copy the complete `auto-au-applications` folder into the appropriate location above. Confirm the final path is `<skills-directory>/auto-au-applications/SKILL.md`, with no extra nested archive folder. The repository-level installer is separate from the skill's own `scripts/` directory and may not be present in a skill-only archive; obtain the full repository to use `scripts/install.py`.

The installer does not modify host permissions, install a model or enable browser access. Codex-specific `agents/openai.yaml` provides display metadata; both products use the same `SKILL.md`. Normal automatic skill selection remains enabled. A Claude web/Cowork upload follows that product's current import and tool support; installing a local Claude Code skill does not establish availability in a separate cloud session.

## Invoke and start a search

Invoke in Codex with `$auto-au-applications`, in Claude Code with `/auto-au-applications`, or request the workflow naturally. If a new skill does not appear, reload skills or start a fresh session as supported by the host.

Choose a private job-search directory that both products can access. Supply your CV, transcript and preferences for an actual search. The agent copies a blank profile template, imports confirmed facts and asks only for missing information needed for the work. You can begin discovery without contact details. Existing documents may stay in their original location; the profile can refer to their absolute paths.

Example Codex prompt:

```text
Use $auto-au-applications. Use MY_JOB_SEARCH under my current working directory
for application data and set up my profile from the CV and transcript I provide.
Find Australian internships and graduate programs matching my confirmed degree,
completion date, availability, work rights and location preferences. Search
Prosple, Indeed, GradConnection/SEEK and LinkedIn, verify employer requirements,
and shortlist up to 10 relevant opportunities.
```

In Claude Code, replace `$auto-au-applications` with `/auto-au-applications`. `MY_JOB_SEARCH` is an example folder name, not a bundled applicant profile.

Further examples:

```text
Prepare and fill the three eligible applications I selected. Leave them at review.

Submit these two reviewed applications using my confirmed profile and choices.
Continue without another confirmation unless a new material decision is needed.

Resume my Australian application tracker. Reconcile pending submissions first,
then prepare the next five eligible roles in my selected queue.

Give me timed practice for numerical reasoning and track what I get wrong.
```

A saved profile supplies factual context; the user's instruction controls which applications may be sent. Missing browser access, login or an unsupported portal should produce a concrete handoff while other authorised work continues. Passing helper tests does not certify every employer's live application form.

## Official product references

Checked 16 November 2026; recheck current product documentation when resolving installation differences:

- [Codex local skill discovery and authoring](https://learn.chatgpt.com/docs/build-skills)
- [OpenAI skill structure](https://developers.openai.com/plugins/concepts/skills)
- [Claude Code skills and installation scopes](https://code.claude.com/docs/en/skills)
- [Claude Code configuration-directory override](https://code.claude.com/docs/en/settings)
