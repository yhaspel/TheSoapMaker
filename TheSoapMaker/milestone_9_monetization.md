# Milestone 9 — Monetization & Premium Features

> **Goal:** The complete monetization layer is live. Free users see ads and are blocked from premium features. Premium users have an ad-free experience, access to the lye calculator and bookmarks. Stripe checkout and the trial system work end-to-end.

---

## Deliverables

### `core/services/subscription.service.ts` — Real implementation
```typescript
getStatus(): Observable<SubscriptionStatus>
  → GET /api/v1/subscriptions/status/

createCheckout(plan: 'premium_monthly' | 'premium_annual'): Observable<{checkoutUrl: string}>
  → POST /api/v1/subscriptions/create-checkout/   body: {plan}

cancel(): Observable<void>
  → POST /api/v1/subscriptions/cancel/
```

`SubscriptionStatus` interface:
```typescript
interface SubscriptionStatus {
  plan: 'free' | 'premium_monthly' | 'premium_annual';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'free';
  isInTrial: boolean;
  trialDaysRemaining: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
```

### `subscription.store.ts` — Extended
Add:
- `currentPeriodEnd: Signal<Date | null>`
- `cancelAtPeriodEnd: Signal<boolean>`
- `trialDaysRemaining: Signal<number>`

### `subscription.facade.ts` — Real implementation
```typescript
loadStatus(): void  // on app init + after checkout return
startCheckout(plan: string): void  // calls service, redirects browser to checkoutUrl
cancelSubscription(): void  // calls service, reloads status
readonly isPremium: Signal<boolean>
readonly trialActive: Signal<boolean>
readonly trialDaysRemaining: Signal<number>
readonly plan: Signal<string>
readonly cancelAtPeriodEnd: Signal<boolean>
```

`startCheckout()` implementation:
```typescript
startCheckout(plan: string): void {
  this.subService.createCheckout(plan).subscribe({
    next: ({ checkoutUrl }) => window.location.href = checkoutUrl,
    error: () => this.uiStore.addToast('Could not start checkout', 'error'),
  });
}
```

After Stripe redirects back to the app, `AppComponent.ngOnInit()` checks for `?checkout=success` query param and calls `subscriptionFacade.loadStatus()` to refresh subscription state.

### `core/guards/premium.guard.ts` — Active
Guards are already implemented in Milestone 6. Now apply them to real premium routes:
```typescript
// recipes.routes.ts — recipe detail lye calculator section uses isPremium signal
// premium.routes.ts — no route guards needed (pricing page is public)
// auth.routes.ts
{ path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
```

The lye calculator visibility is controlled by the `isPremium` signal in the template, not by a route guard.

### `features/premium/trial-banner/` — Connected
`TrialBannerComponent`:
- Visible only when `trialActive()` is true
- Shows: "You have {trialDaysRemaining} days left in your free trial"
- "Upgrade Now" button → calls `subscriptionFacade.startCheckout('premium_monthly')`
- Dismiss button → stores dismissal in `sessionStorage` under `sm_trial_banner_dismissed`; banner does not show again for the session
- Position: fixed bottom bar, above footer

### `features/premium/pricing/` — Connected
- "Get Monthly" button → calls `subscriptionFacade.startCheckout('premium_monthly')`
- "Get Annual" button → calls `subscriptionFacade.startCheckout('premium_annual')`
- Show loading spinner on button while checkout is initializing
- If user is already premium: show "You're Premium!" state with "Cancel Subscription" button
- "Cancel Subscription" calls `subscriptionFacade.cancelSubscription()` → shows "Your subscription will end on {currentPeriodEnd}" message
- If `cancelAtPeriodEnd = true`: show "Subscription canceling on {date}" chip, and a "Resume Subscription" button (call `startCheckout()` again to reactivate)

### `features/auth/profile/` — Subscription section
Add a "Subscription" card to the profile page:
- Shows current plan, status, next billing date
- "Manage Subscription" → links to `/premium/pricing`
- If trialing: shows trial days remaining

### `shared/components/ad-banner/` — Connected
Replace placeholder `<div class="ad-placeholder">` with real AdSense code:
```html
@if (!isPremium()) {
  <div class="ad-slot">
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXX"
         data-ad-slot="XXXXXXXXXX"
         data-ad-format="auto">
    </ins>
  </div>
}
```
The AdSense publisher ID is stored in `environment.ts` as `adSensePublisherId`.

Add the AdSense script to `index.html`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>
```

**Ad placements** (from PROJECT_PLAN §11):
- Recipe list page: leaderboard (728×90) below header
- Recipe detail page: rectangle (300×250) in right sidebar
- Every 6th recipe card in the grid: in-feed native unit

### Lye Calculator (Premium-only inline feature)
In `recipe-detail.component.html`, inside a `@if (isPremium())` block, add `LyeCalculatorComponent`.

`LyeCalculatorComponent`:
- Inputs: automatically populated from `selectedRecipe.ingredients` (oils only — filter by category = 'oil')
- Superfat slider: 0–10%, default 5%
- Water-to-lye ratio select: 1.5x, 2x, 2.5x, 3x (default 2x)
- NaOH or KOH toggle
- Calculated output: lye weight (grams) + water weight (grams), updated reactively as inputs change
- Copy-to-clipboard button for the result
- Formula: `lyeWeight = sum(oilWeight * sapValue) * (1 - superfat/100)`; `waterWeight = lyeWeight * ratio`

**Lye Calculator in Recipe Form (Step 2 — Ingredients)**
As the user adds ingredients in the recipe form, show a live running lye calculation at the bottom of Step 2.

### Recipe Bookmarks (Premium-only)
Add to backend first:
- New model `recipes_bookmark`: `user` (FK), `recipe` (FK), unique together
- `POST /api/v1/recipes/{slug}/bookmark/` → toggle (add if not exists, remove if exists)
- `GET /api/v1/recipes/bookmarked/` → list of bookmarked recipes

Then frontend:
- `bookmark.store.ts`: `bookmarkedIds: Signal<Set<string>>` (set of recipe slugs)
- `recipe.facade.ts` addition: `toggleBookmark(slug)`, `loadBookmarks()`
- Heart icon on `RecipeCardComponent`: filled if bookmarked, outline if not; visible only to authenticated premium users; click calls `recipeFacade.toggleBookmark(slug)` — optimistic UI
- New route `/recipes/bookmarks` → `BookmarksComponent` — loads bookmarked recipes

### Advanced Filters (Premium)
In the recipe list filter sidebar, add premium-only filters (visible but disabled/locked for free users with "Premium" badge):
- Cure time range: min/max days (slider or two inputs)
- Batch size range: min/max grams
- Yield range: min/max bars

When a locked filter is clicked by a non-premium user, show a tooltip: "Upgrade to Premium to use advanced filters" with a link to `/premium/pricing`.

Add corresponding query params to `GET /api/v1/recipes/`:
- `?cure_time_min=`, `?cure_time_max=`
- `?batch_size_min=`, `?batch_size_max=`

Add these to `apps/recipes/filters.py` on the backend.

---

## Implementation Steps

### Step 1 — Backend: bookmark model + endpoints
```bash
# In apps/recipes/models.py add Bookmark model
# In apps/recipes/views.py add BookmarkToggleView, BookmarkedRecipesView
# In apps/recipes/urls.py add routes
python manage.py makemigrations recipes
python manage.py migrate
```

### Step 2 — Backend: advanced filter fields
Add to `apps/recipes/filters.py`:
```python
cure_time_min = filters.NumberFilter(field_name='cure_time_days', lookup_expr='gte')
cure_time_max = filters.NumberFilter(field_name='cure_time_days', lookup_expr='lte')
batch_size_min = filters.NumberFilter(field_name='batch_size_grams', lookup_expr='gte')
batch_size_max = filters.NumberFilter(field_name='batch_size_grams', lookup_expr='lte')
```

### Step 3 — Implement real subscription service
Replace mock. Wire `loadStatus()` call into `AppComponent.ngOnInit()` after auth token is refreshed.

### Step 4 — Implement trial banner
Check `trialActive` signal. Wire dismiss to `sessionStorage`. Wire upgrade button.

### Step 5 — Connect pricing page
Wire both plan buttons to `startCheckout()`. Handle post-checkout redirect with `?checkout=success` query param check.

### Step 6 — Implement AdSense integration
Replace `<div class="ad-placeholder">` with real AdSense markup. Only render when `!isPremium()`. Add `(window as any).adsbygoogle` push call in `AdBannerComponent.ngAfterViewInit()`.

### Step 7 — Build lye calculator component
Create `LyeCalculatorComponent` as a standalone component. Use signals for reactive calculation: `lyeWeight = computed(() => calculateLye(ingredients(), superfat(), lyeType()))`.

### Step 8 — Implement bookmarks
Backend first (Step 1), then frontend: `bookmark.store.ts`, update facade, `RecipeCardComponent` heart icon, `BookmarksComponent` page.

### Step 9 — Implement advanced filters
Backend first (Step 2), then frontend UI in filter sidebar with premium lock behavior.

---

## Test Plan

### Backend Tests (new)
Run: `pytest apps/recipes/tests/test_bookmarks.py apps/subscriptions/tests/ -v`

| # | Test | Expected |
|---|---|---|
| 1 | `POST /recipes/{slug}/bookmark/` unauthenticated | HTTP 401 |
| 2 | `POST /recipes/{slug}/bookmark/` — toggle on | Bookmark created, HTTP 201 |
| 3 | `POST /recipes/{slug}/bookmark/` — toggle off | Bookmark deleted, HTTP 204 |
| 4 | `GET /recipes/bookmarked/` | Returns only current user's bookmarked recipes |
| 5 | `GET /recipes/?cure_time_min=28` | Only recipes with cure_time_days >= 28 |
| 6 | Subscription checkout (Stripe mocked) | Returns `{checkoutUrl}` |
| 7 | Subscription status — active | `isPremium = True` in response |
| 8 | Subscription status — canceled | `isPremium = False` in response |

### Frontend Unit Tests
Run: `ng test --watch=false`

| # | Test | Expected |
|---|---|---|
| 9 | `LyeCalculatorComponent` — 1000g coconut oil, SAP=0.190, 5% superfat | Lye = 180.5g |
| 10 | `LyeCalculatorComponent` — water ratio 2x | Water = 361.0g |
| 11 | `AdBannerComponent` — isPremium=true | Ad slot not rendered |
| 12 | `AdBannerComponent` — isPremium=false | Ad slot rendered |
| 13 | `TrialBannerComponent` — trialActive=true, 3 days remaining | Banner shows "3 days left" |
| 14 | `TrialBannerComponent` — trialActive=false | Banner not rendered |
| 15 | `RecipeCardComponent` — premium user | Bookmark heart icon visible |
| 16 | `RecipeCardComponent` — free user | Bookmark heart icon not visible |

### Integration Tests (backend running, Stripe in test mode)
| # | Action | Expected |
|---|---|---|
| 17 | New user sees trial banner | Banner visible with days remaining |
| 18 | Dismiss trial banner | Banner hidden for session |
| 19 | Click "Upgrade" on trial banner | Redirected to Stripe test checkout |
| 20 | Complete Stripe test checkout | Returned to app, subscription active, banner gone |
| 21 | Premium user views recipe detail | Lye calculator visible |
| 22 | Free user views recipe detail | Lye calculator not visible |
| 23 | Premium user bookmarks recipe | Heart fills, recipe in `/recipes/bookmarks` |
| 24 | Premium user un-bookmarks recipe | Heart empties, removed from bookmarks page |
| 25 | Free user tries advanced filter | Lock tooltip appears, filter disabled |
| 26 | Premium user applies cure time filter | Results filtered correctly |
| 27 | Cancel subscription on pricing page | "Canceling on {date}" message shown |
| 28 | Free user visits recipe list | Ad banners visible |
| 29 | Premium user visits recipe list | No ad banners in DOM |

---

## Success Criteria
- [ ] Stripe test checkout completes and subscription status updates in the app
- [ ] Trial banner appears for new users and auto-hides after dismissal
- [ ] Lye calculator produces correct values (validated by unit test)
- [ ] Bookmark toggle works with optimistic UI (instant heart fill/empty)
- [ ] Advanced filters work for premium users, are locked for free users
- [ ] Ad banners appear for free users and are absent for premium users
- [ ] All 29 integration tests pass
- [ ] All 16 frontend unit tests pass

---

## Dependencies
- Milestone 4 complete (backend subscriptions API)
- Milestone 8 complete (full frontend community features connected)
- Stripe test keys configured in `.env`
- AdSense publisher ID obtained and added to `environment.ts`

---

*Estimated effort: 2 days*
