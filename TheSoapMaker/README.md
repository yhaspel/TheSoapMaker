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
python manage.py runserver 8811
```

The API is now available at **http://localhost:8811**.

- Health check: http://localhost:8811/api/v1/health/
- Swagger UI: http://localhost:8811/api/schema/swagger-ui/
- Admin: http://localhost:8811/admin/

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

Run the ratings tests (Milestone 4):

```bash
cd soapmaker-backend
pip install -r requirements/development.txt
python manage.py migrate
pytest apps/ratings/tests/ -v --tb=short
```

Run the comments tests (Milestone 4):

```bash
cd soapmaker-backend
pip install -r requirements/development.txt
python manage.py migrate
pytest apps/comments/tests/ -v --tb=short
```

Run the subscriptions tests (Milestone 4):

```bash
cd soapmaker-backend
pip install -r requirements/development.txt
python manage.py migrate
pytest apps/subscriptions/tests/ -v --tb=short
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

The app is now available at **http://localhost:4411**.

On startup the app makes a `GET /api/v1/health/` call to verify the backend is reachable — check the browser console.

### Building for Production

```bash
ng build --configuration=production
```

Output lands in `dist/soapmaker-frontend/browser/`. This build enables tree-shaking, minification, and uses `environment.prod.ts` (which points to the Render API URL and enables GA4).

### Running Frontend Tests

```bash
cd soapmaker-frontend
ng test
```

Runs the full Karma/Jasmine test suite. Coverage target: 90%+.

Key test files:

| File | What it covers |
|------|---------------|
| `core/store/recipe.store.spec.ts` | filteredRecipes computed, topRated sort, CRUD mutations |
| `core/store/subscription.store.spec.ts` | isPremium logic (active/trialing/free/canceled) |
| `core/store/ui.store.spec.ts` | addToast, removeToast, auto-dismiss after 4 s |
| `shared/pipes/cure-time.pipe.spec.ts` | Days/weeks/months formatting |
| `shared/pipes/lye-calculator.pipe.spec.ts` | NaOH calculation with superfat |
| `shared/components/star-rating/star-rating.component.spec.ts` | Interactive vs display modes, event emission |
| `shared/components/ad-banner/ad-banner.component.spec.ts` | Visibility based on premium status |
| `shared/components/toast-notification/toast-notification.component.spec.ts` | Toast rendering and dismiss |
| `core/services/auth.service.spec.ts` | login/register/refresh HTTP calls |
| `core/interceptors/auth.interceptor.spec.ts` | Bearer token injection |
| `core/interceptors/error.interceptor.spec.ts` | 401 → refresh → retry cycle |
| `core/guards/auth.guard.spec.ts` | Authenticated vs unauthenticated routing |
| `core/guards/premium.guard.spec.ts` | Premium vs free routing |
| `core/services/recipe.service.spec.ts` | HTTP params, snake↔camelCase mapping, POST payload |
| `abstraction/recipe.facade.spec.ts` | setSearchQuery triggers load, loadNextPage increments page |
| `shared/components/star-rating/star-rating.component.spec.ts` | Display mode rating, hover highlight, click emission |
| `abstraction/rating.facade.spec.ts` | Optimistic update before HTTP resolves, error reverts store |
| `abstraction/comment.facade.spec.ts` | postComment adds to store, deleteComment removes from store |
| `core/store/comment.store.spec.ts` | getComments returns only comments for the specified slug |
| `shared/components/lye-calculator/lye-calculator.component.spec.ts` | NaOH weight at 5% superfat; water weight from water ratio |
| `features/premium/trial-banner/trial-banner.component.spec.ts` | Shows banner with days remaining; hidden when not trialing |
| `shared/components/recipe-card/recipe-card.component.spec.ts` | Bookmark heart visible to premium users; hidden for free users |
| `core/services/analytics.service.spec.ts` | All tracking methods are no-ops in dev (production=false) |
| `abstraction/subscription.facade.spec.ts` | isPremium/isTrialing/trialDaysRemaining/cancelAtPeriodEnd signals; startCheckout; cancelSubscription |
| `core/store/bookmark.store.spec.ts` | addBookmark, removeBookmark, setBookmarkedSlugs, per-slug isolation |
| `core/store/rating.store.spec.ts` | setUserRating, removeUserRating, per-slug isolation, all valid star values |

### Production Deploy & Launch (Milestone 10)

Milestone 10 wires the application for production hosting, SEO, analytics, performance optimisations, and CI/CD:

**Infrastructure**

- `config/settings/production.py` fully configured: `DEBUG=False`, `ALLOWED_HOSTS` from `ALLOWED_HOST` env var, Whitenoise middleware (`whitenoise.middleware.WhiteNoiseMiddleware` inserted after `SecurityMiddleware`) and `CompressedManifestStaticFilesStorage` for static file serving, `CORS_ALLOWED_ORIGINS` from `FRONTEND_URL` env var, all HSTS / secure-cookie headers, production-level `LOGGING` config
- `Procfile` updated: `web: gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT` + `release: python manage.py migrate` (auto-runs migrations on every Render deploy)
- `requirements/production.txt` adds `gunicorn==21.2.0` and `whitenoise==6.7.0`
- `render.yaml` at `soapmaker-backend/` declares the Render web service, build/start commands, env vars (including `generateValue: true` for `SECRET_KEY`), and a free-tier PostgreSQL database
- `.env.example` at `soapmaker-backend/` documents every required environment variable (Django, Postgres, Cloudinary, Stripe, OAuth, CORS)
- `vercel.json` at `soapmaker-frontend/` configures SPA catch-all rewrites and 1-year immutable cache headers for `/assets/`
- `.github/workflows/ci.yml` defines two jobs: `backend-tests` (Python 3.11, Postgres 15 service, pytest + Codecov) and `frontend-tests` (Node 22, `ng test --watch=false --code-coverage`, `ng build --configuration=production`), triggered on every push to `main`/`develop` and every PR to `main`

**OpenAPI documentation**

- `@extend_schema` decorators added to all `APIView` subclasses not auto-documented by drf-spectacular: `RateRecipeView`, `CommentDeleteView`, `CommentFlagView`, `CreateCheckoutView`, `CancelSubscriptionView`, `StripeWebhookView`, `BookmarkToggleView`, `BookmarkedRecipesView` — each with summary, description, request/response schemas, and tag grouping

**SEO**

- `RecipeDetailComponent` injects Angular `Title` + `Meta` services; a class-field `effect()` watches `selectedRecipe()` and dynamically sets `<title>`, `<meta name="description">`, and `og:title / og:description / og:image / og:url` tags when the recipe loads
- `HomeComponent` and `RecipeListComponent` set static title + description + OG tags in `ngOnInit`

**Performance (Lighthouse ≥ 90)**

- `ChangeDetectionStrategy.OnPush` added to `RecipeDetailComponent`, `HomeComponent`, and `RecipeListComponent`
- Hero `<img>` gets `loading="eager"`; all below-fold images get `loading="lazy"`
- `CommentThreadComponent` wrapped in `@defer (on viewport)` with placeholder text — defers comment bundle until the section scrolls into view

**Analytics (Google Analytics 4)**

- GA4 `gtag` script added to `src/index.html` (placeholder ID `G-XXXXXXXXXX`)
- `environment.prod.ts` gains `gaMeasurementId`, `adSensePublisherId`, `stripePublishableKey` fields; `environment.ts` gains the same fields with dev-safe empty/placeholder values
- New `AnalyticsService` (`core/services/analytics.service.ts`) wraps all gtag calls with type safety and a production guard (events are silently no-ops in dev or when `gaMeasurementId` is empty)
- Custom events wired: `view_recipe` on recipe detail load, `rate_recipe` on star submit, `begin_checkout` on pricing plan selection, `sign_up` on successful registration

**Backend coverage gap tests**

- `apps/subscriptions/tests/test_subscription_views.py` — 6 new tests: unauthenticated 401, free plan default, existing subscription, missing checkout fields 400, Stripe mock checkout URL
- `apps/comments/tests/test_comment_permissions.py` — 5 new tests: author delete (204), non-author delete (403), unauthenticated delete (401), flag by other user (200), unauthenticated flag (401)

---

### Monetization (Milestone 9)

Milestone 9 wires Stripe subscriptions, recipe bookmarks, premium-gated features, and Google AdSense:

- `SubscriptionService` makes real HTTP calls: `GET /subscriptions/status/` (maps snake_case → camelCase), `POST /subscriptions/checkout/` (returns `{ checkoutUrl }` for Stripe redirect), `POST /subscriptions/cancel/`
- `SubscriptionFacade` gains `startCheckout(plan)` (redirects browser to Stripe checkout URL), `subscribe(priceId)` alias, `cancelAtPeriodEnd` and `trialDaysRemaining` computed signals; `cancelSubscription()` now shows a toast on success
- `AppComponent` watches for `?checkout=success` query param on startup and reloads subscription status
- New `BookmarkStore` holds a `Set<string>` of bookmarked slugs; `isBookmarked(slug)` returns a `Signal<boolean>` via `computed()`
- `RecipeService` gains `getBookmarked()` → `GET /recipes/bookmarked/` and `toggleBookmark(slug)` → `POST /recipes/{slug}/bookmark/` (returns 201 on add, 204 on remove)
- `RecipeFacade` gains `isBookmarked(slug)`, `loadBookmarks()`, and `toggleBookmark(slug)` with optimistic store update + auto-revert on HTTP error
- `RecipeService` / `RecipeFacade` support four new advanced filter params: `cureTimeMin`, `cureTimeMax`, `batchSizeMin`, `batchSizeMax` (mapped to Django `cure_time_min` etc.)
- New `LyeCalculatorComponent` (premium-only) accepts `[ingredients]` and exposes lye-type toggle (NaOH/KOH), superfat %, and water ratio sliders; KOH SAP = NaOH SAP / 0.715; has copy-to-clipboard button
- `TrialBannerComponent` persists dismiss state in `sessionStorage`; `upgrade()` calls `startCheckout('premium_monthly')`
- `PricingComponent` shows a "You're Premium!" card when subscribed; displays a cancel-at-period-end notice chip; `selectPlan()` calls `startCheckout` with the chosen price ID
- `AdBannerComponent` injects the real AdSense `<ins>` tag when a non-placeholder publisher ID is configured; falls back to a placeholder in dev
- `RecipeDetailComponent` shows `<app-lye-calculator>` for premium users only
- `RecipeListComponent` exposes advanced filter controls (cure time, batch size) disabled + locked behind a 🔒 badge for free users
- `RecipeCardComponent` shows a bookmark heart (♥/♡) only when the user is authenticated and premium; toggles via `RecipeFacade.toggleBookmark()`
- New `BookmarksComponent` at `/recipes/bookmarks` (auth-guarded) loads and displays the user's bookmarked recipes
- Backend: new `Bookmark` model (`user`, `recipe`, `unique_together`, `ordering=['-created_at']`); `BookmarkToggleView` and `BookmarkedRecipesView` added to `apps/recipes/views.py` and `urls.py`; migration `0002_add_bookmark_and_step_duration.py` also adds `duration_minutes` to `Step`
- Backend `RecipeFilter` gains `cure_time_min`, `cure_time_max`, `batch_size_min`, `batch_size_max` (`NumberFilter`) for the advanced filter UI
- `src/index.html` includes the AdSense script tag; `environment.ts` exposes `adSensePublisherId`

---

### Community Features (Milestone 8)

Milestone 8 wires ratings, comments, and public user profiles to the real Django backend:

- `RatingService` calls `POST /api/v1/recipes/{slug}/rate/` and `GET /api/v1/recipes/{slug}/ratings/`
- `CommentService` supports paginated `GET`, `POST`, `DELETE`, and `POST flag/` via real HTTP; `mapComment()` converts snake_case backend responses to camelCase
- New `CommentStore` manages `Record<string, Comment[]>` per recipe slug with `setComments`, `appendComments`, `addComment`, `removeComment`
- New `RatingStore` tracks `Record<string, number>` (slug → user stars) with optimistic update + auto-revert on error
- `RatingFacade.submitRating()` performs an optimistic store update before the HTTP call resolves; reverts on error; updates `RecipeStore.selectedRecipe` averageRating/ratingCount from response
- `CommentFacade` tracks an `activeSlug` signal so `activeComments` and `activeHasNextPage` are computed reactively; `loadMoreComments()` appends pages; flag/delete/post all show toasts
- `UserFacade` gains `loadUserRecipes()` and `userRecipes` signal (backed by `RecipeStore.myRecipes`)
- `StarRatingComponent` now supports `[isAuthenticated]` and `[userRating]` inputs: non-authenticated users see "Login to rate", authenticated users see their own rating highlighted after submission
- `CommentThreadComponent` now accepts `[slug]` input only (no `@Input() comments`); wires directly to `CommentFacade` for load/post/delete/flag/load-more; delete visible only to comment author or staff
- `RecipeCardComponent` author name/avatar now links to `/users/{authorId}`
- `RecipeDetailComponent` simplified: `CommentThread` receives `[slug]`, `StarRating` reads from `ratingFacade.getUserRating(slug)()`; no local `userRating` state needed
- `ProfileComponent` shows "My Recipes" grid below the edit form (loaded via `userFacade.loadUserRecipes()`)
- New `UserPublicProfileComponent` at route `/users/:id` shows author info and their recipe grid via `RecipeFacade.loadRecipes({ authorId: id })`
- Backend `RecipeFilter` gains `author_id = UUIDFilter(field_name='author__id')` for the public profile page filter

---

### Recipes Integration (Milestone 7)

Milestone 7 replaces all recipe stub services with real HTTP calls to the Django backend:

- `RecipeService` calls `/api/v1/recipes/` with full filter/pagination params and maps Django's snake_case responses to camelCase Angular models via `mapRecipe()`
- `IngredientService` supports a `?search=` query param for the autocomplete widget
- `RecipeStore` gains pagination signals: `currentPage`, `totalCount`, `hasNextPage`, `hasPrevPage`, `totalPages`
- `RecipeFacade` tracks current filters for seamless page-forward/back navigation; each filter setter (`setMethod`, `setDifficulty`, `setOrdering`, `setSearchQuery`, `setActiveTag`) resets to page 1 and fires a new server request
- `RecipeFacade.uploadImage(file)` calls the backend for a signed Cloudinary token then POSTs the file directly to Cloudinary and returns the `secure_url`
- Recipe list: search is debounced 300 ms; pagination buttons wire to `hasPrevPage`/`hasNextPage`
- Recipe detail: reacts to route param changes; shows "Recipe Not Found" for 404 errors; edit button visible to the recipe author only
- Recipe form: 4-step stepper with `ReactiveFormsModule` validation, ingredient autocomplete (debounced 200 ms), Cloudinary image upload with preview, auto-save draft to `localStorage` every 30 s, edit mode pre-populates from `selectedRecipe` store
- My Recipes page: calls `loadMyRecipes()` → `GET /api/v1/recipes/my/`; delete removes optimistically from both `recipes` and `myRecipes` store signals

---

### Auth Integration (Milestone 6)

Milestone 6 wires the frontend to the real Django auth backend:

- `AuthService` makes real HTTP calls to `/api/v1/auth/` (login, register, logout, refresh, profile)
- Access tokens live only in memory (`AuthStore` signal — cleared on refresh)
- Refresh token persisted in `localStorage` under key `sm_refresh`
- On app startup `AppComponent._bootstrapSession()` silently restores the session from `localStorage`
- `authInterceptor` attaches `Authorization: Bearer <token>` to every outbound request
- `errorInterceptor` intercepts 401 responses, calls `/auth/token/refresh/`, retries the original request, and on double-failure clears state and redirects to `/auth/login`
- `authGuard` blocks unauthenticated access to `/recipes/new`, `/recipes/:slug/edit`, `/recipes/my-recipes`, and `/auth/profile`
- `premiumGuard` redirects free-plan users to `/premium/pricing`
- Social OAuth (Google/Facebook/X) redirects to `{apiUrl}/auth/{provider}/`

---

## Deployment

### Backend → Render

1. Create a Render account at render.com
2. New Web Service → connect your GitHub repo → set root directory to `soapmaker-backend/`
3. Build: `pip install -r requirements/production.txt && python manage.py collectstatic --noinput`
4. Start: `gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT`
5. Add a free PostgreSQL database — Render will inject `DATABASE_URL` automatically (or use `render.yaml` for IaC)
6. Set `DJANGO_SETTINGS_MODULE=config.settings.production` plus all vars in `.env.example`
7. First deploy runs `python manage.py migrate` automatically via the `release` line in `Procfile`

API will be live at `https://soapmaker-api.onrender.com`.

### Frontend → Vercel

1. Create a Vercel account at vercel.com
2. New Project → Import Git Repository → select `soapmaker-frontend/`
3. Framework preset: Angular; build command: `ng build --configuration=production`; output: `dist/soapmaker-frontend/browser`
4. `vercel.json` (already committed) handles SPA routing rewrites and asset caching
5. Set environment variables: `VITE_API_URL`, `VITE_ADSENSE_PUBLISHER_ID`, `VITE_GA_MEASUREMENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`

Frontend will be live at `https://thesoapmaker.vercel.app`.

### CI / CD

Every push to `main` triggers `.github/workflows/ci.yml`:
- `backend-tests`: spins up Postgres 15, runs `pytest --cov=apps`, uploads coverage to Codecov
- `frontend-tests`: runs `ng test --watch=false --code-coverage` then `ng build --configuration=production`

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
│   │   ├── recipes/         # Recipe, Ingredient, Tag, Step CRUD + filters + seed command;
│   │   │                    #   Bookmark model + toggle/list views (M9); advanced filters (M9)
│   │   ├── ratings/         # Star ratings + post_save signal to update recipe averages
│   │   ├── comments/        # Threaded comments
│   │   └── subscriptions/   # Stripe subscription tracking (status, checkout, cancel)
│   ├── config/              # settings (base / development / production), urls, wsgi
│   └── requirements/        # base.txt, development.txt, production.txt
└── soapmaker-frontend/      # Angular SPA (Angular 21, signals)
    └── src/app/
        ├── core/            # models, services, stores (signals), guards, interceptors
        │   ├── models/      # user, recipe, ingredient, comment, rating, subscription
        │   ├── services/    # real HTTP services (M6 auth, M7 recipe/ingredient, M8 rating/comment,
        │   │                #   M9 subscription) + analytics.service (M10 GA4 wrapper)
        │   ├── store/       # recipe.store, auth.store, subscription.store, ui.store,
        │   │                #   comment.store, rating.store, bookmark.store
        │   └── guards/      # auth.guard (JWT check), premium.guard (subscription check)
        ├── abstraction/     # facades bridging core ↔ presentation
        ├── features/        # lazy-loaded page components
        │   ├── home/        # landing page with hero, top-rated grid
        │   ├── recipes/     # recipe-list, recipe-detail, recipe-form, my-recipes,
        │   │                #   bookmarks (route: /recipes/bookmarks, auth-guarded)
        │   ├── auth/        # login, register, profile
        │   ├── premium/     # pricing page, trial-banner
        │   └── users/       # user-public-profile (route: /users/:id)
        └── shared/          # reusable components and pipes
            ├── components/  # header, footer, recipe-card, star-rating, comment-thread,
            │                #   ad-banner, loading-spinner, toast-notification,
            │                #   lye-calculator (premium-only, M9)
            └── pipes/       # cure-time, lye-calculator
```

---

## Milestones

| # | Title | Status |
|---|-------|--------|
| 1 | Dev Environment & Project Scaffolding | ✅ Done |
| 2 | Backend Authentication | ✅ Done |
| 3 | Backend Recipes | ✅ Done |
| 4 | Backend Community (Ratings & Comments) | ✅ Done |
| 5 | Frontend Shell | ✅ Done |
| 6 | Frontend Auth Integration | ✅ Done |
| 7 | Frontend Recipes Integration | ✅ Done |
| 8 | Frontend Community | ✅ Done |
| 9 | Monetization (Stripe + AdSense) | ✅ Done |
| 10 | Deploy & Launch | ✅ Done |
