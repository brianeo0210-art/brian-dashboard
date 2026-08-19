# My Life Dashboard

A personal dashboard — Overview (goals), Health & Fitness, Finances, Luxio
Ads (business), and Maintenance (home + vehicle upkeep) — built as a plain
static site with no backend and no build step. Installs to your phone's
home screen as a standalone app (PWA).

All data is stored locally in your browser (`localStorage`) on whatever
device you open it from. There's no account and no server, so data does
**not** sync between devices automatically — it lives wherever you last
opened the app in a browser and kept using it.

## Deploy with GitHub + Vercel

1. Create a new GitHub repo (e.g. `life-dashboard`) and push these files to it:
   ```
   git init
   git add .
   git commit -m "Initial dashboard"
   git branch -M main
   git remote add origin https://github.com/<you>/life-dashboard.git
   git push -u origin main
   ```
2. In Vercel: **Add New Project** → import that GitHub repo.
3. Framework preset: choose **Other** (this is a static site — no build
   command, no install command, no output directory override needed).
4. Deploy. Vercel gives you a `https://life-dashboard-xxxx.vercel.app` URL.

## Add it to your phone's home screen

- **iPhone (Safari):** open the Vercel URL → Share icon → **Add to Home
  Screen**. It opens full-screen, no browser chrome, with the app icon.
- **Android (Chrome):** open the URL → menu (⋮) → **Add to Home screen** /
  **Install app**.

## Updating later

Any time you want to change a category or add a feature, edit the files and
push to GitHub — Vercel redeploys automatically on every push to `main`.

## File overview

- `index.html` — the five tabs (Overview, Health, Finances, Luxio Ads,
  Maintenance) and markup
- `css/style.css` — all styling ("Ocean Glass" liquid-glass theme), light +
  dark mode
- `js/app.js` — app logic, chart drawing, localStorage data model
- `manifest.json` + `icons/` — makes it installable as a home-screen app
- `sw.js` — service worker so the shell loads instantly / works offline
