# Gotham Volleyball: new gym breakeven calculator

A web tool to estimate the maximum annual venue budget Gotham can afford for a new gym, based on a weekly schedule, program revenues and costs, and other costs.

Open the live page from the link in this repository's About section. Your inputs autosave in your own browser only and are not shared with anyone.

All numbers in the defaults are illustrative placeholders. Replace them with your own.

## Local development

Requires [Node.js](https://nodejs.org/) 22.12 or later.

```
npm install
npm run dev
```

This serves the app at http://localhost:8080 and updates the browser as you save files.

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm test` | Unit tests for the calculations and saved-data loading |
| `npm run build` | Typecheck and build the production site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

The app is built with [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/) and [React](https://react.dev/), and deployed to GitHub Pages by GitHub Actions on every push to `main`.

**Contributing?** Read the [developer guide](docs/ARCHITECTURE.md) first. It explains how the app fits together, how to make common changes, and how to avoid wiping users' saved inputs.
