# Human Notes — Frontend (Budget Automation System)

This is the React/Vite UI for the Budget Automation System.

## How to run locally
1) Install deps: `npm install`
2) Copy `.env.example` to `.env.development` (defaults to `VITE_API_BASE_URL=http://localhost:3002`)
3) Start dev server: `npm run dev` and open the URL shown (usually http://localhost:5173)
4) UI uses Ant Design with theme tokens in `src/theme.js`; Redux store lives in `src/store`.
5) Git author for this repo is set locally to `Nouman Shafi <noumanshafi856@gmail.com>`
6) Use SSH key `id_ed25519_noumanshafi856` for GitHub with this repo; default key/user only outside this project.

## Working on features
- Use this file to briefly describe new screens, flows, and how to try them.
- Mention any new API calls and expected responses.
- Call out config or environment variables needed for a feature.

## Helpful commands
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview built app: `npm run preview`
- Key routes: `/login`, `/register` (accepts `?invitation_token=`), `/forgot-password`, `/reset-password?token=...`, `/verify-email?token=...`.
