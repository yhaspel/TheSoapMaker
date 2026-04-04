# Milestone 2 — Backend: Auth & User API

> **Goal:** A fully working authentication system — email/password registration and login returning JWT tokens, plus social OAuth plumbing (Google, Facebook, X) via `django-allauth`. The `CustomUser` model is live in the database with trial fields. All auth endpoints are tested.

---

## Deliverables

### `apps/users/`
- `CustomUser` model extending `AbstractUser`:
  - `id` (UUID, primary key)
  - `email` (unique, used as `USERNAME_FIELD`)
  - `display_name` (VARCHAR 100)
  - `avatar_url` (VARCHAR 500, blank/null)
  - `bio` (TEXT, blank)
  - `is_premium` (BOOLEAN, default False — derived property, also stored for quick lookups)
  - `trial_started_at` (TIMESTAMP, null)
  - `trial_ends_at` (TIMESTAMP, null — set to `trial_started_at + 7 days` on creation)
- `UserSerializer` and `UserProfileSerializer`
- `UserProfileView` (`GET /api/v1/auth/user/`, `PUT /api/v1/auth/user/`) — authenticated
- Custom allauth adapter that sets `trial_started_at` and `trial_ends_at` on account creation
- Social OAuth apps registered for Google, Facebook, X in Django admin (sites framework)
- Migration files that apply cleanly

### `config/urls.py` additions
```
/api/v1/auth/registration/      POST  — email/password signup
/api/v1/auth/login/             POST  — returns access + refresh JWT
/api/v1/auth/logout/            POST  — token blacklist
/api/v1/auth/token/refresh/     POST  — refresh access token
/api/v1/auth/user/              GET/PUT — own profile
/api/v1/auth/google/            GET   — OAuth redirect
/api/v1/auth/facebook/          GET   — OAuth redirect
/api/v1/auth/twitter/           GET   — OAuth redirect
```

### Settings additions
- `AUTH_USER_MODEL = 'users.CustomUser'`
- `ACCOUNT_USER_MODEL_USERNAME_FIELD = None`
- `ACCOUNT_EMAIL_REQUIRED = True`
- `ACCOUNT_USERNAME_REQUIRED = False`
- `ACCOUNT_AUTHENTICATION_METHOD = 'email'`
- JWT settings: access token 15 min, refresh token 7 days, `ROTATE_REFRESH_TOKENS = True`, `BLACKLIST_AFTER_ROTATION = True`
- `SOCIALACCOUNT_PROVIDERS` block for Google, Facebook, Twitter in `base.py`

---

## Implementation Steps

### Step 1 — CustomUser model
In `apps/users/models.py`, define `CustomUser(AbstractUser)`. Remove `username` field, set `USERNAME_FIELD = 'email'`, add the trial fields with a `save()` override that auto-sets `trial_ends_at = trial_started_at + timedelta(days=7)` on first save.

```python
class CustomUser(AbstractUser):
    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        if not self.trial_started_at:
            self.trial_started_at = timezone.now()
            self.trial_ends_at = self.trial_started_at + timedelta(days=7)
        super().save(*args, **kwargs)
```

### Step 2 — Serializers
Create `UserSerializer` with all fields. Create `UserProfileSerializer` (read/write) for `GET/PUT /auth/user/` — exposes `display_name`, `avatar_url`, `bio` as writable, plus `is_premium`, `trial_ends_at` as read-only.

### Step 3 — Custom allauth adapter
`apps/users/adapters.py`:
```python
class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        # trial fields are set by CustomUser.save()
        if commit:
            user.save()
        return user
```

Set `ACCOUNT_ADAPTER = 'apps.users.adapters.CustomAccountAdapter'` in settings.

### Step 4 — Wire up dj-rest-auth and allauth URLs
In `config/urls.py`:
```python
urlpatterns += [
    path("api/v1/auth/", include("dj_rest_auth.urls")),
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/v1/auth/", include("allauth.socialaccount.urls")),
]
```

### Step 5 — JWT configuration
In `base.py`:
```python
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": False,  # allow Angular to read refresh token
}
```

### Step 6 — Social OAuth providers
Register `allauth.socialaccount.providers.google`, `facebook`, `twitter_oauth2` in `INSTALLED_APPS`. Add `SOCIALACCOUNT_PROVIDERS` config block. Actual client IDs/secrets come from `.env` — leave as env var placeholders.

### Step 7 — Migrations
```bash
python manage.py makemigrations users
python manage.py migrate
```

---

## Test Plan

Run: `pytest apps/users/tests/ -v`

Write all tests in `apps/users/tests/test_auth.py` using `pytest-django` with the `@pytest.mark.django_db` decorator.

### Registration Tests
| # | Test | Input | Expected |
|---|---|---|---|
| 1 | Successful registration | Valid email + password | HTTP 201, `access` token in response |
| 2 | Registration sets trial fields | New user signup | `trial_started_at` is set, `trial_ends_at = trial_started_at + 7 days` |
| 3 | Duplicate email | Same email twice | HTTP 400, `"email": ["A user with that email already exists."]` |
| 4 | Weak password | Password `"123"` | HTTP 400, password validation error |
| 5 | Missing email | No email field | HTTP 400 |

### Login Tests
| # | Test | Input | Expected |
|---|---|---|---|
| 6 | Successful login | Registered email + password | HTTP 200, `access` and `refresh` tokens in body |
| 7 | Wrong password | Correct email, wrong password | HTTP 400 |
| 8 | Unknown email | Unregistered email | HTTP 400 |
| 9 | Access token is short-lived | Decode token | `exp - iat == 900 seconds (15 min)` |

### Token Refresh Tests
| # | Test | Input | Expected |
|---|---|---|---|
| 10 | Refresh succeeds | Valid refresh token | HTTP 200, new `access` token returned |
| 11 | Old refresh token blacklisted | Use original refresh after rotation | HTTP 401 |
| 12 | Invalid refresh token | Garbage string | HTTP 401 |

### Profile Tests
| # | Test | Input | Expected |
|---|---|---|---|
| 13 | GET own profile | Authenticated request | HTTP 200, email, display_name, trial_ends_at |
| 14 | PUT update display_name | `{"display_name": "Soapsmith"}` | HTTP 200, display_name updated |
| 15 | GET profile unauthenticated | No Authorization header | HTTP 401 |

### Logout Tests
| # | Test | Input | Expected |
|---|---|---|---|
| 16 | Logout invalidates refresh | POST logout, then try refresh | Refresh token can no longer be used |

### Run all tests
```bash
pytest apps/users/tests/ -v --tb=short
```
All 16 tests must pass.

---

## Success Criteria
- [ ] `python manage.py migrate` runs with zero errors
- [ ] `python manage.py createsuperuser` works (email-only, no username)
- [ ] All 16 auth tests pass
- [ ] `POST /api/v1/auth/registration/` creates a user with trial fields populated
- [ ] JWT tokens decoded show correct lifetimes
- [ ] `/api/schema/swagger-ui/` shows all auth endpoints documented

---

## Dependencies
- Milestone 1 complete (project scaffolding, Django apps registered)

---

*Estimated effort: 1 day*
