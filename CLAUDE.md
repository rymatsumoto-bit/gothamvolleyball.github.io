# Gotham Volleyball breakeven calculator

A single-page tool, served as-is by GitHub Pages. See [README.md](README.md) for what it does.

## Tracking changes with GitHub Issues

Every change is documented in a GitHub Issue. Use the `gh` CLI.

1. **Issue first.** Before changing any code, check for an existing issue (`gh issue list`). If none fits, create one with `gh issue create`, using the "Change request" template: problem, proposed change, how to verify.
2. **Group related changes.** Changes that are correlated (same goal, or one depends on the other) can share an issue. Split unrelated work into separate issues.
3. **Branch per issue.** Name it `issue-<number>-<short-slug>`. Never commit directly to `main`.
4. **Commits reference the issue.** End the subject or body with `Refs #<number>`.
5. **Pull request closes the issue.** The PR description includes `Closes #<number>`, a short summary, and what was verified.
6. **Comment on the issue** when scope changes, a decision is made, or something is deferred, so the issue is the record of why.
7. **Ask before outward-facing actions.** Confirm with the user before creating or closing issues, pushing, opening PRs, or merging, unless they have told you to proceed.

## Project constraints

- **Single file, no build step.** `index.html` holds the HTML, CSS and JS, and GitHub Pages serves it directly. Don't add a bundler or framework. `package.json` exists only for local dev tooling.
- **Saved data is sacred.** Inputs are stored in each visitor's browser under the `localStorage` key `gotham-gym-budget-v6`. Do not rename the key or change the saved data shape without a migration that reads the old data and writes the new. Bumping the version without a migration silently wipes every user's saved inputs.
- **No network calls, no tracking.** The tool is fully client-side and nothing leaves the user's browser.
- **Calculation changes need an issue and a worked example.** State the expected result for a sample scenario in the issue and check it after the change.

## Local development

```
npm install
npm run dev
```

Serves http://localhost:8080 with live reload.

## Verification before calling work done

- Run `npm run dev` and exercise the change in a browser at desktop and phone (~400px) widths.
- Confirm saved inputs from before the change still load.
- Check the browser console for errors.
- State in the PR what was and wasn't verified.
