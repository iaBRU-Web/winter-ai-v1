# Winter AI -- Frontend

A standalone React + Vite chat UI for Winter AI. Plain Vite, no framework
lock-in, deploys to Vercel from GitHub.

Talks to the backend at **https://backend-winter.onrender.com** by default
(set in `.env`).

## Deploying (GitHub -> Vercel)

1. Push this repository to GitHub.
2. In Vercel: **Add New -> Project**, import the repo. Vercel detects Vite
   automatically; `vercel.json` in this repo also pins the build command,
   output directory (`dist`), and SPA rewrite rule explicitly.
3. Set the environment variable if you want to override the default:
   - `VITE_BACKEND_URL` = `https://backend-winter.onrender.com/api/v1`
   (This is already committed in `.env`, so it works out of the box even if
   you skip this step -- only needed if you're pointing at a different
   backend.)
4. Deploy. Vercel gives you a `*.vercel.app` URL (or attach a custom domain).

Once your Vercel URL is live, go back to the backend repo and narrow its
CORS `allow_origins` in `api/index.py` from `["*"]` to your exact Vercel
domain, then redeploy the backend.

## What's inside

- `src/App.tsx` -- chat interface: sidebar with chat history, a language
  picker (English / Français / Kinyarwanda), the message thread, and an
  expandable "Show reasoning" panel per answer that reveals every one of
  Winter's seven reasoning layers (Python, Scheme, Prolog, Common Lisp,
  OCaml, C++, Mercury-style) and their real output for that message.
- `src/api.ts` -- typed fetch client for the backend's REST API
  (`/chats/message`, `/reason`, `/health`, `/brain`, `/teach/*`).
- `src/index.css` -- plain CSS, no framework dependency, easy to reskin.

## Local development (optional)

```
npm install
npm run dev
```

Opens `http://localhost:5173`. Edit `.env` (or create `.env.local`, which is
git-ignored) to point `VITE_BACKEND_URL` at a local backend instance if
you're running one, then restart the dev server.

## Building manually

```
npm install
npm run build
```

Outputs static files to `dist/` -- this is what Vercel runs automatically on
every push once the project is connected.
