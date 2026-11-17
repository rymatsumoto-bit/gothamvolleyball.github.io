# Gotham Volleyball breakeven calculator

A client-side React + TypeScript app, built with Vite and deployed to GitHub Pages by a GitHub Actions workflow. See [README.md](README.md) for what it does, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it's built, where code lives, how data flows and how to make common changes. Read the guide before changing code, and update it in the same branch when a change makes it out of date.

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

- **Stack: Vite + TypeScript + React.** Chosen in #7. Stay with free, open-source, mainstream tools that volunteers can maintain. No paid services, backends or databases. Add a dependency only when it earns its place, and prefer one with a large community.
- **Logic in `src/model/`, display in `src/components/`.** The model has no React and is unit-tested; components don't calculate. Keep `src/definitions.ts` in step with `calc.ts`. Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Saved data is sacred.** Inputs are stored in each visitor's browser under the `localStorage` key `gotham-gym-budget-v6`. Do not rename the key or change the saved data shape (`SavedState` in `src/model/types.ts`) without a migration that reads the old data and writes the new, plus a test in `src/model/storage.test.ts`. Bumping the version without a migration silently wipes every user's saved inputs.
- **No network calls, no tracking.** The tool is fully client-side and nothing leaves the user's browser. Bundle every library; don't load scripts, fonts or data from a CDN at runtime.
- **Calculation changes need an issue and a worked example.** State the expected result for a sample scenario in the issue, add it as a test in `src/model/calc.test.ts`, and check it in the browser after the change.

## Local development

```
npm install
npm run dev
```

Serves http://localhost:8080 with hot reload. Other scripts:

- `npm test` runs the unit tests (Vitest).
- `npm run build` typechecks and builds the production site into `dist/`.
- `npm run preview` serves the built `dist/` at http://localhost:8080, as GitHub Pages will.

## Verification before calling work done

- Run `npm test` and `npm run build`; both must pass.
- Run `npm run dev` and exercise the change in a browser at desktop and phone (~400px) widths.
- Confirm saved inputs from before the change still load.
- Check the browser console for errors.
- State in the PR what was and wasn't verified.
