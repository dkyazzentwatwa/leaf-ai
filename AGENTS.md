# Repository Guidelines

This repo is a Vite + React + TypeScript app for Leaf AI. Follow the sections below when adding features or fixing bugs.

## Project Structure & Module Organization
- `src/` contains all application code (React pages, shared components, hooks, stores, and utilities).
- `src/features/` hosts feature-specific modules such as `ai/` (WebLLM hooks, workers, UI).
- `src/assets/` contains static assets and i18n translation files (`src/assets/locales`).
- `src/index.css` holds Tailwind base styles and theme tokens.
- `public/` is for static files served as-is.
- `dist/` is the production build output (generated).

## Build, Test, and Development Commands
- `npm run dev` — start the local Vite dev server.
- `npm run build` — typecheck (`tsc`) and build for production.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint with strict warnings.
- `npm run test` — run Vitest (if/when tests are added).

## Coding Style & Naming Conventions
- Use 2-space indentation, single quotes, and no semicolons (match existing files).
- React components are `PascalCase`; hooks use `useCamelCase`.
- Keep Tailwind classes in JSX; use `cn` from `src/utils/cn.ts` for conditional classes.
- Store shared UI in `src/components/` and feature-specific UI in `src/features/<feature>/components/`.
- Add translations to `src/assets/locales/en/translation.json` and `src/assets/locales/es/translation.json` when introducing user-facing text.

## Testing Guidelines
- Vitest is configured via `npm run test`.
- Preferred test naming: `*.test.ts` / `*.test.tsx` colocated with the module under `src/`, or in `__tests__/`.
- No coverage requirements are enforced in this workspace.

## Commit & Pull Request Guidelines
- Git history is not available in this workspace; use clear, imperative commit messages (e.g., "Add chat export").
- PRs should include a short summary, testing notes (manual or automated), and screenshots for UI changes.
- Link relevant issues or requirements when applicable.

## Configuration & Operational Notes
- WebLLM runs in a web worker under `src/features/ai/workers/` and communicates via typed messages.
- Cached model data lives in the browser cache/IndexedDB; updates to storage behavior should be documented in Settings UI.
