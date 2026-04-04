# Milestone 5 — Frontend: Shell, Routing & Stub Pages

> **Goal:** A fully navigable Angular application where every page and route exists and renders correctly — but all data comes from hardcoded mock/stub data in the facades. No real HTTP calls yet. Every store, facade, component, guard, and pipe is implemented. The app compiles, all routes load, and layout/styles are production-quality. This milestone is the "complete frontend with stubs."

---

## Deliverables

### Core Layer — Models (fully typed)
All interfaces/classes in `core/models/` fully typed per the DB schema:
- `User` — all fields including `isPremium`, `trialStartedAt`, `trialEndsAt`
- `Recipe` — all fields including `ingredients: RecipeIngredient[]`, `steps: Step[]`, `tags: string[]`
- `Ingredient`, `RecipeIngredient`, `Step`, `Tag`
- `Rating`, `Comment` (with `replies?: Comment[]`)
- `Subscription` — `plan`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`

### Core Layer — Stores (fully implemented with signals)
Each store from the plan implemented with all signals and computed values:

**`auth.store.ts`**
- `currentUser: Signal<User | null>`
- `isAuthenticated: Signal<boolean>` (computed)
- `token: Signal<string | null>`

**`recipe.store.ts`**
- `recipes: Signal<Recipe[]>`
- `selectedRecipe: Signal<Recipe | null>`
- `loading: Signal<boolean>`
- `error: Signal<string | null>`
- `searchQuery: Signal<string>`
- `activeTag: Signal<string | null>`
- `filteredRecipes: Signal<Recipe[]>` (computed — filters by searchQuery + activeTag)
- `topRated: Signal<Recipe[]>` (computed — top 6 by averageRating)

**`subscription.store.ts`**
- `plan: Signal<string>`
- `status: Signal<string>`
- `trialActive: Signal<boolean>`
- `trialEndsAt: Signal<Date | null>`
- `isPremium: Signal<boolean>` (computed — active OR trialing)

**`ui.store.ts`**
- `globalLoading: Signal<boolean>`
- `toasts: Signal<Toast[]>` — Toast interface: `{id, message, type: 'success'|'error'|'info', duration}`
- `addToast(message, type)`, `removeToast(id)` methods

### Core Layer — Services (stub implementations returning mock data)
Each service in `core/services/` implements the real interface but returns `of(mockData)` observables instead of real HTTP calls. Mock data must be rich enough to exercise all UI components:

- `auth.service.ts` — `login()`, `register()`, `logout()` return mock user/tokens
- `recipe.service.ts` — `getRecipes()` returns array of 12 mock recipes; `getRecipe(slug)` returns 1
- `ingredient.service.ts` — `getIngredients()` returns 20 mock ingredients
- `rating.service.ts` — `submitRating()` returns updated mock recipe
- `comment.service.ts` — `getComments()` returns 5 mock comments (2 with replies)
- `subscription.service.ts` — `getStatus()` returns trialing mock subscription
- `user.service.ts` — `getProfile()` returns mock user

### Core Layer — Guards
- `auth.guard.ts` — for stubs, simply return `true` (logged in) so all routes are reachable during this milestone
- `premium.guard.ts` — return `true` for stubs

### Core Layer — Interceptors
- `auth.interceptor.ts` — currently no-op (upgraded in Milestone 6)
- `error.interceptor.ts` — catches HTTP errors and calls `UiStore.addToast()` with the error message

### Abstraction Layer — Facades (fully wired to stores + services)
Each facade:
1. Injects the relevant service(s) and store(s)
2. Exposes store signals as public readonly signals
3. Implements all action methods that call the service and update the store

**`auth.facade.ts`**
```typescript
readonly currentUser = this.authStore.currentUser;
readonly isAuthenticated = this.authStore.isAuthenticated;
login(email, password): Observable<void>
logout(): void
register(email, password, displayName): Observable<void>
```

**`recipe.facade.ts`**
```typescript
readonly recipes = this.recipeStore.filteredRecipes;
readonly topRated = this.recipeStore.topRated;
readonly selectedRecipe = this.recipeStore.selectedRecipe;
readonly loading = this.recipeStore.loading;
loadRecipes(filters?): void
loadRecipe(slug: string): void
submitRecipe(data): Observable<Recipe>
updateRecipe(slug, data): Observable<Recipe>
deleteRecipe(slug): Observable<void>
setSearchQuery(q: string): void
setActiveTag(tag: string | null): void
```

**`subscription.facade.ts`**
```typescript
readonly isPremium = this.subscriptionStore.isPremium;
readonly trialActive = this.subscriptionStore.trialActive;
readonly trialEndsAt = this.subscriptionStore.trialEndsAt;
loadStatus(): void
startCheckout(plan: string): Observable<string>  // returns checkout URL
cancel(): Observable<void>
```

**`rating.facade.ts`**, **`comment.facade.ts`**, **`user.facade.ts`** — same pattern.

### Presentation Layer — All Feature Pages (stub content)
Every page exists and renders stub content. No blank/error pages.

**`home/`** — Hero section with app name + tagline, "Browse Recipes" CTA, grid of `topRated` recipes using `RecipeCardComponent`

**`recipes/recipe-list/`** — Search bar, filter sidebar (method, difficulty, tag dropdowns), recipe grid (12 cards), pagination controls

**`recipes/recipe-detail/`** — Recipe header (name, image, badges), ingredient table, steps list, star rating widget, comment thread

**`recipes/recipe-form/`** — 4-step stepper: Basic Info, Ingredients, Steps, Preview. Each step has form fields (no validation yet — that's Milestone 7)

**`recipes/my-recipes/`** — Table/list of user's own recipes with edit/delete buttons

**`auth/login/`** — Email + password fields + "Login" button + social login buttons (Google, Facebook, X)

**`auth/register/`** — Email, password, display name + "7-day free trial" notice

**`auth/profile/`** — Avatar, display name, bio, subscription status card

**`premium/pricing/`** — Two pricing cards (Monthly $4.99 / Annual $39.99 with "Save 33%" badge), feature comparison table

**`premium/trial-banner/`** — Rendered as a fixed bottom bar when `trialActive` is true: "X days left in your trial — Upgrade now"

### Presentation Layer — Shared Components (fully implemented)
All shared components must be pixel-polished in this milestone since they are reused everywhere:

- **`header/`** — Logo, nav links (Home, Recipes, My Recipes, Pricing), user avatar + dropdown (Profile, Logout) or Login/Register buttons if not authenticated
- **`footer/`** — Copyright, links
- **`recipe-card/`** — Image, name, method badge, difficulty badge, star rating display, author avatar + name, cure time
- **`star-rating/`** — Interactive hover states (filled stars on hover), click to set rating, display-only mode showing average
- **`comment-thread/`** — List of comments, reply form toggle, nested replies indented
- **`ad-banner/`** — Renders a placeholder `<div class="ad-placeholder">` if not premium, renders nothing if premium (uses `isPremium` signal)
- **`loading-spinner/`** — Centered spinner, displayed when `UiStore.globalLoading` is true
- **`toast-notification/`** — Fixed bottom-right stack of toast messages that auto-dismiss after their `duration`

### Presentation Layer — Pipes
- **`lye-calculator.pipe.ts`** — Transform: `(oilWeightGrams: number, sapValue: number, superfatPercent: number) => lyeGrams: number` using formula: `lyeGrams = oilWeight * sapValue * (1 - superfatPercent / 100)`
- **`cure-time.pipe.ts`** — Transform: `(days: number) => "X weeks"` or `"X months"` human-readable string

### Routing (`app.routes.ts`)
```typescript
{ path: '', component: HomeComponent },
{ path: 'recipes', loadChildren: () => import('./features/recipes/recipes.routes') },
{ path: 'auth', loadChildren: () => import('./features/auth/auth.routes') },
{ path: 'premium', loadChildren: () => import('./features/premium/premium.routes') },
{ path: '**', redirectTo: '' }
```

All feature route files (`recipes.routes.ts`, `auth.routes.ts`, `premium.routes.ts`) defined with correct paths.

### Styling (SCSS)
- `styles/_variables.scss` — color palette (earthy/natural soap theme: cream, terracotta, sage green), typography scale, spacing scale
- `styles/_mixins.scss` — responsive breakpoints, flex/grid helpers
- `styles/styles.scss` — global reset, base typography, button styles, badge styles, form input styles
- All components use scoped SCSS; no inline styles

---

## Implementation Steps

### Step 1 — Read the frontend skill
```
Read /sessions/.../mnt/.claude/skills/frontend/SKILL.md
```
Follow all skill instructions before writing any Angular code.

### Step 2 — Define all TypeScript models
Create every interface in `core/models/` matching the DB schema exactly. Use camelCase for TypeScript (e.g., `averageRating`, not `average_rating`).

### Step 3 — Implement all signal stores
Implement each store per the `RecipeStore` pattern shown in PROJECT_PLAN §4. Every store must have both private writable signals and public readonly signals.

### Step 4 — Implement stub services
Each service method returns `of(MOCK_DATA).pipe(delay(300))` to simulate network latency and exercise loading states.

Define mock data constants in `core/services/mock-data.ts`.

### Step 5 — Implement facades
Wire each facade to its store and service. Action methods should:
1. Call `uiStore.setGlobalLoading(true)`
2. Call the service method
3. On success: update the store, call `uiStore.addToast('Success', 'success')`
4. On error: call `uiStore.addToast(error.message, 'error')`
5. Finally: call `uiStore.setGlobalLoading(false)`

### Step 6 — Build shared components first
Build `recipe-card`, `star-rating`, `comment-thread`, `ad-banner`, `loading-spinner`, `toast-notification`, `header`, `footer` — all referencing their relevant facade signals. These are dependencies for all feature pages.

### Step 7 — Build all pipes
Implement `lye-calculator.pipe.ts` and `cure-time.pipe.ts` with pure functions. Write unit tests for both.

### Step 8 — Build feature pages
Build each feature page top-to-bottom. Use facade signals directly in templates via `@if`, `@for`, `@switch`.

### Step 9 — Wire up routing
Ensure every route is reachable with no 404s. Add `RouterLink` to header nav.

### Step 10 — SCSS theming
Apply the soap/artisan aesthetic: warm cream background, serif font for headings, terracotta accent color for buttons and badges.

---

## Test Plan

### Unit Tests

#### Pipe Tests (`ng test --watch=false`)
| # | Test | Input | Expected |
|---|---|---|---|
| 1 | `lye-calculator.pipe` — basic | oil=1000g, SAP=0.190, superfat=5% | `180.5g` |
| 2 | `lye-calculator.pipe` — zero superfat | oil=500g, SAP=0.134, superfat=0% | `67.0g` |
| 3 | `cure-time.pipe` — days < 7 | 5 | "5 days" |
| 4 | `cure-time.pipe` — weeks | 28 | "4 weeks" |
| 5 | `cure-time.pipe` — months | 56 | "2 months" |

#### Store Tests
| # | Test | Expected |
|---|---|---|
| 6 | `RecipeStore.filteredRecipes` with searchQuery | Only matching recipes returned |
| 7 | `RecipeStore.topRated` | Returns top 6 by averageRating |
| 8 | `SubscriptionStore.isPremium` — status `active` | `true` |
| 9 | `SubscriptionStore.isPremium` — status `trialing` | `true` |
| 10 | `SubscriptionStore.isPremium` — status `free` | `false` |
| 11 | `UiStore.addToast` then `removeToast` | Toast added then removed from array |

#### Component Tests
| # | Test | Expected |
|---|---|---|
| 12 | `RecipeCardComponent` renders recipe name | Name visible in DOM |
| 13 | `StarRatingComponent` in display mode | Shows correct number of filled stars |
| 14 | `AdBannerComponent` — not premium | Ad placeholder visible |
| 15 | `AdBannerComponent` — premium | Ad placeholder not in DOM |
| 16 | `ToastNotificationComponent` — adds toast | Toast message visible |

### Navigation Tests (manual)
| # | Route | Expected |
|---|---|---|
| 17 | `/` | Home page with hero and recipe grid |
| 18 | `/recipes` | Recipe list with search bar and filter sidebar |
| 19 | `/recipes/lavender-dream` | Recipe detail with ingredients, steps, ratings, comments |
| 20 | `/recipes/new` | Multi-step recipe form, Step 1 visible |
| 21 | `/auth/login` | Login form with social buttons |
| 22 | `/auth/register` | Register form with trial notice |
| 23 | `/auth/profile` | Profile page with mock user data |
| 24 | `/premium/pricing` | Pricing cards visible |
| 25 | Any unknown route | Redirects to `/` |

### Build Test
```bash
ng build --configuration=production
```
Must produce zero errors and zero warnings about missing imports or components.

### Run all unit tests
```bash
ng test --watch=false --code-coverage
```
Target: 80%+ coverage on stores, facades, and pipes.

---

## Success Criteria
- [ ] `ng build --configuration=production` succeeds with zero errors
- [ ] `ng test --watch=false` — all unit tests pass
- [ ] All 25 manual navigation tests pass (no blank screens, no console errors)
- [ ] `AdBannerComponent` correctly shows/hides based on `isPremium` signal
- [ ] `TrialBannerComponent` visible when `trialActive = true`, hidden when false
- [ ] All stores have correct initial state
- [ ] `filteredRecipes` computed signal correctly filters by search query
- [ ] Pipe unit tests pass (lye calculator math is correct)

---

## Dependencies
- Milestone 1 complete (Angular project exists)
- Backend does NOT need to be running (all data is mocked)

---

*Estimated effort: 2–3 days*
