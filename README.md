# SonE Static Demo

SonE is now a frontend-only meal-planning demo built with React and Vite.

## What it includes

- Local sign up / sign in with `localStorage`
- Daily meal planner based on BMI, age, gender, and activity level
- Saved meal history by weekday
- Shopping list generated from saved meals
- Ingredient pricing management
- 7-day family menu generator with budget summaries
- Local admin mode for editing meals and ingredients

## Stack

- `frontend/`: React 19, Vite 8, React Router, Tailwind bridge classes, custom CSS
- Data source: static JSON in `frontend/src/data/`
- Images: static assets in `frontend/public/images/`
- Persistence: browser `localStorage`

## Folder map

```text
.
|-- frontend/
|   |-- public/images/              # static meal and ingredient images
|   |-- src/App.jsx                 # routes
|   |-- src/context/AppContext.jsx  # app state and actions
|   |-- src/data/                   # bundled seed data and image manifest
|   |-- src/lib/                    # local data and catalog helpers
|   |-- src/pages/                  # page-level UI
|   |-- src/components/             # reusable UI pieces
|   |-- src/utils/                  # planner/family/history logic
```

## How it works

```text
Static JSON data -> AppContext -> React pages/components
Local account/session -> localStorage
Planner/history/family menu -> localStorage + frontend logic
```

## Admin mode

- Admin is determined locally from `VITE_ADMIN_EMAILS`
- Default fallback email is `admin@example.com`
- Admin can create, edit, and delete meals and ingredient pricing in the current browser

## Local development

```bash
cd frontend
npm install
npm run dev
```

## Production build

```bash
cd frontend
npm run build
```

Deploy `frontend/` as a Vite static site on Vercel.

Recommended Vercel settings:

- Framework: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Environment
admindemotest: admin@example.com
123456
Optional frontend env:

```env
VITE_ADMIN_EMAILS=admin@example.com
```

Use a comma-separated list if you want more than one local admin.

## Notes

- All user data is browser-local. Different devices or browsers do not sync.
- Clearing browser storage resets accounts, history, and family results for that browser.
- The app no longer depends on a backend service.
