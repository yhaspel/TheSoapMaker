# Milestone 3 — Backend: Recipes & Ingredients API

> **Goal:** The full recipes and ingredients domain is live. Any client can browse, search, filter, and paginate recipes. Authenticated users can create, edit, and delete their own recipes with image uploads via Cloudinary. The ingredient database is seeded. All endpoints are covered by tests.

---

## Deliverables

### `apps/recipes/` — Models
- `Tag` — `id` (UUID), `name` (unique slug-style string)
- `Ingredient` — full schema from PROJECT_PLAN §6: `id`, `name`, `category` (ENUM), `saponification_value`, `description`
- `Recipe` — full schema from PROJECT_PLAN §6: all fields including `method` ENUM, `difficulty` ENUM, `average_rating` (denormalized float), `rating_count`, `tags` (M2M), `is_published`, `image_url`, `slug`
- `RecipeIngredient` (through table) — `recipe`, `ingredient`, `amount_grams`, `percentage`, `notes`
- `Step` — `recipe`, `order`, `instruction`, `image_url`
- Auto-slug generation on `Recipe.save()` using `django.utils.text.slugify`
- `signals.py` — `post_save` on `Rating` model recalculates `recipe.average_rating` and `recipe.rating_count` (ratings app signal, wired here)

### `apps/recipes/` — API
- `RecipeListCreateView` → `GET /api/v1/recipes/` and `POST /api/v1/recipes/`
- `RecipeDetailView` → `GET/PUT/PATCH/DELETE /api/v1/recipes/{slug}/`
- `TopRatedView` → `GET /api/v1/recipes/top-rated/`
- `MyRecipesView` → `GET /api/v1/recipes/my/`
- `RecipeIngredientListView` → `GET /api/v1/recipes/{slug}/ingredients/`
- `IngredientListView` → `GET /api/v1/ingredients/`
- `IngredientDetailView` → `GET /api/v1/ingredients/{id}/`
- `CloudinaryUploadPresignView` → `POST /api/v1/recipes/upload-url/` — returns a signed Cloudinary upload preset URL for direct browser upload

### Filtering (`apps/recipes/filters.py`)
Using `django-filter`:
- `search` — full-text search on `name`, `description`, tags
- `method` — exact match
- `difficulty` — exact match
- `tag` — filter by tag name
- `ordering` — `-average_rating`, `-created_at`, `-rating_count`
- Pagination: `PageNumberPagination`, page size 12, max 50

### Permissions
- `GET` endpoints: `AllowAny`
- `POST` (create): `IsAuthenticated`
- `PUT/PATCH/DELETE`: custom `IsAuthorOrReadOnly` permission class

### Serializers
- `RecipeListSerializer` — compact (for list views): `id`, `slug`, `name`, `method`, `difficulty`, `average_rating`, `rating_count`, `image_url`, `author` (nested display_name + avatar_url), `tags`, `created_at`
- `RecipeDetailSerializer` — full: includes `ingredients` (nested), `steps` (ordered), all list fields
- `RecipeWriteSerializer` — for POST/PUT/PATCH: accepts `ingredients` and `steps` as writable nested arrays
- `IngredientSerializer` — all fields
- `StepSerializer` — `order`, `instruction`, `image_url`
- `RecipeIngredientSerializer` — ingredient name + category + SAP value + `amount_grams` + `percentage` + `notes`

### Seed Data
- Management command `python manage.py seed_ingredients` that loads ~30 common soap-making ingredients with correct SAP values (coconut oil, olive oil, palm oil, castor oil, shea butter, sodium hydroxide, potassium hydroxide, distilled water, etc.)

---

## Implementation Steps

### Step 1 — Define all models
Create all models in `apps/recipes/models.py`. Use `models.TextChoices` for `method` and `difficulty` and `category` ENUMs.

```python
class Recipe(models.Model):
    class Method(models.TextChoices):
        COLD_PROCESS = 'cold_process', 'Cold Process'
        HOT_PROCESS = 'hot_process', 'Hot Process'
        MELT_AND_POUR = 'melt_and_pour', 'Melt & Pour'
        LIQUID = 'liquid', 'Liquid'

    class Difficulty(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'
    # ... fields ...
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

### Step 2 — Migrations
```bash
python manage.py makemigrations recipes
python manage.py migrate
```

### Step 3 — Serializers
Write all serializers. For `RecipeWriteSerializer`, override `create()` and `update()` to handle nested `ingredients` (list of `{ingredient_id, amount_grams, percentage, notes}`) and `steps` (list of `{order, instruction, image_url}`).

### Step 4 — Views and permissions
Write `IsAuthorOrReadOnly`:
```python
class IsAuthorOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user
```

### Step 5 — Filters
`apps/recipes/filters.py` using `django_filters.FilterSet`. Add `SearchFilter` and `OrderingFilter` to the view's `filter_backends`.

### Step 6 — URLs
`apps/recipes/urls.py` → include in `config/urls.py` at `api/v1/`.

### Step 7 — Cloudinary config
Add to `base.py`:
```python
import cloudinary
cloudinary.config(
    cloud_name=env("CLOUDINARY_CLOUD_NAME"),
    api_key=env("CLOUDINARY_API_KEY"),
    api_secret=env("CLOUDINARY_API_SECRET"),
)
```
`CloudinaryUploadPresignView` returns `{"upload_url": ..., "api_key": ..., "timestamp": ..., "signature": ...}` so the browser can upload directly.

### Step 8 — Seed command
`apps/recipes/management/commands/seed_ingredients.py` — use `bulk_create` with `update_or_create` logic so it is idempotent.

---

## Test Plan

Run: `pytest apps/recipes/tests/ -v`

Write tests in `apps/recipes/tests/test_recipes.py` and `apps/recipes/tests/test_ingredients.py`.

### Ingredient Tests
| # | Test | Expected |
|---|---|---|
| 1 | `GET /api/v1/ingredients/` | HTTP 200, list of ingredients |
| 2 | `GET /api/v1/ingredients/{id}/` | HTTP 200, single ingredient with SAP value |
| 3 | Seed command | After running `seed_ingredients`, at least 10 ingredients exist in DB |

### Recipe List & Filter Tests
| # | Test | Expected |
|---|---|---|
| 4 | `GET /api/v1/recipes/` (no auth) | HTTP 200, paginated list |
| 5 | `?search=lavender` | Only recipes matching "lavender" in name/description/tags |
| 6 | `?method=cold_process` | All returned recipes have `method == cold_process` |
| 7 | `?difficulty=beginner` | All returned recipes have `difficulty == beginner` |
| 8 | `?ordering=-average_rating` | Recipes ordered highest rating first |
| 9 | Pagination: `?page=2` | Returns second page (or empty if < 13 recipes) |
| 10 | `GET /api/v1/recipes/top-rated/` | Returns up to 6 recipes, highest rated first |

### Recipe CRUD Tests
| # | Test | Expected |
|---|---|---|
| 11 | `POST /api/v1/recipes/` unauthenticated | HTTP 401 |
| 12 | `POST /api/v1/recipes/` authenticated, valid data | HTTP 201, slug auto-generated, author = current user |
| 13 | `POST` with nested ingredients and steps | Recipe created with ingredients and steps in DB |
| 14 | `GET /api/v1/recipes/{slug}/` | HTTP 200, full detail with ingredients and steps |
| 15 | `GET /api/v1/recipes/{slug}/ingredients/` | HTTP 200, list of RecipeIngredient rows |
| 16 | `PUT /api/v1/recipes/{slug}/` by author | HTTP 200, recipe updated |
| 17 | `PUT /api/v1/recipes/{slug}/` by other user | HTTP 403 |
| 18 | `DELETE /api/v1/recipes/{slug}/` by author | HTTP 204 |
| 19 | `DELETE /api/v1/recipes/{slug}/` by other user | HTTP 403 |
| 20 | `GET /api/v1/recipes/my/` | Returns only the authenticated user's recipes |
| 21 | `GET /api/v1/recipes/my/` unauthenticated | HTTP 401 |

### Slug Tests
| # | Test | Expected |
|---|---|---|
| 22 | Create recipe named "Lavender Dream" | `slug == "lavender-dream"` |
| 23 | Create two recipes with same name | Second gets a unique slug (e.g., `lavender-dream-2`) |

### Run all tests
```bash
pytest apps/recipes/tests/ -v --tb=short
```
All 23 tests must pass.

---

## Success Criteria
- [ ] All migrations apply cleanly
- [ ] `seed_ingredients` command runs without errors and populates ≥ 10 ingredients
- [ ] All 23 recipe/ingredient tests pass
- [ ] `GET /api/v1/recipes/` returns paginated data visible in Swagger UI
- [ ] Creating a recipe with nested ingredients and steps stores all child records correctly
- [ ] `IsAuthorOrReadOnly` blocks unauthorized edits (403 not 401)

---

## Dependencies
- Milestone 2 complete (`CustomUser` model exists for `author` FK)

---

*Estimated effort: 1.5 days*
