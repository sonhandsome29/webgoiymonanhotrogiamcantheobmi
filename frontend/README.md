# SonE Frontend

SonE is a static React + Vite meal-planning demo.

## Features

- Local sign up / sign in
- Meal planner with BMI-based calorie guidance
- Saved meal history by weekday
- Shopping list from saved meals
- Ingredient pricing management
- Family menu generator with weekly budget summaries
- Local admin editing for meals and ingredient prices

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Deploy

Deploy `frontend/` to Vercel with:

- Framework: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Data model

- Seed meals: `src/data/seedMeals.json`
- Seed ingredients: `src/data/seedIngredients.json`
- Images: `public/images/`
- Local persistence: `localStorage`

## Optional env

```env
VITE_ADMIN_EMAILS=admin@example.com
```

## Important note

This app is browser-local. Accounts, history, planner results, and family menus are stored only in the current browser.
