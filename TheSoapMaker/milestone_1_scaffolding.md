# Milestone 1 — Dev Environment & Project Scaffolding

> **Goal:** Both the Angular frontend and Django backend projects exist, run locally, and can communicate. No business logic yet — only the skeleton that every future milestone builds on.

---

## Deliverables

### Backend (`soapmaker-backend/`)
- Django project created with split settings (`base.py`, `development.py`, `production.py`)
- Five Django apps registered: `users`, `recipes`, `ratings`, `comments`, `subscriptions`
- `requirements/base.txt` and `requirements/development.txt` populated with all planned libraries
- PostgreSQL connection configured via `DATABASE_URL` env var (SQLite fallback for local dev)
- `GET /api/v1/health/` endpoint returning `{"status": "ok"}`
- `django-cors-headers` installed and configured to allow `http://localhost:4200`
- `.env.example` file listing every required environment variable
- `Procfile` with `web: gunicorn config.wsgi`
- `drf-spectacular` installed; Swagger UI available at `/api/schema/swagger-ui/`

### Frontend (`soapmaker-frontend/`)
- Angular project scaffolded with the `frontend` skill (Angular 21, standalone components, signals)
- Full 3-layer folder structure in place: `core/`, `abstraction/`, `features/`, `shared/`
- All model files created as empty TypeScript interfaces: `user.model.ts`, `recipe.model.ts`, `ingredient.model.ts`, `rating.model.ts`, `comment.model.ts`, `subscription.model.ts`
- All store files created as empty `@Injectable` signal stores: `auth.store.ts`, `recipe.store.ts`, `subscription.store.ts`, `ui.store.ts`
- All facade files created as empty `@Injectable` classes: `auth.facade.ts`, `recipe.facade.ts`, `rating.facade.ts`, `comment.facade.ts`, `subscription.facade.ts`, `user.facade.ts`
- All interceptors registered but no-op: `auth.interceptor.ts`, `error.interceptor.ts`
- `environment.ts` with `apiUrl: 'http://localhost:8000/api/v1'`
- `environment.prod.ts` with `apiUrl` placeholder
- App compiles and serves at `http://localhost:4200` with a placeholder "Welcome to SoapMaker" message
- `HttpClient` configured in `app.config.ts` with the two interceptors

### Shared
- `README.md` in the repo root describing how to run both projects locally

---

## Implementation Steps

### Step 1 — Read the frontend skill
```
Read /sessions/.../mnt/.claude/skills/frontend/SKILL.md
```
Follow all instructions from the skill before generating any Angular code.

### Step 2 — Scaffold the Django backend
```bash
mkdir soapmaker-backend && cd soapmaker-backend
python -m venv venv && source venv/bin/activate
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt dj-rest-auth django-allauth drf-spectacular django-filter cloudinary django-cloudinary-storage stripe python-dotenv psycopg2-binary pytest-django
django-admin startproject config .
python manage.py startapp users
python manage.py startapp recipes
python manage.py startapp ratings
python manage.py startapp comments
python manage.py startapp subscriptions
```

Split settings into `config/settings/base.py`, `config/settings/development.py`, `config/settings/production.py`. Point `manage.py` at `config.settings.development`.

Register all five apps and all required third-party packages in `INSTALLED_APPS`.

### Step 3 — Configure CORS and DRF
In `base.py`:
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:4200"]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticatedOrReadOnly"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
```

### Step 4 — Create the health endpoint
In `config/urls.py`:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok"})

urlpatterns = [
    path("api/v1/health/", health),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
]
```

### Step 5 — Scaffold the Angular frontend
Use the `frontend` skill to scaffold the project with the exact folder structure from the PROJECT_PLAN.md Section 14. Create every file listed under `core/`, `abstraction/`, `features/`, `shared/` — all as minimal stubs that compile without errors.

### Step 6 — Wire up environments and HttpClient
In `app.config.ts`:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

### Step 7 — Verify connectivity
Add a one-time `HttpClient.get('/api/v1/health/')` call from `AppComponent.ngOnInit()` and `console.log` the result. This verifies end-to-end connectivity even before any real feature exists.

---

## Test Plan

### Backend Tests
Run: `pytest` from `soapmaker-backend/`

| # | Test | Expected Result |
|---|---|---|
| 1 | `GET /api/v1/health/` | HTTP 200, body `{"status": "ok"}` |
| 2 | `GET /api/schema/swagger-ui/` | HTTP 200, Swagger HTML page loads |
| 3 | Run `python manage.py migrate` | No errors, all migrations apply cleanly |
| 4 | Run `python manage.py check` | No system check errors |

Write these as pytest functions in `config/tests/test_health.py`:
```python
def test_health_endpoint(client):
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

### Frontend Tests
Run: `ng build` and `ng test --watch=false`

| # | Test | Expected Result |
|---|---|---|
| 1 | `ng build` | Compiles with 0 errors, 0 warnings |
| 2 | `ng test --watch=false` | All generated spec files pass |
| 3 | `ng serve` then open `http://localhost:4200` | App loads, no console errors |
| 4 | Network tab in browser | `GET /api/v1/health/` returns `{"status": "ok"}` |

### Manual Smoke Test
1. Start backend: `python manage.py runserver`
2. Start frontend: `ng serve`
3. Open `http://localhost:4200` — "Welcome to SoapMaker" visible
4. Open browser DevTools → Network tab → confirm `health` request is `200 OK`
5. Open `http://localhost:8000/api/schema/swagger-ui/` — Swagger UI loads

---

## Success Criteria
- [ ] `ng build` produces no errors
- [ ] `pytest` passes all health tests
- [ ] Frontend app loads at `localhost:4200` with no console errors
- [ ] Backend health endpoint returns `{"status":"ok"}`
- [ ] Both processes can run simultaneously without port conflicts
- [ ] All model, store, facade, and interceptor stub files exist and are importable

---

## Dependencies
- None (this is the first milestone)

---

*Estimated effort: 0.5 day*
