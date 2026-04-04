# 🧼 The Soap Maker

A community-driven web application for homemade soap crafting enthusiasts.

- **Frontend:** Angular 21 (signals, standalone components) → `soapmaker-frontend/`
- **Backend:** Django 5 + Django REST Framework → `soapmaker-backend/`
- **Hosting:** Vercel (frontend) + Render (backend) + PostgreSQL

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| npm | 10+ |
| Angular CLI | `npm install -g @angular/cli` |

---

## Running the Backend

```bash
cd soapmaker-backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements/development.txt

# 3. Copy the environment file and fill in your values
cp .env.example .env

# 4. Run database migrations (uses SQLite by default; set DATABASE_URL for Postgres)
python manage.py migrate

# 5. Create a superuser (optional)
python manage.py createsuperuser

# 6. Start the development server
python manage.py runserver
```

The API is now available at **http://localhost:8000**.

- Health check: http://localhost:8000/api/v1/health/
- Swagger UI: http://localhost:8000/api/schema/swagger-ui/
- Admin: http://localhost:8000/admin/

### Running Backend Tests

Run the full test suite (all milestones):

```bash
pytest
```

Run the auth tests specifically (Milestone 2):

```bash
cd soapmaker-backend
pip install -r requirements/development.txt
python manage.py migrate
pytest apps/users/tests/ -v --tb=short
```

Run the recipe & ingredient tests (Milestone 3):

```bash
cd soapmaker-backend
pip install -r requirements/development.txt
python manage.py migrate
python manage.py seed_ingredients
pytest apps/recipes/tests/ -v --tb=short
```

---

## Running the Frontend

```bash
cd soapmaker-frontend

# 1. Install dependencies
npm install

# 2. Start the development server
ng serve
```

The app is now available at **http://localhost:4200**.

On startup the app makes a `GET /api/v1/health/` call to verify the backend is reachable — check the browser console.

### Building for Production

```bash
ng build
```

Output lands in `dist/soapmaker-frontend/`.

---

## Environment Variables (Backend)

Copy `.env.example` to `.env` and fill in values. Key variables:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL connection string (SQLite used as fallback) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (recipe image uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_*` | Payment processing keys |
| `GOOGLE_CLIENT_*` | Google OAuth credentials |
| `FACEBOOK_CLIENT_*` | Facebook OAuth credentials |
| `TWITTER_CLIENT_*` | Twitter/X OAuth credentials |

---

## Project Structure

```
TheSoapMaker/
├── soapmaker-backend/       # Django REST API
│   ├── apps/
│   │   ├── users/           # CustomUser model, JWT auth, social OAuth
│   │   ├── recipes/         # Recipe, Ingredient, Tag, Step CRUD + filters + seed command
│   │   ├── ratings/         # Star ratings + post_save signal to update recipe averages
│   │   ├── comments/        # Threaded comments
│   │   └── subscriptions/   # Stripe subscription tracking
│   ├── config/              # settings (base / development / production), urls, wsgi
│   └── requirements/        # base.txt, development.txt, production.txt
└── soapmaker-frontend/      # Angular SPA
    └── src/app/
        ├── core/            # models, services, stores, guards, interceptors
        ├── abstraction/     # facades (bridge between core and presentation)
        ├── features/        # lazy-loaded page components
        └── shared/          # reusable components and pipes
```

---

## Milestones

| # | Title | Status |
|---|-------|--------|
| 1 | Dev Environment & Project Scaffolding | ✅ Done |
| 2 | Backend Authentication | ✅ Done |
| 3 | Backend Recipes | ✅ Done |
| 4 | Backend Community (Ratings & Comments) | Pending |
| 5 | Frontend Shell | Pending |
| 6 | Frontend Auth | Pending |
| 7 | Frontend Recipes | Pending |
| 8 | Frontend Community | Pending |
| 9 | Monetization (Stripe + AdSense) | Pending |
| 10 | Deploy & Launch | Pending |
