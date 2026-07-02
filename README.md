# Winter AI — Frontend ❄️

A standalone React + Vite chat UI for Winter AI. Plain Vite, not tied to
any specific hosting platform — deploys cleanly to Vercel.

Deploy target: **GitHub → Vercel**. This package is not meant to be run
locally as your primary workflow — push it to a GitHub repo and import
that repo into Vercel.

## Deploying

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com): **Add New → Project → import the repo.**
   Vercel auto-detects the Vite framework preset (build command
   `npm run build`, output directory `dist`) — no extra config needed.
3. Before the first deploy (or any time after, then redeploy), set an
   **Environment Variable** in the Vercel project settings:
   - **Key:** `VITE_BACKEND_URL`
   - **Value:** your Render backend URL + `/api/v1`, e.g.
     `https://winter-ai-backend.onrender.com/api/v1`
4. Deploy. Your chat UI is now live at `https://<your-project>.vercel.app`.

If `VITE_BACKEND_URL` isn't set, the app still builds and loads, but shows
"Backend offline" and logs a console warning telling you what to set —
it won't silently try to reach `localhost`.

## Local development (optional)

```
cp .env.example .env     # edit VITE_BACKEND_URL if needed
npm install
npm run dev
```

Requires **Node.js 18+**.

## What's inside

- `src/App.tsx` — chat interface: sidebar with chat history, language
  picker (English / Français / Kinyarwanda), message thread, and an
  expandable "Show reasoning" panel per answer that reveals all 7 of
  Winter's real reasoning layers (Python, Prolog, Retrieval, Mercury,
  OCaml, LISP, C++/Schema) and their live output.
- `src/api.ts` — typed fetch client for the backend's REST API.
- `src/index.css` — plain CSS, no framework dependency, easy to reskin.

## CORS note

The backend allows all origins (`ALLOWED_ORIGINS=*`) by default so this
works immediately after deploying. Once both are live, it's worth going
back to the Render service and setting `ALLOWED_ORIGINS` to your exact
Vercel URL for tighter security.
