# Milestone 10 — Production Deploy & Launch

> **Goal:** The application is live on production infrastructure (Vercel + Render), fully tested at 90%+ frontend coverage and 85%+ backend coverage, SEO-optimised, analytics-instrumented, and ready for public traffic.

---

## Deliverables

### Test Coverage Targets
- **Frontend:** `ng test --code-coverage` → Istanbul reports ≥ 90% statements on `core/` and `abstraction/` layers
- **Backend:** `pytest --cov=apps --cov-report=term-missing` → ≥ 85% overall coverage

### OpenAPI Documentation
- `GET /api/schema/swagger-ui/` fully documents all endpoints including request/response schemas
- All serializers use `drf-spectacular` field descriptions (`help_text` on model fields)
- Add `@extend_schema` decorators to any views that aren't auto-documented correctly

### SEO Meta Tags
In `recipe-detail.component.ts`, dynamically set `<title>` and OG tags using Angular's `Title` and `Meta` services:
```typescript
this.title.setTitle(`${recipe.name} — The Soap Maker`);
this.meta.updateTag({ property: 'og:title', content: recipe.name });
this.meta.updateTag({ property: 'og:description', content: recipe.description.slice(0, 160) });
this.meta.updateTag({ property: 'og:image', content: recipe.imageUrl });
this.meta.updateTag({ property: 'og:url', content: `https://thesoapmaker.com/recipes/${recipe.slug}` });
```

Do the same for the home page and recipe list page with generic tags.

Add `<meta name="description">` tags to every route using Angular's `Meta` service in each page component's `ngOnInit`.

### Performance (Lighthouse ≥ 90)
- Lazy-load all feature modules (already in routes)
- Add `loading="lazy"` to all `<img>` tags that are not above the fold
- Compress images via Cloudinary's URL transformation (`/f_auto,q_auto/` in the URL)
- Use `OnPush` change detection on all presentation components
- Add `@defer` blocks for the comment thread (below the fold on recipe detail)
- Ensure `ng build --configuration=production` enables tree-shaking and minification

### Analytics (Google Analytics 4)
Add to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
GA Measurement ID stored in `environment.prod.ts` as `gaMeasurementId`. Only inject the script in production build (use `isPlatformBrowser` or environment flag).

Custom events to track:
- Recipe view: `gtag('event', 'view_recipe', {recipe_slug, recipe_method})`
- Rating submitted: `gtag('event', 'rate_recipe', {stars})`
- Checkout started: `gtag('event', 'begin_checkout', {plan})`
- Registration: `gtag('event', 'sign_up', {method: 'email'|'google'|'facebook'})`

### Backend Production Settings (`config/settings/production.py`)
```python
DEBUG = False
ALLOWED_HOSTS = [env("ALLOWED_HOST")]  # e.g., "soapmaker-api.onrender.com"
DATABASES = {"default": env.db()}  # uses DATABASE_URL
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CORS_ALLOWED_ORIGINS = [env("FRONTEND_URL")]  # "https://thesoapmaker.vercel.app"
```

Add `whitenoise` to serve static files from Render without a separate CDN.

### `Procfile`
```
web: gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT
release: python manage.py migrate
```

The `release` command runs migrations automatically on every Render deploy.

### `render.yaml` (Infrastructure as Code)
```yaml
services:
  - type: web
    name: soapmaker-backend
    env: python
    buildCommand: pip install -r requirements/production.txt && python manage.py collectstatic --noinput
    startCommand: gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: config.settings.production
      - key: DATABASE_URL
        fromDatabase:
          name: soapmaker-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true

databases:
  - name: soapmaker-db
    plan: free
```

### `vercel.json` (Frontend)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### Environment Variables Checklist
Document all required environment variables in `.env.example`:

**Backend (Render)**
```
SECRET_KEY=
DEBUG=False
ALLOWED_HOST=soapmaker-api.onrender.com
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=https://thesoapmaker.vercel.app
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

**Frontend (Vercel)**
```
VITE_API_URL=https://soapmaker-api.onrender.com/api/v1
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
```

### GitHub Actions CI (`.github/workflows/ci.yml`)
```yaml
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_DB: test_db, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -r requirements/development.txt
      - run: pytest --cov=apps --cov-report=xml
      - uses: codecov/codecov-action@v4

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: ng test --watch=false --code-coverage
      - run: ng build --configuration=production
```

---

## Implementation Steps

### Step 1 — Fill coverage gaps
Run coverage reports for both frontend and backend. Identify all untested paths. Write tests until coverage targets are met:
```bash
# Backend
pytest --cov=apps --cov-report=html
open htmlcov/index.html  # identify uncovered lines

# Frontend
ng test --watch=false --code-coverage
open coverage/index.html
```

Focus coverage on: edge cases in facade methods, error paths in interceptors, permission checks in backend views.

### Step 2 — Add `@extend_schema` to backend views
For any view that drf-spectacular doesn't auto-document correctly, add decorators:
```python
@extend_schema(
    summary="Submit or update a recipe rating",
    request=RatingSerializer,
    responses={200: RecipeDetailSerializer, 201: RecipeDetailSerializer},
)
class RateRecipeView(APIView):
    ...
```

### Step 3 — SEO implementation
Add Angular `Title` and `Meta` service injection to all page components. Set appropriate tags in `ngOnInit` after data loads.

### Step 4 — Performance optimizations
- Add `changeDetection: ChangeDetectionStrategy.OnPush` to all feature components
- Audit `recipe-list` for unnecessary re-renders using Angular DevTools
- Add `@defer` to `CommentThreadComponent` in recipe detail
- Add Cloudinary image transformation params to all `imageUrl` values in recipe service

### Step 5 — GA4 integration
Add gtag script to `index.html` (production environment check). Create an `AnalyticsService` in `core/services/` that wraps `gtag()` calls with type safety.

### Step 6 — Production Django settings
Create `config/settings/production.py`. Test locally by running with `DJANGO_SETTINGS_MODULE=config.settings.production`.

### Step 7 — Create GitHub repo and push
```bash
git init
git add .
git commit -m "Initial commit: The Soap Maker full-stack app"
git remote add origin https://github.com/{username}/the-soap-maker.git
git push -u origin main
```

### Step 8 — Deploy backend to Render
1. Create account at render.com
2. New Web Service → connect GitHub repo → select `soapmaker-backend/` as root
3. Build command: `pip install -r requirements/production.txt && python manage.py collectstatic --noinput`
4. Start command: `gunicorn config.wsgi --workers 2 --bind 0.0.0.0:$PORT`
5. Add PostgreSQL database (free tier)
6. Set all environment variables from the checklist above
7. Trigger first deploy — confirm migrations run via `release` command in Procfile

### Step 9 — Deploy frontend to Vercel
1. Create account at vercel.com
2. New Project → Import Git Repository → select `soapmaker-frontend/`
3. Framework preset: Angular
4. Build command: `ng build --configuration=production`
5. Output directory: `dist/soapmaker-frontend/browser`
6. Set all `VITE_*` environment variables
7. Deploy — confirm app loads at the Vercel URL

### Step 10 — Post-deploy smoke test
Run the full manual test checklist against the production URLs.

### Step 11 — Configure Stripe production webhook
In Stripe dashboard: add webhook endpoint `https://soapmaker-api.onrender.com/api/v1/subscriptions/webhook/`. Select events: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy the webhook signing secret to the `STRIPE_WEBHOOK_SECRET` env var in Render.

### Step 12 — Switch Stripe to live mode
Replace test keys with live keys in Render environment variables. **Do not commit live keys to git.**

---

## Test Plan

### Coverage Reports
```bash
# Backend — must reach ≥ 85%
pytest --cov=apps --cov-report=term-missing -q

# Frontend — must reach ≥ 90% on core/ and abstraction/
ng test --watch=false --code-coverage
```

### Lighthouse Audit
1. Open Chrome DevTools → Lighthouse tab
2. Run audit on:
   - `https://{your-vercel-url}/` (Home)
   - `https://{your-vercel-url}/recipes` (Recipe list)
   - `https://{your-vercel-url}/recipes/{any-slug}` (Recipe detail)
3. All three pages must score ≥ 90 on Performance, Accessibility, Best Practices, SEO

### Production Smoke Tests
| # | Test | Expected |
|---|---|---|
| 1 | Open production URL | App loads, no console errors |
| 2 | Register new account | Account created, trial banner visible |
| 3 | Login + page refresh | User remains logged in |
| 4 | Browse recipes | Real recipes from production DB visible |
| 5 | View recipe detail | Ingredients, steps, OG tags in `<head>` |
| 6 | Submit a recipe | Recipe saved and visible in My Recipes |
| 7 | Rate a recipe | Rating persisted across sessions |
| 8 | Post a comment | Comment visible to other users |
| 9 | Start Stripe checkout (live) | Stripe payment page loads |
| 10 | Complete payment | Premium features unlocked, no ads |
| 11 | AdSense loading (free user) | Ads visible (may take 24–48h for AdSense to activate) |
| 12 | Google OAuth | Full login flow completes |
| 13 | Swagger UI at `/api/schema/swagger-ui/` | All endpoints documented |
| 14 | GA4 realtime dashboard | Page views visible in GA4 when browsing |
| 15 | HTTPS on both frontend and backend | No mixed-content warnings |

### CI Pipeline
```bash
# Push to main branch triggers GitHub Actions
# Both backend-tests and frontend-tests jobs must pass (green checkmarks)
```

---

## Success Criteria
- [ ] Backend test coverage ≥ 85% (verified by `pytest --cov`)
- [ ] Frontend test coverage ≥ 90% on `core/` and `abstraction/` (verified by Istanbul)
- [ ] Lighthouse scores ≥ 90 on all 3 pages
- [ ] All 15 production smoke tests pass
- [ ] GitHub Actions CI pipeline runs green on every push to `main`
- [ ] Stripe live webhook configured and verified with a real test payment
- [ ] OpenAPI Swagger UI documents all endpoints correctly
- [ ] HTTPS enforced on both Vercel and Render URLs
- [ ] No `console.error` calls in production browser console

---

## Dependencies
- All previous milestones complete (Milestones 1–9)
- GitHub account + repo
- Vercel account
- Render account
- Stripe account (with live keys for final step)
- Google AdSense account (approval may take 24–72h)
- Google Analytics 4 property created

---

*Estimated effort: 2 days*

---

## Total Project Timeline Summary

| Milestone | Name | Effort |
|---|---|---|
| 1 | Dev Environment & Scaffolding | 0.5 day |
| 2 | Backend Auth & User API | 1 day |
| 3 | Backend Recipes & Ingredients API | 1.5 days |
| 4 | Backend Community & Subscriptions API | 1.5 days |
| 5 | Frontend Shell with Stubs | 2–3 days |
| 6 | Frontend Auth Integration | 1.5 days |
| 7 | Frontend Recipes Integration | 2 days |
| 8 | Frontend Community Features | 1.5 days |
| 9 | Monetization & Premium Features | 2 days |
| 10 | Production Deploy & Launch | 2 days |
| **Total** | | **~16–17 days** |
