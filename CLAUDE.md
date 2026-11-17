# Gotham Volleyball breakeven calculator

A single-page tool, served as-is by GitHub Pages. See [README.md](README.md) for what it does.

## Tracking changes with GitHub Issues

Every change is documented in a GitHub Issue. Use the `gh` CLI. Work happens in this order:

1. **Start with the issues.** Create an issue for each change with `gh issue create`, using the "Change request" template: problem, proposed change, how to verify. Related changes (same goal, or one depends on the other) can share an issue; split unrelated work into separate issues.
2. **Then create a branch, then code.** Before writing any code, create a working branch from an up-to-date `main` with a short descriptive name (e.g. `dashboard-layout`). Never work directly on `main`. One branch can carry several related issues.
3. **Run the local dev server.** Start `npm run dev` so the user can see each change live in their browser.
4. **Iterate until the user is satisfied.** Keep making changes, creating new issues as new work comes up, and check the result in the running page. Comment on the relevant issue when scope changes, a decision is made, or something is deferred, so the issue records why. Do not commit while iterating.
5. **Commit only when the user says so.** Group commits by issue, and end each commit message with `Refs #<number>`.
6. **Then open the PR, and merge only when asked.** The PR description includes `Closes #<number>` for every issue it covers, a short summary, and what was verified. Do not merge unless the user asks.

Creating issues, pushing, opening PRs and merging are outward-facing: the user has said when to do each, so do not do them ahead of that. If a step is unclear, ask.

Run git and `gh` commands one at a time, not chained together, so each step can be approved and any refusal is easy to pin down.

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
