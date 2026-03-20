# SonE Architecture

SonE is a meal-planning app with a React frontend and an Express + MongoDB backend.

## Stack

- `frontend/`: React 19, Vite 8, React Router, TailwindCSS + custom CSS
- `food-calorie-tool/`: Express 5, MongoDB/Mongoose, bcrypt
- Auth: MongoDB-backed session store with `HttpOnly` cookie

## Main features

- Register / login / logout
- Daily meal suggestion by BMI, calories, and dislikes
- Save meal history by weekday
- Generate shopping list from saved meals
- Manage ingredient pricing
- Build 7-day family menu by weekly budget
- Admin overview for users, saved meals, and family-menu adoption

## Folder map

```text
.
|-- frontend/
|   |-- src/App.jsx                # top-level routes
|   |-- src/context/AppContext.jsx # app state + async actions
|   |-- src/lib/api.js             # shared frontend API client
|   |-- src/pages/                 # page-level UI
|   |-- src/components/            # reusable UI pieces
|
|-- food-calorie-tool/
|   |-- index.js                   # server bootstrap
|   |-- app.js                     # express app + middleware
|   |-- controllers/               # HTTP handlers
|   |-- routes/                    # route definitions
|   |-- services/                  # business logic
|   |-- models/                    # mongoose schemas
|   |-- lib/auth.js                # auth/session helpers
```

## Request flow

```text
Frontend page
   |
   v
AppContext action
   |
   v
frontend/src/lib/api.js
   |
   v
Express route -> controller -> service -> Mongoose model -> MongoDB
   |
   v
JSON response -> AppContext state -> React page/components
```

## Auth/session flow

```text
Login/Register form
   -> POST /login or /register
   -> authController
   -> sessionService creates AuthSession in MongoDB
   -> backend sets HttpOnly cookie
   -> frontend stores user profile in React state only

Page reload
   -> AppContext boot
   -> GET /auth/me with credentials
   -> optionalAuth resolves cookie session from MongoDB
   -> session restored into React state

Logout
   -> POST /logout
   -> session deleted from MongoDB
   -> cookie cleared
```

## Core API groups

- Auth: `/register`, `/login`, `/logout`, `/auth/me`
- Meals: `/meals`, `/suggest-meals`, `/admin/meals/:mealId`
- History: `/meal-history`, `/meal-history/:userId`, `/meal-history/:userId/:day`
- Ingredients: `/ingredients`, `/ingredients/:userId/:day`
- Family: `/family/min-cost`, `/family/menu`
- Admin: `/admin/users-overview`

## Frontend notes

- UI is now a hybrid approach: existing custom CSS in `frontend/src/index.css` and `frontend/src/App.css` still drives the design system, while shared Tailwind utility classes are used directly in components and through `@layer components` bridge classes such as `.tw-surface` and `.tw-lift`.
- Shared API requests live in `frontend/src/lib/api.js` and now use `credentials: 'include'` so auth runs through the backend cookie session.

## Local run

Backend:

```bash
cd food-calorie-tool
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment

Backend example in `food-calorie-tool/.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/foodDB
MEAL_SEED_MODE=if-empty
ADMIN_EMAILS=admin@example.com
FRONTEND_ORIGIN=http://localhost:5173
SESSION_COOKIE_NAME=sone_session
SESSION_TTL_DAYS=7
```
