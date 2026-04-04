# Milestone 4 — Backend: Community & Subscriptions API

> **Goal:** Ratings, comments, and the full Stripe subscription/trial system are implemented and tested. The backend is feature-complete. Every endpoint from the API Design (PROJECT_PLAN §7) exists and is covered by tests.

---

## Deliverables

### `apps/ratings/`
- `Rating` model: `id` (UUID), `user` (FK), `recipe` (FK), `stars` (1–5 SmallInt), `created_at`, unique constraint on `(user, recipe)`
- `POST /api/v1/recipes/{slug}/rate/` — upsert: create if new, update if user already rated
- `GET /api/v1/recipes/{slug}/ratings/` — list ratings for a recipe
- Signal: on `Rating` post_save / post_delete, recalculate `recipe.average_rating` and `recipe.rating_count`

### `apps/comments/`
- `Comment` model: `id` (UUID), `user` (FK), `recipe` (FK), `parent` (self-FK, nullable), `body` (TEXT), `is_flagged` (BOOLEAN), `created_at`, `updated_at`
- `GET /api/v1/recipes/{slug}/comments/` — paginated list (page size 20), threaded (replies nested under parent)
- `POST /api/v1/recipes/{slug}/comments/` — create, requires auth; `parent` field optional for reply
- `DELETE /api/comments/{id}/` — author or admin only
- `POST /api/comments/{id}/flag/` — authenticated, sets `is_flagged = True`

### `apps/subscriptions/`
- `Subscription` model: `id` (UUID), `user` (OneToOne FK), `stripe_customer_id`, `stripe_subscription_id`, `plan` (ENUM: `free`, `premium_monthly`, `premium_annual`), `status` (ENUM: `active`, `canceled`, `past_due`, `trialing`), `current_period_end`, `cancel_at_period_end`
- `StripeService` in `stripe_service.py` — all Stripe API calls isolated here (create customer, create checkout session, retrieve subscription, cancel subscription)
- `GET /api/v1/subscriptions/status/` — returns current plan, trial info, days remaining
- `POST /api/v1/subscriptions/create-checkout/` — creates Stripe Checkout session, returns `{checkout_url}`
- `POST /api/v1/subscriptions/cancel/` — calls Stripe to cancel at period end
- `POST /api/v1/subscriptions/webhook/` — handles: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` — verifies Stripe signature
- Helper `is_premium(user)` function used across the app to check: active subscription OR active trial

### `apps/users/` additions
- `UserProfileSerializer` now includes `is_in_trial` (bool), `trial_days_remaining` (int), computed from trial fields

---

## Implementation Steps

### Step 1 — Ratings model + signal
`apps/ratings/models.py`:
```python
class Rating(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    recipe = models.ForeignKey('recipes.Recipe', on_delete=models.CASCADE, related_name='ratings')
    stars = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')
```

`apps/ratings/signals.py`:
```python
@receiver(post_save, sender=Rating)
@receiver(post_delete, sender=Rating)
def update_recipe_rating(sender, instance, **kwargs):
    recipe = instance.recipe
    agg = recipe.ratings.aggregate(avg=Avg('stars'), count=Count('id'))
    recipe.average_rating = agg['avg'] or 0.0
    recipe.rating_count = agg['count']
    recipe.save(update_fields=['average_rating', 'rating_count'])
```

### Step 2 — Ratings views
`RateRecipeView` (POST `/recipes/{slug}/rate/`): use `update_or_create(user=request.user, recipe=recipe)`.
`RecipeRatingsListView` (GET): standard list view.

### Step 3 — Comments model and views
`apps/comments/models.py` — define model with self-referencing `parent`.

Serializer: `CommentSerializer` with `replies` as a nested `SerializerMethodField` that returns direct children (1 level deep only).

`CommentListCreateView` on `/recipes/{slug}/comments/` — filter by `recipe`, order by `created_at`, paginate. Only root comments (parent=None) at top level; replies embedded.

`CommentDeleteView` on `/comments/{id}/` — permission: author OR `request.user.is_staff`.

`CommentFlagView` on `/comments/{id}/flag/` — sets `is_flagged = True`, returns 200.

### Step 4 — Subscriptions model
`apps/subscriptions/models.py` — define `Subscription` with ENUM choices via `models.TextChoices`.

Create `post_save` signal on `Subscription` that updates `user.is_premium` whenever subscription status changes.

### Step 5 — StripeService
`apps/subscriptions/stripe_service.py`:
```python
class StripeService:
    @staticmethod
    def get_or_create_customer(user) -> str:
        # create stripe.Customer if user has no stripe_customer_id
        ...

    @staticmethod
    def create_checkout_session(user, plan: str, success_url: str, cancel_url: str) -> str:
        # returns checkout session URL
        ...

    @staticmethod
    def cancel_subscription(subscription_id: str) -> None:
        # stripe.Subscription.modify(..., cancel_at_period_end=True)
        ...
```

### Step 6 — Subscription views and webhook
`SubscriptionStatusView` — compute `is_in_trial` from user's trial fields + Subscription status.

`WebhookView` — verify Stripe signature using `stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)`. Handle each event type by updating `Subscription` model fields.

### Step 7 — Wire all URLs
```python
# config/urls.py additions
path("api/v1/", include("apps.ratings.urls")),
path("api/v1/", include("apps.comments.urls")),
path("api/v1/subscriptions/", include("apps.subscriptions.urls")),
```

### Step 8 — Migrations
```bash
python manage.py makemigrations ratings comments subscriptions
python manage.py migrate
```

---

## Test Plan

### Ratings Tests
Run: `pytest apps/ratings/tests/ -v`

| # | Test | Expected |
|---|---|---|
| 1 | `POST /recipes/{slug}/rate/` unauthenticated | HTTP 401 |
| 2 | First rating submission | HTTP 201, `recipe.average_rating` updated |
| 3 | Second rating by same user (update) | HTTP 200, `average_rating` recalculated |
| 4 | Rating stars = 0 | HTTP 400 (validation error) |
| 5 | Rating stars = 6 | HTTP 400 (validation error) |
| 6 | Two users rate same recipe | `average_rating = (r1 + r2) / 2` |
| 7 | Delete rating | `rating_count` decrements, `average_rating` recalculated |
| 8 | `GET /recipes/{slug}/ratings/` | HTTP 200, list of ratings |

### Comments Tests
Run: `pytest apps/comments/tests/ -v`

| # | Test | Expected |
|---|---|---|
| 9 | `POST /recipes/{slug}/comments/` unauthenticated | HTTP 401 |
| 10 | Post a top-level comment | HTTP 201, `parent = null` |
| 11 | Post a reply (`parent = comment_id`) | HTTP 201, reply nested in GET response |
| 12 | `GET /recipes/{slug}/comments/` | HTTP 200, root comments with nested replies |
| 13 | `DELETE /comments/{id}/` by author | HTTP 204 |
| 14 | `DELETE /comments/{id}/` by other user | HTTP 403 |
| 15 | `DELETE /comments/{id}/` by admin | HTTP 204 |
| 16 | `POST /comments/{id}/flag/` | HTTP 200, `is_flagged = True` in DB |

### Subscription Tests
Run: `pytest apps/subscriptions/tests/ -v`

Use `unittest.mock.patch` to mock Stripe API calls — never hit the real Stripe API in tests.

| # | Test | Expected |
|---|---|---|
| 17 | `GET /subscriptions/status/` unauthenticated | HTTP 401 |
| 18 | New user, within trial window | `status: trialing`, `trial_days_remaining >= 1` |
| 19 | New user, trial expired | `status: free`, `trial_days_remaining: 0` |
| 20 | `POST /subscriptions/create-checkout/` (Stripe mocked) | HTTP 200, `checkout_url` in response |
| 21 | `POST /subscriptions/cancel/` (Stripe mocked) | HTTP 200, `cancel_at_period_end = True` in DB |
| 22 | Webhook `customer.subscription.updated` → active | `user.is_premium = True` |
| 23 | Webhook `customer.subscription.deleted` | `user.is_premium = False`, status = `canceled` |
| 24 | Webhook with invalid signature | HTTP 400 |
| 25 | `is_premium()` helper — active subscription | Returns `True` |
| 26 | `is_premium()` helper — within trial | Returns `True` |
| 27 | `is_premium()` helper — free, no trial | Returns `False` |

### Full Backend Integration Test
```bash
pytest --tb=short -q
```
All tests from Milestones 2, 3, and 4 must pass together. Zero errors.

---

## Success Criteria
- [ ] All migrations apply cleanly
- [ ] All 27 new tests pass
- [ ] All tests from previous milestones still pass (no regressions)
- [ ] Rating signal correctly updates `recipe.average_rating` on every rating change
- [ ] Webhook rejects requests with invalid Stripe signatures
- [ ] `GET /api/schema/swagger-ui/` documents all endpoints including subscriptions and comments
- [ ] Backend is now feature-complete (all endpoints from PROJECT_PLAN §7 exist)

---

## Dependencies
- Milestone 3 complete (Recipe model exists for FK relations in ratings and comments)

---

*Estimated effort: 1.5 days*
