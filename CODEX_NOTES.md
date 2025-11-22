# Codex Notes — Frontend (Budget Automation System)

## Stack
- React + Vite (JavaScript, no TypeScript)
- Node 20.19.5, npm 10.x
- UI library: Ant Design (theme tokens in `src/theme.js`)
- State: Redux Toolkit (`src/store`)

## Quickstart
- `npm install`
- `npm run dev` (defaults to http://localhost:5173)
- API base URL via `VITE_API_BASE_URL` (set in `.env.development` / `.env.example`, defaults to http://localhost:3002)

## Feature Work
- Keep frontend design/implementation notes here (single Codex file).
- For each feature: list primary routes/views/components, state/data flow, and API contracts.
- Note any required environment variables in `.env` (mirror in `.env.example` when added).
- Include build/run steps for QA (e.g., `npm run build`, `npm run lint` once configured).
- When adding API calls, import the base URL from `import.meta.env.VITE_API_BASE_URL`.
- Auth screens: Login, Register (invitation-aware), Forgot/Reset password, Email verification. Routes defined in `App.jsx`, layouts in `components/AuthLayout`.
- API layer in `src/api/auth.js` with fetch wrapper in `src/apiClient.js`; state handled via `src/store/authSlice.js`.
- Git author for this project is set to `Nouman Shafi <noumanshafi856@gmail.com>` in the local repo.
- Git/SSH: use key `id_ed25519_noumanshafi856` for pushes to GitHub in this project; default key/user (NoumanTeotc) only outside this repo.

## Structure
- `src/App.jsx` entry wiring; `src` holds components/assets.
- Vite config lives in `vite.config.js`.
