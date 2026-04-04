# Milestone 6 — Frontend: Auth Integration

> **Goal:** Replace auth stub services with real HTTP calls to the Django backend. Users can register, log in (email/password + social OAuth), stay logged in across page refreshes, and be redirected by guards. The `AuthInterceptor` attaches JWT tokens and the `ErrorInterceptor` auto-refreshes on 401.

---

## Deliverables

### `core/services/auth.service.ts` — Real implementation
Replace mock `of()` returns with real `HttpClient` calls:
```typescript
register(email, password, displayName): Observable<AuthResponse>
  → POST /api/v1/auth/registration/

login(email, password): Observable<AuthResponse>
  → POST /api/v1/auth/login/

logout(): Observable<void>
  → POST /api/v1/auth/logout/

refreshToken(refreshToken: string): Observable<{access: string}>
  → POST /api/v1/auth/token/refresh/

getProfile(): Observable<User>
  → GET /api/v1/auth/user/

updateProfile(data): Observable<User>
  → PUT /api/v1/auth/user/
```

`AuthResponse` interface: `{ access: string, refresh: string, user: User }`

### Token Storage Strategy
- `access` token: stored in `AuthStore` memory signal only (never persisted — cleared on page refresh)
- `refresh` token: stored in `localStorage` under key `sm_refresh`
- On app init (`AppComponent.ngOnInit`): if `localStorage` has a refresh token, call `auth.service.refreshToken()` → if success, populate `AuthStore` with new access token + fetched user profile; if fail, clear localStorage and stay logged out

### `core/interceptors/auth.interceptor.ts` — Functional interceptor
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### `core/interceptors/error.interceptor.ts` — Auto-refresh on 401
```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/token/refresh')) {
        // attempt token refresh, then retry original request
        // on second 401: logout user + redirect to /auth/login
      }
      // for other errors: inject UiStore, call addToast with error message
      return throwError(() => error);
    })
  );
};
```

### `core/guards/auth.guard.ts` — Real implementation
```typescript
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};
```

### `core/guards/premium.guard.ts` — Real implementation
```typescript
export const premiumGuard: CanActivateFn = () => {
  const subFacade = inject(SubscriptionFacade);
  const router = inject(Router);
  if (subFacade.isPremium()) return true;
  return router.createUrlTree(['/premium/pricing']);
};
```

### `features/auth/login/` — Connected to real backend
- On submit: call `authFacade.login(email, password)`
- Show loading spinner while request is in-flight (use `globalLoading` signal)
- On success: navigate to `/`
- On error: display backend error message (e.g., "Invalid credentials") inline under form
- Google/Facebook/X buttons: navigate to `environment.apiUrl + '/auth/{provider}/'`

### `features/auth/register/` — Connected to real backend
- On submit: call `authFacade.register(email, password, displayName)`
- Show "7-day free trial" notice prominently
- On success: navigate to `/`, `TrialBannerComponent` should appear (trial is active)
- On error: display inline field-level validation errors from backend

### `features/auth/profile/` — Connected to real backend
- On load: call `userFacade.loadProfile()`
- Editable fields: `displayName`, `bio`, `avatarUrl`
- On save: call `userFacade.updateProfile(data)`, show success toast

### Header — Auth-aware
- Shows Login/Register buttons when `isAuthenticated = false`
- Shows user avatar + display name + dropdown when `isAuthenticated = true`
- Logout button calls `authFacade.logout()` → clears store + localStorage → navigates to `/`

### Route Guards Applied
Add guards to lazy-loaded route configs:
```typescript
// recipes.routes.ts
{ path: 'new', component: RecipeFormComponent, canActivate: [authGuard] },
{ path: ':slug/edit', component: RecipeFormComponent, canActivate: [authGuard] },
{ path: 'my', component: MyRecipesComponent, canActivate: [authGuard] },

// auth.routes.ts
{ path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
```

---

## Implementation Steps

### Step 1 — Implement real auth service
Remove all `of(mock)` from `auth.service.ts`. Use `HttpClient` injection. On `login()` success, call `AuthStore.setCurrentUser()` and `AuthStore.setToken()`. On `logout()`, clear store and clear localStorage.

### Step 2 — Token persistence on boot
In `AppComponent`:
```typescript
ngOnInit() {
  const refresh = localStorage.getItem('sm_refresh');
  if (refresh) {
    this.authService.refreshToken(refresh).pipe(
      switchMap(({ access }) => {
        this.authStore.setToken(access);
        return this.authService.getProfile();
      })
    ).subscribe({
      next: (user) => this.authStore.setCurrentUser(user),
      error: () => localStorage.removeItem('sm_refresh'),
    });
  }
}
```

### Step 3 — Implement interceptors
Replace no-op interceptors with real implementations. For error interceptor, handle the 401 → refresh → retry cycle using `BehaviorSubject` to prevent multiple simultaneous refresh calls.

### Step 4 — Implement real guards
Replace `return true` stubs in both guards with real signal checks + router redirects.

### Step 5 — Connect login/register/profile pages
Wire `(submit)` events to facade calls. Add `[disabled]="loading()"` to submit buttons. Show API error messages.

### Step 6 — Apply guards to routes
Add `canActivate: [authGuard]` to protected routes and `canActivate: [premiumGuard]` to premium routes.

---

## Test Plan

### Prerequisites
Backend must be running at `http://localhost:8000` with Milestone 2 complete.

### Unit Tests (no backend required — use `HttpTestingController`)
Run: `ng test --watch=false`

| # | Test | Expected |
|---|---|---|
| 1 | `auth.service.login()` — success | Calls `POST /auth/login/`, returns tokens |
| 2 | `auth.service.login()` — failure | Observable errors with HTTP 400 |
| 3 | `auth.service.refreshToken()` — success | Calls `POST /auth/token/refresh/` |
| 4 | `auth.interceptor` — with token | `Authorization: Bearer <token>` header added to request |
| 5 | `auth.interceptor` — without token | No Authorization header added |
| 6 | `error.interceptor` — 401 triggers refresh | Refresh called, original request retried |
| 7 | `error.interceptor` — refresh fails | `logout()` called, user redirected to /auth/login |
| 8 | `auth.guard` — authenticated | `true` returned, route accessible |
| 9 | `auth.guard` — not authenticated | Redirects to `/auth/login` |
| 10 | `premium.guard` — isPremium=true | `true` returned |
| 11 | `premium.guard` — isPremium=false | Redirects to `/premium/pricing` |

### Integration Tests (backend running)
| # | Action | Expected |
|---|---|---|
| 12 | Register new user | Account created, redirected to `/`, trial banner appears |
| 13 | Login with correct credentials | Redirected to `/`, header shows user name |
| 14 | Login with wrong password | Inline error message displayed |
| 15 | Refresh page after login | User remains logged in (token refreshed from localStorage) |
| 16 | Logout | Header shows Login/Register, localStorage cleared, navigated to `/` |
| 17 | Navigate to `/recipes/new` while logged out | Redirected to `/auth/login` |
| 18 | Navigate to `/recipes/new` while logged in | Form loads |
| 19 | Update profile display name | Success toast shown, header reflects new name |
| 20 | Access token expires (wait or manually expire) | Auto-refresh happens transparently, user stays logged in |

### Social OAuth Smoke Test (manual, requires configured provider keys)
| # | Action | Expected |
|---|---|---|
| 21 | Click "Login with Google" | Redirected to Google OAuth consent screen |
| 22 | Complete Google OAuth | Returned to app, user logged in, trial active |

---

## Success Criteria
- [ ] `ng test --watch=false` — all 11 unit tests pass
- [ ] User can register and see trial banner
- [ ] User can log in and stay logged in after page refresh
- [ ] Logout clears all auth state
- [ ] Auth guard blocks unauthenticated users
- [ ] Error interceptor silently retries after 401 (user never sees a failed request they shouldn't)
- [ ] Profile page loads and updates correctly

---

## Dependencies
- Milestone 2 complete (backend auth endpoints running)
- Milestone 5 complete (frontend shell with all pages exists)

---

*Estimated effort: 1.5 days*
