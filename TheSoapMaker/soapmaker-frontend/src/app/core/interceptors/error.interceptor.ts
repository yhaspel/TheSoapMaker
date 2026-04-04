import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  throwError,
  BehaviorSubject,
  filter,
  take,
  switchMap,
} from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';
import { UiStore } from '../store/ui.store';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authStore: AuthStore,
  authService: AuthService,
  uiStore: UiStore,
  router: Router,
) {
  const refresh = localStorage.getItem('sm_refresh');
  if (!refresh) {
    authStore.setCurrentUser(null);
    authStore.setAccessToken(null);
    router.navigate(['/auth/login']);
    return throwError(() => new Error('No refresh token'));
  }

  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
      ),
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authService.refreshToken(refresh).pipe(
    switchMap(({ access }) => {
      isRefreshing = false;
      refreshTokenSubject.next(access);
      authStore.setAccessToken(access);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${access}` } }));
    }),
    catchError(err => {
      isRefreshing = false;
      localStorage.removeItem('sm_refresh');
      authStore.setCurrentUser(null);
      authStore.setAccessToken(null);
      uiStore.addToast('Session expired. Please log in again.', 'error');
      router.navigate(['/auth/login']);
      return throwError(() => err);
    }),
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const uiStore = inject(UiStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/token/refresh')) {
        return handle401(req, next, authStore, authService, uiStore, router);
      }
      // For non-401 errors, show a toast (skip 0 = network errors for better messaging)
      if (error.status !== 0) {
        const message =
          error.error?.detail ??
          error.error?.non_field_errors?.[0] ??
          error.message ??
          'An unexpected error occurred';
        uiStore.addToast(message, 'error');
      } else {
        uiStore.addToast('Network error — please check your connection.', 'error');
      }
      return throwError(() => error);
    }),
  );
};
