# Developer guide

How the Gotham Volleyball breakeven calculator is built, and how to change it safely. Read this before your first change. For what the tool does and how to run it, see the [README](../README.md).

## How it's built

The app runs entirely in the visitor's browser. There is no server, database or account, and nothing the user enters leaves their browser.

| Tool | What it does here |
|---|---|
| [React](https://react.dev/) | Draws the screens and updates them when inputs change. |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript with types, so mistakes in the data model show up before the app runs. |
| [Vite](https://vite.dev/) | Runs the local dev server and bundles the code into a static site for GitHub Pages. |
| [Vitest](https://vitest.dev/) | Runs the unit tests. |
| GitHub Actions + GitHub Pages | Tests, builds and hosts the site for free. |

All of these are free, open source and widely used. This stack was chosen in [#7](https://github.com/rymatsumoto-bit/volleyball.github.io/issues/7). It suits a growing, multi-screen app that volunteers maintain, and it has the largest choice of free libraries for charts and calendars. Gotham is a non-profit, so keep it that way: no paid services, backends or databases.

## Where things live

```
index.html              Page shell; loads src/main.tsx
src/
  main.tsx              Starts React
  App.tsx               App state, saving, navigation; wires the screens together
  styles.css            All styles
  definitions.ts        Text for the Settings column tooltips and the Definitions list
  model/                Plain TypeScript, no React — the logic, and what the tests cover
    types.ts            The data model: Program, Schedule, FixedCosts, SavedState
    calc.ts             The formulas: per-program figures and the overall totals
    program.ts          Default programs, and the migration that reads older saves
    schedule.ts         Days, time slots, program colours
    storage.ts          Loading and saving in the browser (localStorage)
    calc.test.ts        Tests for the formulas, including the worked example from #5
    storage.test.ts     Tests for loading older saves and the saved shape
  components/           The screens, made of React components
    ScheduleGrid.tsx    Weekly schedule grid and legend
    ProgramTable.tsx    Program revenues and costs table, with the Fees row
    FixedCostsCard.tsx  Fixed costs
    Results.tsx         Result tiles and the breakeven banner
    SettingsView.tsx    Settings screen: read-only view, Edit mode, definitions
    NumberInput.tsx     Number field that keeps partly typed values like "1."
.github/workflows/deploy.yml   Test, build and publish to GitHub Pages
```

The split that matters most: **logic goes in `src/model/`, display goes in `src/components/`.** The model doesn't import React, so it can be tested on its own. A component should only show numbers that come from the model. Don't calculate in a component.

## How data flows

1. On load, `App.tsx` reads the saved data from the browser with `readSaved()` and turns it into current state with `fromSaved()` (`storage.ts`). Older saves are upgraded on the way in by `migrateProgram()` (`program.ts`).
2. State lives in `App.tsx`: the programs, the schedule and the fixed costs. Components get it as props and report edits back through callbacks such as `onRename` or `onTeams`.
3. Every change recalculates the totals with `totals()` (`calc.ts`) and saves straight away (autosave). The Save button saves again and shows the time.
4. Settings vs Calculator is just the URL: `#settings` shows Settings, anything else shows the calculator. Settings open read-only; Edit unlocks them, and leaving Settings locks them again.

### Saved data: the one thing you must not break

Each visitor's inputs are stored only in their own browser, under the `localStorage` key **`gotham-gym-budget-v6`**, in the shape `SavedState` (`src/model/types.ts`). There is no other copy anywhere. If you rename the key or change the shape without a migration, every user's saved inputs silently disappear.

So:

- Never rename the key.
- To change the saved shape, extend `migrateProgram()` (or `fromSaved()`) so it reads the old shape and produces the new one. Then add a test in `storage.test.ts` that loads an old save and checks that the results haven't changed.
- Fields from older versions keep working: `migrateProgram()` already converts every earlier program shape. Leave those branches alone unless you have a test that proves the change is safe.

## Common tasks

### Add a program setting

Example: a "Court rental ($) / season" cost.

1. `types.ts`: add the field to `Program`.
2. `program.ts`: give it a default in `newProgram()`. Older saves don't have the field, so `migrateProgram()` fills it from that default. Check that this default gives the same results as before the change.
3. `calc.ts`: use it in `programFigures()`.
4. `definitions.ts`: add its definition, and update the "How it adds up" formulas.
5. `SettingsView.tsx`: add the column header (with `def=` for the tooltip), the editable cell and the read-only cell. For a number field, add it to `SettingsNumberField`.
6. Tests: add the setting to a worked example in `calc.test.ts`, and add a test in `storage.test.ts` that loads a save without the field.

### Change a formula

1. Open an issue that states the change and a worked example with the expected results.
2. Add that example as a test in `calc.test.ts`. It should fail.
3. Change `calc.ts` until it passes, and update `definitions.ts` to match.
4. Check the same numbers in the browser.

### Add a screen

Make a component in `src/components/` and add it to the view switch in `App.tsx`. If it needs new calculations, put them in `src/model/` with tests.

### Add a library

Only add one if it earns its place. Prefer a free, well-known library with a large community, and install it with npm so Vite bundles it into the site. Never load scripts, fonts or data from a CDN or any other server at runtime. The app must make no network calls.

## Checking your work

```
npm test          # unit tests
npm run build     # typecheck + production build
npm run dev       # try it at http://localhost:8080
```

Before opening a pull request:

- `npm test` and `npm run build` pass.
- You've tried the change in the browser at desktop width and checked the console for errors.
- Inputs saved before your change still load with the same numbers.

## From change to live site

1. Work on a branch, never directly on `main`. The issue-first workflow is described in [CLAUDE.md](../CLAUDE.md).
2. Open a pull request. The workflow in `.github/workflows/deploy.yml` runs the tests and the build on it.
3. When the pull request is merged into `main`, the same workflow builds the site and publishes it to GitHub Pages. This takes a few minutes. You can follow it in the repository's Actions tab.

One-time setup (already done once the first deploy works): in the repository's Settings → Pages, set Source to "GitHub Actions".

The built site (`dist/`) is never committed. GitHub Actions builds it fresh each time.
