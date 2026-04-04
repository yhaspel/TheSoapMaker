# Milestone 8 — Frontend: Community Features

> **Goal:** Replace stub rating, comment, and user services with real HTTP calls. Users can rate recipes, post and reply to comments, view public profiles, and manage their own profile. The community layer of the app is fully live.

---

## Deliverables

### `core/services/rating.service.ts` — Real implementation
```typescript
submitRating(slug: string, stars: number): Observable<Recipe>
  → POST /api/v1/recipes/{slug}/rate/   body: {stars}

getRatings(slug: string): Observable<Rating[]>
  → GET /api/v1/recipes/{slug}/ratings/
```

### `core/services/comment.service.ts` — Real implementation
```typescript
getComments(slug: string, page?: number): Observable<PaginatedResponse<Comment>>
  → GET /api/v1/recipes/{slug}/comments/?page={page}

postComment(slug: string, body: string, parentId?: string): Observable<Comment>
  → POST /api/v1/recipes/{slug}/comments/   body: {body, parent?}

deleteComment(id: string): Observable<void>
  → DELETE /api/v1/comments/{id}/

flagComment(id: string): Observable<void>
  → POST /api/v1/comments/{id}/flag/
```

### `core/services/user.service.ts` — Real implementation
```typescript
getProfile(): Observable<User>
  → GET /api/v1/auth/user/

updateProfile(data: Partial<User>): Observable<User>
  → PUT /api/v1/auth/user/

getUserRecipes(userId?: string): Observable<Recipe[]>
  → GET /api/v1/recipes/my/  (own recipes)
```

### `comment.store.ts` — New store
```typescript
@Injectable({ providedIn: 'root' })
export class CommentStore {
  private _commentsByRecipe = signal<Record<string, Comment[]>>({});
  private _loadingComments = signal(false);

  getComments(slug: string): Signal<Comment[]>  // computed per-recipe
  setComments(slug: string, comments: Comment[]): void
  addComment(slug: string, comment: Comment): void
  removeComment(slug: string, commentId: string): void
  setLoadingComments(v: boolean): void
}
```

### `rating.store.ts` — New store
```typescript
@Injectable({ providedIn: 'root' })
export class RatingStore {
  private _userRatings = signal<Record<string, number>>({});  // slug → stars
  getUserRating(slug: string): Signal<number | null>
  setUserRating(slug: string, stars: number): void
}
```

### `comment.facade.ts` — Real implementation
```typescript
loadComments(slug: string): void
postComment(slug: string, body: string, parentId?: string): void
deleteComment(slug: string, commentId: string): void
flagComment(commentId: string): void
getComments(slug: string): Signal<Comment[]>
loadingComments: Signal<boolean>
```

### `rating.facade.ts` — Real implementation
```typescript
submitRating(slug: string, stars: number): void
  // optimistic update: update store immediately, then call service
  // on error: revert store and show error toast
getUserRating(slug: string): Signal<number | null>
```

### `user.facade.ts` — Real implementation
```typescript
loadProfile(): void
updateProfile(data): void
loadUserRecipes(): void
userRecipes: Signal<Recipe[]>
```

### `shared/components/star-rating/` — Interactive mode
The `StarRatingComponent` must support two modes driven by an `@Input`:

**Display mode** (`[interactive]="false"`, default):
- Shows filled/half/empty stars based on `averageRating` input
- Read-only, no hover effects

**Interactive mode** (`[interactive]="true"`):
- Hover: stars fill up to the hovered star
- Click: calls `(ratingChange)` EventEmitter with star value
- After submission: star fill switches to show user's own rating + "(your rating)" tooltip
- Disabled if user is not authenticated (shows tooltip "Login to rate")

### `shared/components/comment-thread/` — Connected
- Loads comments on `(slug)` input change via `commentFacade.loadComments(slug)`
- "Reply" button toggles inline reply form per comment
- Reply form has a textarea + "Post reply" button
- Delete button visible only if `comment.userId === currentUser.id` OR user `isStaff`
- Flag button visible to authenticated users; on click calls `commentFacade.flagComment(id)` + shows "Thanks for flagging" toast
- "Load more" button if `hasNextPage` (calls next page, appends to list)

### `features/recipes/recipe-detail/` — Community section added
The recipe detail page already exists (Milestone 7). Now wire up:
- `StarRatingComponent` in interactive mode, bound to `ratingFacade`
- After rating: update `selectedRecipe.averageRating` in store with server response
- `CommentThreadComponent` below the ingredients/steps section

### `features/auth/profile/` — User recipes section
Below the profile edit form, show a section "My Recipes" using the same `RecipeCardComponent` grid, loaded via `userFacade.loadUserRecipes()`.

### Public User Profile Page — New route
New route: `/users/:id` → `UserPublicProfileComponent`

Component displays:
- User's avatar, display name, bio (read-only)
- Their submitted recipes in a grid

This does NOT require a new backend endpoint — reuse `GET /api/v1/recipes/?author_id={id}` if the backend supports it, otherwise use `GET /api/v1/recipes/` with a client-side filter.

> **Note:** Add `author_id` filter to backend `RecipeFilter` if not already present. This is a one-line addition to `apps/recipes/filters.py`.

Add `RecipeCardComponent` link: clicking the author avatar/name navigates to `/users/{authorId}`.

---

## Implementation Steps

### Step 1 — Create `comment.store.ts` and `rating.store.ts`
Add to `core/store/`. Register in `app.config.ts` if not using `providedIn: 'root'`.

### Step 2 — Implement real rating service
Replace mock. Inject into `rating.facade.ts`. Implement optimistic update pattern.

### Step 3 — Implement real comment service
Replace mock. Handle pagination in `comment.store.ts` — `setComments()` replaces, `appendComments()` adds to the end.

### Step 4 — Update `StarRatingComponent`
Add `@Input() interactive = false`, `@Input() userRating: number | null = null`, `@Output() ratingChange = new EventEmitter<number>()`. Implement hover state using a local `hoveredStar = signal(0)`.

### Step 5 — Update `CommentThreadComponent`
Replace mock data with `commentFacade` calls. Add reply toggle state as a local `signal<string | null>` (stores the commentId being replied to).

### Step 6 — Wire recipe detail community section
In `recipe-detail.component.ts`, inject `ratingFacade` and `commentFacade`. On route param change, call both `loadRating(slug)` and `loadComments(slug)`.

### Step 7 — Build public user profile page
Add route to `app.routes.ts`: `{ path: 'users/:id', component: UserPublicProfileComponent }`.

### Step 8 — Add `author_id` filter to backend (if needed)
In `apps/recipes/filters.py`:
```python
class RecipeFilter(FilterSet):
    # ... existing filters ...
    author_id = filters.UUIDFilter(field_name='author__id')
```

---

## Test Plan

### Prerequisites
Backend running with Milestones 2–4 complete. At least 3 recipes with ratings and comments in the DB.

### Unit Tests
Run: `ng test --watch=false`

| # | Test | Expected |
|---|---|---|
| 1 | `StarRatingComponent` display mode — rating 3.5 | Correct stars filled |
| 2 | `StarRatingComponent` interactive mode — hover | Hovered star highlighted |
| 3 | `StarRatingComponent` interactive mode — click | `ratingChange` emits correct value |
| 4 | `rating.facade.submitRating()` — optimistic update | Store updated before HTTP call resolves |
| 5 | `rating.facade.submitRating()` — error reverts | Store reverts to original value on error |
| 6 | `comment.facade.postComment()` — success | Comment added to store |
| 7 | `comment.facade.deleteComment()` — success | Comment removed from store |
| 8 | `CommentStore.getComments()` | Returns only comments for specified slug |

### Integration Tests (backend running)
| # | Action | Expected |
|---|---|---|
| 9 | Open recipe detail as logged-in user | Interactive star rating shown |
| 10 | Click 4 stars | Rating submitted, average rating updates |
| 11 | Click different star count on same recipe | Rating updated (not duplicated) |
| 12 | Open recipe detail as logged-out user | Stars shown in display-only mode, tooltip "Login to rate" |
| 13 | Post a comment | Comment appears at top of thread |
| 14 | Reply to a comment | Reply nested under parent |
| 15 | Delete own comment | Comment removed from thread |
| 16 | Try to delete another user's comment | Delete button not visible |
| 17 | Flag a comment | Success toast "Thanks for flagging" |
| 18 | Load more comments | Next page appended to thread |
| 19 | Click author name on recipe card | Navigated to `/users/{id}` |
| 20 | Public user profile page | User's name, bio, and recipe grid displayed |
| 21 | Profile page shows My Recipes | Current user's recipes visible below edit form |

---

## Success Criteria
- [ ] `ng test --watch=false` — all 8 unit tests pass
- [ ] Rating submission updates recipe's average rating visibly
- [ ] Optimistic rating update feels instant (no spinner delay)
- [ ] Comment thread loads, posts, replies, and deletes work end-to-end
- [ ] Flag action is available and shows feedback toast
- [ ] Public user profile displays correctly
- [ ] `StarRatingComponent` works correctly in both modes

---

## Dependencies
- Milestone 4 complete (backend ratings + comments API)
- Milestone 7 complete (recipe detail page exists, frontend recipes integrated)

---

*Estimated effort: 1.5 days*
