# Contributing

Thanks for helping make Australian early-careers applications easier to navigate.

Useful contributions include source/redirect updates, clearer eligibility examples, portable helper fixes and reproducible portal issues. Keep changes grounded in an observed problem. Avoid adding universal rules based on one employer's requirements.

## Local checks

Use Python 3.10 or newer. The scripts and tests use the standard library.

```sh
python3 -m unittest discover -s auto-au-applications/tests -v
python3 -m unittest discover -s tests -v
python3 scripts/install.py --agent both --dry-run
python3 scripts/package_skill.py --help
```

On Windows use `py -3` in place of `python3`. Follow the CLI help for packaging an output without replacing a previous archive.

For changes to the browser extension, run the [Chromium tests](docs/VALIDATION.md#browser-extension-coverage). Use fictional applicants and local test forms. Build the installable ZIP with `python3 scripts/package_skill.py --extension`.

## Keep instructions and helpers aligned

- Keep `SKILL.md` focused; put conditional detail in references.
- Preserve unknown applicant facts and original evidence.
- Check employer-specific eligibility and multiple-application rules rather than inventing defaults.
- Distinguish filling, attempted submission and confirmed receipt.
- Keep examples fictional and installation instructions portable.
- Add meaningful behavioural tests for helper changes.

Do not submit real CVs, transcripts, screenshots containing applicant details, tokens, passwords or application receipts. Use fictional/redacted fixtures. Application data belongs outside the source tree and installed skill.

Open an issue with the trigger, expected result, actual result and relevant environment. For a pull request, describe the concrete change and checks run. By contributing, you agree that your contribution is distributed under the repository's MIT licence.
