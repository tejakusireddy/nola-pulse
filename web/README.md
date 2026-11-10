# NOLA PULSE web application

From this directory, run `npm ci`, then `npm run dev`. Production builds use `npm run build` and the Sites build helper. Node 22.13 or later is required.

`npm test` exercises campaign economics and public-feed normalizers. `npm run typecheck` checks TypeScript. `npm run format:check` checks authored application formatting.

The application uses React and TypeScript on Vinext/Vite, with a Cloudflare Worker serving the app and `/api/live`. No credentials or customer records are required. See the repository README for the complete data workflow and limitations.
