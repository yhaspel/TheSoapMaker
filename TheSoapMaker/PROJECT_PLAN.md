# 🧼 The Soap Maker — Full-Stack Project Plan

> A community-driven web application for homemade soap crafting enthusiasts. Users can discover curated recipes, contribute their own creations, rate and comment on others' work, and access premium features.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend Architecture](#4-frontend-architecture-angular-19)
5. [Backend Architecture](#5-backend-architecture-django)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [Authentication & Social Login](#8-authentication--social-login)
9. [Feature Breakdown](#9-feature-breakdown)
10. [Monetization Strategy](#10-monetization-strategy)
11. [Ad Integration](#11-ad-integration)
12. [Hosting Strategy](#12-hosting-strategy)
13. [Development Roadmap](#13-development-roadmap)
14. [Frontend Folder Structure](#14-frontend-folder-structure)
15. [Backend Folder Structure](#15-backend-folder-structure)

---

## 1. Project Overview

**The Soap Maker** is a full-stack web application that brings together a community of natural soap-making enthusiasts. It serves two audiences simultaneously: beginners who want curated, reliable recipes to follow, and experienced crafters who want to share their formulas and gain recognition. The platform is built to be self-sustaining through ad revenue and a freemium subscription model.

### Core Value Propositions

- A trusted, community-rated library of natural soap recipes
- Social contribution — any user can add and own a recipe
- Transparent ratings and comments so quality floats to the top
- Premium features for power users (ad-free, advanced tools, early access)
- Free 7-day trial on signup to convert users before the paywall kicks in

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Angular 21 (latest stable) | Component-driven SPA with signals state management |
| **State Management** | Angular Signals (single `signal.store.ts`) | Built-in, no external library needed |
| **Styling** | SCSS | Scoped styles, variables, mixins |
| **Backend** | Django 5.x + Django REST Framework | Batteries-included Python framework |
| **Auth** | `django-allauth` + `dj-rest-auth` | Social OAuth + email/password in one package |
| **Database** | PostgreSQL | Relational, well-supported, free tier available on Render/Supabase |
| **Storage** | Cloudinary (free tier) | Recipe images, user avatars |
| **Ads** | Google AdSense | Easiest ad network integration, free to join |
| **Payments** | Stripe | Industry standard, free until you charge |
| **Hosting** | Render (backend) + Vercel (frontend) | Generous free tiers, no cold-start for hobby plans |
| **Testing (FE)** | Karma / Jasmine | Angular default, 90%+ coverage target |
| **Testing (BE)** | pytest-django | Fast, fixture-friendly Django testing |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User's Browser                       │
│              Angular SPA (Vercel CDN)                    │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  Core    │→ │  Abstraction  │→ │   Presentation   │  │
│  │  Layer   │  │  (Facades)    │  │   (Components)   │  │
│  └──────────┘  └───────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────▼────────────────────────────────┐
│              Django REST Framework (Render)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  recipes │  │  users   │  │  ratings │  │  subs  │  │
│  │   app    │  │   app    │  │   app    │  │   app  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
└───────┼─────────────┼─────────────┼─────────────┼───────┘
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼───────┐
│              PostgreSQL (Render / Supabase)              │
└─────────────────────────────────────────────────────────┘
         │                            │
   Cloudinary                      Stripe
  (images/media)               (subscriptions)
```

---

## 4. Frontend Architecture (Angular 19+)

The frontend follows the **3-Layer Architecture** mandated by the project's frontend skill:

### Layer 1 — Core (`src/app/core/`)

Responsible for all data concerns: models, HTTP services, state signals, guards, and interceptors.

```
core/
├── models/
│   ├── user.model.ts
│   ├── recipe.model.ts
│   ├── ingredient.model.ts
│   ├── rating.model.ts
│   ├── comment.model.ts
│   └── subscription.model.ts
├── services/
│   ├── auth.service.ts           # Login, signup, OAuth, token refresh
│   ├── recipe.service.ts         # CRUD for recipes
│   ├── ingredient.service.ts     # Ingredient lookup
│   ├── rating.service.ts         # Submit/retrieve ratings
│   ├── comment.service.ts        # Comments on recipes
│   ├── subscription.service.ts   # Stripe integration, plan status
│   └── user.service.ts           # Profile management
├── store/
│   ├── auth.store.ts             # currentUser, isAuthenticated, token
│   ├── recipe.store.ts           # recipes[], selectedRecipe, filters, loading
│   ├── subscription.store.ts     # plan, trialActive, trialEndsAt
│   └── ui.store.ts               # globalLoading, toasts, modal state
├── guards/
│   ├── auth.guard.ts             # Redirect unauthenticated users
│   └── premium.guard.ts          # Redirect non-premium users
└── interceptors/
    ├── auth.interceptor.ts       # Attach JWT to every request
    └── error.interceptor.ts      # Global HTTP error handling + toast
```

### Layer 2 — Abstraction (`src/app/abstraction/`)

Facade services that bridge core services with the UI. Components never import from `core/services/` directly.

```
abstraction/
├── auth.facade.ts          # login(), logout(), socialLogin(), register()
├── recipe.facade.ts        # loadRecipes(), submitRecipe(), deleteRecipe()
├── rating.facade.ts        # submitRating(), loadRatingsForRecipe()
├── comment.facade.ts       # postComment(), loadComments(), deleteComment()
├── subscription.facade.ts  # startTrial(), subscribe(), cancelSubscription()
└── user.facade.ts          # updateProfile(), loadUserRecipes()
```

### Layer 3 — Presentation (`src/app/features/`)

Lean, reactive components that bind to facade signals and call facade methods.

```
features/
├── home/                         # Landing page, featured recipes, hero CTA
├── recipes/
│   ├── recipe-list/              # Browse + search + filter
│   ├── recipe-detail/            # Full recipe view, ratings, comments
│   ├── recipe-form/              # Create / edit a recipe
│   └── my-recipes/               # User's personal submissions
├── auth/
│   ├── login/                    # Email/password + social login buttons
│   ├── register/                 # Sign up with 7-day trial notice
│   └── profile/                  # User settings, avatar, display name
├── premium/
│   ├── pricing/                  # Plans comparison, Stripe checkout
│   └── trial-banner/             # Floating banner during trial period
└── shared/
    ├── components/
    │   ├── header/               # Nav, user avatar, premium badge
    │   ├── footer/
    │   ├── recipe-card/          # Reusable card for recipe lists
    │   ├── star-rating/          # Interactive rating widget
    │   ├── comment-thread/       # Comment list + form
    │   ├── ad-banner/            # AdSense slot wrapper (hidden for premium)
    │   ├── loading-spinner/
    │   └── toast-notification/
    └── pipes/
        ├── lye-calculator.pipe.ts  # Convert oil weight → NaOH/KOH amount
        └── cure-time.pipe.ts       # Format cure duration
```

### Signal Store Pattern (example: `recipe.store.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class RecipeStore {
  private _recipes = signal<Recipe[]>([]);
  private _selectedRecipe = signal<Recipe | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _searchQuery = signal('');
  private _activeTag = signal<string | null>(null);

  readonly recipes = this._recipes.asReadonly();
  readonly selectedRecipe = this._selectedRecipe.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredRecipes = computed(() => {
    const q = this._searchQuery().toLowerCase();
    const tag = this._activeTag();
    return this._recipes().filter(r =>
      (!q || r.name.toLowerCase().includes(q) || r.tags.some(t => t.includes(q))) &&
      (!tag || r.tags.includes(tag))
    );
  });

  readonly topRated = computed(() =>
    [...this._recipes()].sort((a, b) => b.averageRating - a.averageRating).slice(0, 6)
  );

  setRecipes(recipes: Recipe[]): void { this._recipes.set(recipes); }
  setSelectedRecipe(r: Recipe | null): void { this._selectedRecipe.set(r); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(e: string | null): void { this._error.set(e); }
  setSearchQuery(q: string): void { this._searchQuery.set(q); }
  setActiveTag(tag: string | null): void { this._activeTag.set(tag); }
  addRecipe(r: Recipe): void { this._recipes.update(rs => [r, ...rs]); }
  removeRecipe(id: string): void { this._recipes.update(rs => rs.filter(r => r.id !== id)); }
  updateRecipe(updated: Recipe): void {
    this._recipes.update(rs => rs.map(r => r.id === updated.id ? updated : r));
  }
}
```

---

## 5. Backend Architecture (Django)

### Django Apps

| App | Responsibility |
|---|---|
| `users` | Custom user model, profile, social auth config |
| `recipes` | Recipe CRUD, ingredient linking, media upload |
| `ratings` | Star ratings (1–5) per recipe per user |
| `comments` | Threaded comments on recipes |
| `subscriptions` | Stripe webhook handling, plan tracking, trial logic |

### Key Libraries

```
djangorestframework        # RESTful API
django-allauth             # Email + Google + Facebook + X OAuth
dj-rest-auth               # REST endpoints for allauth
djangorestframework-simplejwt  # JWT tokens
django-cors-headers        # Allow Angular dev/prod origins
cloudinary + django-cloudinary-storage  # Image uploads
stripe                     # Payment processing
django-filter              # Filtering querysets via query params
drf-spectacular            # Auto-generate OpenAPI docs (Swagger UI)
```

### Permissions Model

- **Unauthenticated**: Browse recipes, view ratings/comments (read-only)
- **Authenticated (Free)**: All of above + submit recipes, rate, comment (ads shown)
- **Authenticated (Premium)**: All of above + ad-free, lye calculator, advanced filters, bookmarks
- **Admin**: Full access, moderate recipes/comments

---

## 6. Database Schema

### `users_user` (extends AbstractUser)

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, used as username |
| display_name | VARCHAR(100) | Public name |
| avatar_url | VARCHAR(500) | Cloudinary URL |
| bio | TEXT | Optional short bio |
| created_at | TIMESTAMP | |
| is_premium | BOOLEAN | Derived from active subscription |
| trial_started_at | TIMESTAMP | Set on first login/signup |
| trial_ends_at | TIMESTAMP | `trial_started_at + 7 days` |

### `recipes_recipe`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| author | FK → users_user | |
| name | VARCHAR(200) | |
| slug | VARCHAR(220) | Auto-generated, URL-friendly |
| description | TEXT | |
| method | ENUM | `cold_process`, `hot_process`, `melt_and_pour`, `liquid` |
| difficulty | ENUM | `beginner`, `intermediate`, `advanced` |
| cure_time_days | INTEGER | How long before soap is ready |
| batch_size_grams | INTEGER | Total oil weight |
| yield_bars | INTEGER | Approximate number of bars |
| image_url | VARCHAR(500) | Cloudinary |
| is_published | BOOLEAN | Draft/published toggle |
| tags | M2M → recipes_tag | |
| average_rating | FLOAT | Denormalized, updated on save |
| rating_count | INTEGER | Denormalized |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `recipes_ingredient`

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| name | VARCHAR(150) | e.g., "Coconut Oil", "Sodium Hydroxide" |
| category | ENUM | `oil`, `lye`, `liquid`, `additive`, `fragrance`, `colorant` |
| saponification_value | FLOAT | For lye calculation (NaOH SAP value) |
| description | TEXT | Skin benefit notes |

### `recipes_recipeingredient` (through table)

| Column | Type | Notes |
|---|---|---|
| recipe | FK → recipes_recipe | |
| ingredient | FK → recipes_ingredient | |
| amount_grams | FLOAT | |
| percentage | FLOAT | % of total oil weight |
| notes | VARCHAR(300) | "superfat", "at trace", etc. |

### `recipes_step`

| Column | Type | Notes |
|---|---|---|
| recipe | FK → recipes_recipe | |
| order | INTEGER | Sequence of steps |
| instruction | TEXT | Step description |
| image_url | VARCHAR(500) | Optional step illustration |

### `ratings_rating`

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| user | FK → users_user | |
| recipe | FK → recipes_recipe | |
| stars | SMALLINT | 1–5 |
| created_at | TIMESTAMP | |
| **Unique together** | (user, recipe) | One rating per user per recipe |

### `comments_comment`

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| user | FK → users_user | |
| recipe | FK → recipes_recipe | |
| parent | FK → self, nullable | For threaded replies |
| body | TEXT | |
| is_flagged | BOOLEAN | Moderation flag |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `subscriptions_subscription`

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| user | FK → users_user | One-to-one |
| stripe_customer_id | VARCHAR(100) | |
| stripe_subscription_id | VARCHAR(100) | |
| plan | ENUM | `free`, `premium_monthly`, `premium_annual` |
| status | ENUM | `active`, `canceled`, `past_due`, `trialing` |
| current_period_end | TIMESTAMP | Next billing date |
| cancel_at_period_end | BOOLEAN | |

---

## 7. API Design

Base URL: `/api/v1/`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/registration/` | Public | Email/password signup |
| POST | `/auth/login/` | Public | Email/password login → JWT |
| POST | `/auth/logout/` | Required | Invalidate token |
| POST | `/auth/token/refresh/` | Public | Refresh JWT |
| GET/PUT | `/auth/user/` | Required | Get/update own profile |
| GET | `/auth/google/` | Public | Redirect to Google OAuth |
| GET | `/auth/facebook/` | Public | Redirect to Facebook OAuth |
| GET | `/auth/twitter/` | Public | Redirect to X OAuth |

### Recipes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/recipes/` | Public | List recipes (paginated, filterable) |
| POST | `/recipes/` | Required | Create a new recipe |
| GET | `/recipes/{slug}/` | Public | Recipe detail |
| PUT/PATCH | `/recipes/{slug}/` | Author only | Edit recipe |
| DELETE | `/recipes/{slug}/` | Author only | Delete recipe |
| GET | `/recipes/top-rated/` | Public | Top 6 by average rating |
| GET | `/recipes/my/` | Required | Current user's recipes |
| GET | `/recipes/{slug}/ingredients/` | Public | Ingredients for a recipe |

**Query params for `/recipes/`:**
- `?search=lavender` — full-text search on name, description, tags
- `?method=cold_process` — filter by method
- `?difficulty=beginner` — filter by difficulty
- `?tag=floral` — filter by tag
- `?ordering=-average_rating` — sort options
- `?page=2&page_size=12` — pagination

### Ratings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/recipes/{slug}/rate/` | Required | Submit or update a rating |
| GET | `/recipes/{slug}/ratings/` | Public | List ratings for a recipe |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/recipes/{slug}/comments/` | Public | List comments (threaded) |
| POST | `/recipes/{slug}/comments/` | Required | Post a comment |
| DELETE | `/comments/{id}/` | Author/Admin | Delete a comment |
| POST | `/comments/{id}/flag/` | Required | Flag for moderation |

### Ingredients

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ingredients/` | Public | List all ingredients |
| GET | `/ingredients/{id}/` | Public | Ingredient detail + SAP value |

### Subscriptions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions/status/` | Required | Current plan + trial info |
| POST | `/subscriptions/create-checkout/` | Required | Create Stripe checkout session |
| POST | `/subscriptions/cancel/` | Required | Cancel at period end |
| POST | `/subscriptions/webhook/` | Stripe sig | Handle Stripe events |

---

## 8. Authentication & Social Login

### Flow: Email/Password

1. User submits registration form → `POST /auth/registration/`
2. Django creates user, sets `trial_started_at = now()`, `trial_ends_at = now() + 7 days`
3. Returns JWT access + refresh tokens
4. Angular stores tokens in memory (access) and `localStorage` (refresh)
5. `auth.interceptor.ts` attaches `Authorization: Bearer <token>` to every request

### Flow: Google / Facebook / X OAuth

1. User clicks social button → Angular calls `GET /auth/{provider}/`
2. Django redirects to provider's OAuth consent screen
3. Provider redirects back to `/auth/{provider}/callback/` with authorization code
4. `django-allauth` exchanges code for user info, creates or links account
5. Returns same JWT pair as email login
6. Angular handles the callback route and stores tokens

### JWT Strategy

- Access token: short-lived (15 minutes)
- Refresh token: long-lived (7 days)
- `error.interceptor.ts` catches `401` → auto-refreshes via `POST /auth/token/refresh/` → retries original request
- On refresh failure: logout user, redirect to `/auth/login`

---

## 9. Feature Breakdown

### 9.1 Recipe Browser

- Paginated grid of `RecipeCard` components showing: image, name, method badge, difficulty badge, average star rating, author avatar + name
- Search bar with debounced signal updates (300ms) filtering `filteredRecipes` computed signal
- Filter sidebar: method, difficulty, tags, cure time range
- Sort by: newest, top rated, most commented
- Recipe detail page with full ingredient table, step-by-step instructions, lye calculator (premium), rating widget, comment thread

### 9.2 Recipe Submission

- Multi-step form (stepper): Basic Info → Ingredients → Steps → Preview
- Ingredient autocomplete with ingredient database lookup
- Drag-and-drop reorder for steps
- Image upload with Cloudinary direct upload (presigned URL from backend)
- Draft save (auto-save every 30 seconds using signal effect)

### 9.3 Ratings & Comments

- Star rating widget: interactive hover states, one submission per user per recipe
- After rating: widget shows user's own rating + community average
- Comments: flat list with one level of replies (reply-to), avatar, timestamp, flag button
- Pagination on comments (load more)

### 9.4 User Profile

- Public profile page: display name, bio, avatar, list of submitted recipes with their average ratings
- Settings page: edit display name, bio, avatar upload, change password, link/unlink social accounts, manage subscription

### 9.5 Lye Calculator (Premium)

Built directly into recipe detail and recipe form for premium users:

- Input: oil weights in grams
- Output: NaOH or KOH amount (based on each oil's saponification value from `ingredients` table)
- Superfat % slider (0–10%)
- Water-to-lye ratio selector
- Results shown inline with copy-to-clipboard button

### 9.6 Recipe Bookmarks (Premium)

- Heart/bookmark icon on each recipe card
- Saved recipes page under user profile
- Signals-driven: toggling updates store immediately (optimistic UI)

---

## 10. Monetization Strategy

### Plans

| Feature | Free | Premium ($4.99/mo or $39.99/yr) |
|---|---|---|
| Browse all recipes | ✅ | ✅ |
| Submit recipes | ✅ | ✅ |
| Rate & comment | ✅ | ✅ |
| Google Ads shown | ✅ | ❌ |
| Lye calculator | ❌ | ✅ |
| Recipe bookmarks | ❌ | ✅ |
| Advanced filters | ❌ | ✅ |
| Early access to new features | ❌ | ✅ |

### 7-Day Free Trial

- Triggered automatically on account creation (no credit card required)
- Trial gives full premium access for 7 days
- A dismissable `TrialBannerComponent` persists across pages showing days remaining
- On day 7: modal prompts to subscribe or downgrade to free
- Backend: `trial_ends_at` field on user; `subscription.status = 'trialing'` if within window

### Stripe Integration

- Checkout: `POST /subscriptions/create-checkout/` returns a Stripe Checkout session URL → Angular redirects
- Webhooks: `POST /subscriptions/webhook/` handles `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted`
- Portal: Stripe Customer Portal for self-serve cancellation and plan changes
- Annual plan shows "Save 33%" badge to drive higher LTV

---

## 11. Ad Integration

### Google AdSense Placement

Ads are rendered only for **free-tier** users. The `AdBannerComponent` checks the subscription signal before rendering the AdSense slot.

```typescript
// shared/components/ad-banner/ad-banner.component.ts
@Component({ ... })
export class AdBannerComponent {
  private subFacade = inject(SubscriptionFacade);
  readonly isPremium = this.subFacade.isPremium;
}
```

```html
<!-- ad-banner.component.html -->
@if (!isPremium()) {
  <div class="ad-slot">
    <ins class="adsbygoogle" ...></ins>
  </div>
}
```

**Placement strategy:**
- Leaderboard (728×90) below the site header on recipe list
- Rectangle (300×250) in the right sidebar on recipe detail
- In-feed native ad between every 6th recipe card in the grid
- No ads on auth pages, checkout pages, or any admin views

---

## 12. Hosting Strategy

### Frontend — Vercel (Free)

- Connect GitHub repo, auto-deploy on push to `main`
- Environment variables for API base URL, AdSense publisher ID
- Custom domain supported on free plan

### Backend — Render (Free → Starter $7/mo)

- Web service running Django + Gunicorn
- Free tier has spin-down on inactivity (acceptable for early stage)
- PostgreSQL: Render managed Postgres free tier (90-day retention on free, upgrade to $7/mo for persistent)
- Environment variables for `SECRET_KEY`, `DATABASE_URL`, `STRIPE_*`, `CLOUDINARY_*`, `ALLOWED_HOSTS`

### Alternative: Supabase (Database) + Railway (Backend)

- Supabase free tier: 500MB PostgreSQL, never expires
- Railway free tier: $5 credit/month, sufficient for low-traffic backend

### Media — Cloudinary (Free)

- 25GB storage + 25GB bandwidth/month on free tier
- Direct upload from browser to Cloudinary with backend-generated upload preset

### Summary of Monthly Costs at Launch

| Service | Free Tier | Paid Tier |
|---|---|---|
| Vercel (frontend) | $0 | $20/mo (Pro) |
| Render (backend) | $0 (spin-down) | $7/mo (always-on) |
| Render PostgreSQL | $0 (90-day) | $7/mo |
| Cloudinary | $0 | $89/mo (beyond free) |
| **Total at launch** | **$0** | **~$14–34/mo when scaling** |

---

## 13. Development Roadmap

### Phase 1 — Foundation (Weeks 1–3)

- [ ] Scaffold Angular project with 3-layer architecture
- [ ] Set up Django project with all apps and DRF
- [ ] Configure PostgreSQL and run initial migrations
- [ ] Implement JWT authentication (email/password)
- [ ] Basic recipe CRUD (backend + frontend)
- [ ] Angular routing with lazy-loaded feature modules
- [ ] Header, footer, shared layout shell

### Phase 2 — Core Features (Weeks 4–6)

- [ ] Social OAuth (Google, Facebook, X via django-allauth)
- [ ] Recipe list with search, filter, sort
- [ ] Recipe detail page
- [ ] Multi-step recipe submission form
- [ ] Cloudinary image upload integration
- [ ] Ingredient database + autocomplete

### Phase 3 — Community Features (Weeks 7–8)

- [ ] Star rating system (submit + display average)
- [ ] Comment thread (post, reply, delete, flag)
- [ ] User profile pages (public view)
- [ ] My Recipes page
- [ ] Toast notifications for actions

### Phase 4 — Monetization (Weeks 9–10)

- [ ] Stripe subscription plans (monthly + annual)
- [ ] 7-day free trial logic (backend + trial banner)
- [ ] Premium guard for locked features
- [ ] Google AdSense integration (conditional on free tier)
- [ ] Pricing page with plan comparison
- [ ] Stripe webhook handler

### Phase 5 — Premium Features (Weeks 11–12)

- [ ] Lye calculator (using ingredient SAP values)
- [ ] Recipe bookmarks
- [ ] Advanced filters (cure time range, yield, batch size)
- [ ] Ad-free experience for premium users

### Phase 6 — Polish & Launch (Weeks 13–14)

- [ ] Unit tests (90%+ coverage frontend, 85%+ backend)
- [ ] OpenAPI docs via drf-spectacular
- [ ] SEO meta tags (recipe name, description, image as OG tags)
- [ ] Performance audit (Lighthouse ≥ 90)
- [ ] Vercel + Render production deploy
- [ ] Custom domain setup
- [ ] Analytics (Google Analytics 4 via gtag)

---

## 14. Frontend Folder Structure

```
soapmaker-frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── recipe.model.ts
│   │   │   │   ├── ingredient.model.ts
│   │   │   │   ├── rating.model.ts
│   │   │   │   ├── comment.model.ts
│   │   │   │   └── subscription.model.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── recipe.service.ts
│   │   │   │   ├── ingredient.service.ts
│   │   │   │   ├── rating.service.ts
│   │   │   │   ├── comment.service.ts
│   │   │   │   ├── subscription.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── store/
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── recipe.store.ts
│   │   │   │   ├── subscription.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── premium.guard.ts
│   │   │   └── interceptors/
│   │   │       ├── auth.interceptor.ts
│   │   │       └── error.interceptor.ts
│   │   ├── abstraction/
│   │   │   ├── auth.facade.ts
│   │   │   ├── recipe.facade.ts
│   │   │   ├── rating.facade.ts
│   │   │   ├── comment.facade.ts
│   │   │   ├── subscription.facade.ts
│   │   │   └── user.facade.ts
│   │   ├── features/
│   │   │   ├── home/
│   │   │   ├── recipes/
│   │   │   │   ├── recipe-list/
│   │   │   │   ├── recipe-detail/
│   │   │   │   ├── recipe-form/
│   │   │   │   ├── my-recipes/
│   │   │   │   └── recipes.routes.ts
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── profile/
│   │   │   │   └── auth.routes.ts
│   │   │   └── premium/
│   │   │       ├── pricing/
│   │   │       ├── trial-banner/
│   │   │       └── premium.routes.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── footer/
│   │   │   │   ├── recipe-card/
│   │   │   │   ├── star-rating/
│   │   │   │   ├── comment-thread/
│   │   │   │   ├── ad-banner/
│   │   │   │   ├── loading-spinner/
│   │   │   │   └── toast-notification/
│   │   │   └── pipes/
│   │   │       ├── lye-calculator.pipe.ts
│   │   │       └── cure-time.pipe.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── styles.scss
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 15. Backend Folder Structure

```
soapmaker-backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   │   ├── models.py          # CustomUser
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── adapters.py        # allauth social adapter
│   │   └── tests/
│   ├── recipes/
│   │   ├── models.py          # Recipe, Ingredient, RecipeIngredient, Step, Tag
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── filters.py         # django-filter FilterSet
│   │   ├── urls.py
│   │   ├── signals.py         # Update average_rating on Rating save
│   │   └── tests/
│   ├── ratings/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests/
│   ├── comments/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests/
│   └── subscriptions/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py           # Stripe checkout + webhook handler
│       ├── stripe_service.py  # Stripe API calls isolated here
│       └── tests/
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── manage.py
├── Procfile                   # web: gunicorn config.wsgi
└── .env.example
```

---

*Document version 1.0 — April 2026*
*Stack: Angular 21 · Django 5 · PostgreSQL · Stripe · AdSense · Render · Vercel*
