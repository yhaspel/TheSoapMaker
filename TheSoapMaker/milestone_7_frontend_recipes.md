# Milestone 7 — Frontend: Recipes Integration

> **Goal:** Replace stub recipe/ingredient services with real HTTP calls. The complete recipe browsing and submission workflow is live end-to-end: list with search/filter/sort, recipe detail, multi-step create/edit form with Cloudinary image upload, ingredient autocomplete, and My Recipes management.

---

## Deliverables

### `core/services/recipe.service.ts` — Real implementation
```typescript
getRecipes(filters?: RecipeFilters): Observable<PaginatedResponse<Recipe>>
  → GET /api/v1/recipes/?search=&method=&difficulty=&tag=&ordering=&page=

getRecipe(slug: string): Observable<Recipe>
  → GET /api/v1/recipes/{slug}/

getTopRated(): Observable<Recipe[]>
  → GET /api/v1/recipes/top-rated/

getMyRecipes(): Observable<Recipe[]>
  → GET /api/v1/recipes/my/

createRecipe(data: RecipePayload): Observable<Recipe>
  → POST /api/v1/recipes/

updateRecipe(slug: string, data: RecipePayload): Observable<Recipe>
  → PUT /api/v1/recipes/{slug}/

deleteRecipe(slug: string): Observable<void>
  → DELETE /api/v1/recipes/{slug}/

getUploadUrl(): Observable<CloudinaryUploadConfig>
  → POST /api/v1/recipes/upload-url/
```

`RecipeFilters` interface: `{ search?, method?, difficulty?, tag?, ordering?, page?, pageSize? }`
`PaginatedResponse<T>` interface: `{ count: number, next: string|null, previous: string|null, results: T[] }`
`CloudinaryUploadConfig` interface: `{ uploadUrl, apiKey, timestamp, signature, cloudName }`

### `core/services/ingredient.service.ts` — Real implementation
```typescript
getIngredients(search?: string): Observable<Ingredient[]>
  → GET /api/v1/ingredients/?search={search}

getIngredient(id: string): Observable<Ingredient>
  → GET /api/v1/ingredients/{id}/
```

### `recipe.store.ts` additions
- `currentPage: Signal<number>`
- `totalCount: Signal<number>`
- `hasNextPage: Signal<boolean>` (computed)
- `hasPrevPage: Signal<boolean>` (computed)
- `activeFilters: Signal<RecipeFilters>` — method, difficulty, tag, ordering
- `activeMethod: Signal<string | null>`
- `activeDifficulty: Signal<string | null>`
- `activeOrdering: Signal<string>` (default: `-created_at`)

### `recipe.facade.ts` additions
```typescript
loadRecipes(filters?: RecipeFilters): void  // updates store, handles loading/error
loadNextPage(): void
loadPrevPage(): void
setMethod(method: string | null): void
setDifficulty(difficulty: string | null): void
setOrdering(ordering: string): void
uploadImage(file: File): Observable<string>  // returns Cloudinary image URL
```

`uploadImage()` implementation:
1. Call `recipe.service.getUploadUrl()` to get signed Cloudinary params
2. Construct `FormData` with `file`, `api_key`, `timestamp`, `signature`
3. `POST` directly to Cloudinary upload URL (not through backend)
4. Return the `secure_url` from Cloudinary response

### `features/recipes/recipe-list/` — Fully connected
- On component init: call `recipeFacade.loadRecipes()`
- Search bar: debounce 300ms, call `recipeFacade.setSearchQuery(q)` which triggers a new `loadRecipes()` call
- Filter sidebar dropdowns: call `recipeFacade.setMethod()`, `setDifficulty()`, `setActiveTag()` which each trigger `loadRecipes()`
- Sort dropdown: `recipeFacade.setOrdering()`
- Pagination: "Previous" / "Next" buttons bound to `hasPrevPage`/`hasNextPage`, call `loadPrevPage()`/`loadNextPage()`
- Loading state: overlay spinner while `loading()` is true
- Empty state: "No recipes found. Be the first to contribute!" with CTA if 0 results

### `features/recipes/recipe-detail/` — Fully connected
- On init: call `recipeFacade.loadRecipe(slug)` (slug from `ActivatedRoute.params`)
- Displays: image, name, author, method/difficulty badges, cure time (via pipe), ingredient table, ordered steps
- `LyeCalculatorComponent` (inline, premium-only): reads SAP values from `selectedRecipe.ingredients`, premium guard applied to its visibility via `*ngIf="isPremium()"`
- Error state: "Recipe not found" if 404

### `features/recipes/recipe-form/` — Fully connected, 4-step stepper
**Step 1 — Basic Info:**
- Fields: `name`, `description`, `method` (select), `difficulty` (select), `cureTimeDays`, `batchSizeGrams`, `yieldBars`, `tags` (comma-separated input)
- `isPublished` toggle
- Validation: `name` required (min 3 chars), `description` required (min 20 chars)

**Step 2 — Ingredients:**
- Autocomplete search input: debounce 200ms, call `ingredientService.getIngredients(search)`, show dropdown results
- "Add" button: appends `{ingredientId, name, amountGrams, percentage, notes}` to a local array
- Reorder (drag handles — use CSS cursor only, no drag-drop library)
- Remove ingredient row button
- Validation: at least 1 ingredient required

**Step 3 — Steps:**
- Dynamic list of step rows: `order` (auto), `instruction` (textarea), optional image upload per step
- "Add step" button appends new row
- Remove step button
- Validation: at least 1 step required

**Step 4 — Preview + Image:**
- Shows a read-only summary of all entered data
- Image upload: `<input type="file" accept="image/*">`, on change call `recipeFacade.uploadImage(file)`, show preview
- "Submit" button: calls `recipeFacade.submitRecipe(payload)` or `recipeFacade.updateRecipe(slug, payload)` if editing
- On success: navigate to `/recipes/{slug}` and show success toast

**Auto-save:** Every 30 seconds, if form is dirty, save draft to `localStorage` under `sm_recipe_draft`. On form load, if draft exists, prompt "Resume your draft?"

**Edit mode:** When route is `/recipes/:slug/edit`, pre-populate form fields from `selectedRecipe`

### `features/recipes/my-recipes/` — Fully connected
- On init: call `recipeFacade.loadMyRecipes()`
- Table with columns: Image, Name, Method, Status (Published/Draft), Avg Rating, Actions
- "Edit" link → `/recipes/{slug}/edit`
- "Delete" button → confirm dialog (native `confirm()`) → call `recipeFacade.deleteRecipe(slug)` → remove from list optimistically

---

## Implementation Steps

### Step 1 — Define TypeScript interfaces
Create `RecipeFilters`, `PaginatedResponse<T>`, `RecipePayload`, `CloudinaryUploadConfig` in the appropriate model files.

### Step 2 — Implement real recipe service
Replace all `of(mock)` with `HttpClient` calls. Map snake_case API responses to camelCase model interfaces using an RxJS `map()` or a serialization utility function `toCamelCase()`.

### Step 3 — Implement ingredient service
Same pattern as recipe service. Ingredient autocomplete will use this.

### Step 4 — Extend recipe store and facade
Add pagination signals to the store. Add `loadNextPage`, `loadPrevPage`, filter setters to the facade. Each filter setter should reset `currentPage` to 1 before calling `loadRecipes()`.

### Step 5 — Update recipe list page
Wire search debounce using `toObservable(searchQuery).pipe(debounceTime(300), distinctUntilChanged())` converted back to a signal effect.

### Step 6 — Update recipe detail page
Add route param subscription. Handle 404 case.

### Step 7 — Build the multi-step recipe form
Use a local `currentStep = signal(1)` for stepper state. Use Angular `ReactiveFormsModule` (`FormGroup`, `FormArray` for ingredients and steps). Validate each step before allowing "Next".

### Step 8 — Implement Cloudinary direct upload
In `recipeFacade.uploadImage()`:
```typescript
uploadImage(file: File): Observable<string> {
  return this.recipeService.getUploadUrl().pipe(
    switchMap(config => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', config.apiKey);
      fd.append('timestamp', config.timestamp);
      fd.append('signature', config.signature);
      return this.http.post<{secure_url: string}>(config.uploadUrl, fd);
    }),
    map(res => res.secure_url)
  );
}
```

### Step 9 — Auto-save draft
Use `effect()` in the recipe form component to watch form value changes and debounce writes to `localStorage`.

### Step 10 — Connect My Recipes page
Straightforward — load, display, wire delete with optimistic removal from store.

---

## Test Plan

### Prerequisites
Backend running with Milestones 2 + 3 complete. Seed data loaded (`python manage.py seed_ingredients`). At least 5 seeded recipes (create via Django admin or fixture).

### Unit Tests
Run: `ng test --watch=false`

| # | Test | Expected |
|---|---|---|
| 1 | `recipe.service.getRecipes()` | Correct URL with query params passed |
| 2 | `recipe.service.createRecipe()` | `POST /api/v1/recipes/` called with payload |
| 3 | `recipe.facade.setSearchQuery()` | Triggers new `loadRecipes()` call with search param |
| 4 | `recipe.facade.loadNextPage()` | Increments page, calls `loadRecipes()` |
| 5 | Recipe form Step 1 validation | Cannot advance to Step 2 without name + description |
| 6 | Recipe form Step 2 validation | Cannot advance to Step 3 without at least 1 ingredient |

### Integration Tests (backend running)
| # | Action | Expected |
|---|---|---|
| 7 | Open `/recipes` | 12 recipes loaded from backend, grid displays |
| 8 | Type "lavender" in search | Grid updates to matching recipes |
| 9 | Select Method = "Cold Process" | Grid filtered by method |
| 10 | Click "Next" page | Next page of results loads |
| 11 | Click a recipe card | Navigates to detail page with correct data |
| 12 | Ingredients table on detail | All recipe ingredients listed with amounts |
| 13 | Steps section on detail | All steps listed in correct order |
| 14 | Create new recipe (all 4 steps) | Recipe created, navigated to detail page |
| 15 | Upload image in recipe form | Preview shown, Cloudinary URL saved with recipe |
| 16 | Edit existing recipe | Form pre-populated, changes saved |
| 17 | Delete recipe from My Recipes | Removed from list, success toast shown |
| 18 | Navigate to My Recipes | Only current user's recipes shown |
| 19 | Draft auto-save | After 30s of inactivity, localStorage has draft |
| 20 | Resume draft on page reload | "Resume your draft?" prompt appears |

---

## Success Criteria
- [ ] `ng test --watch=false` — all recipe unit tests pass
- [ ] Recipe list loads real data from backend
- [ ] Search and filter update results correctly
- [ ] Full recipe creation flow (all 4 steps) completes successfully
- [ ] Cloudinary image upload works (image visible in recipe detail)
- [ ] Editing a recipe pre-populates form correctly
- [ ] Delete from My Recipes removes the recipe
- [ ] Auto-save draft persists to localStorage

---

## Dependencies
- Milestone 3 complete (backend recipes API)
- Milestone 6 complete (frontend auth, interceptors with JWT)

---

*Estimated effort: 2 days*
