import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { AuthStore } from '../core/store/auth.store';
import { UiStore } from '../core/store/ui.store';

const REFRESH_KEY = 'sm_refresh';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private uiStore = inject(UiStore);
  private router = inject(Router);

  readonly currentUser = this.authStore.currentUser;
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isPremium = this.authStore.isPremium;
  readonly isInTrial = this.authStore.isInTrial;
  readonly loading = this.authStore.loading;
  readonly error = this.authStore.error;

  login(email: string, password: string): Observable<void> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);
    return this.authService.login(email, password).pipe(
      tap(({ access, refresh }) => {
        this.authStore.setAccessToken(access);
        localStorage.setItem(REFRESH_KEY, refresh);
      }),
      switchMap(() => this.authService.getProfile()),
      tap({
        next: (user) => {
          this.authStore.setCurrentUser(user);
          this.authStore.setLoading(false);
          this.uiStore.addToast(`Welcome back, ${user.displayName}!`, 'success');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.authStore.setError(err.error?.non_field_errors?.[0] ?? err.message ?? 'Login failed');
          this.authStore.setLoading(false);
        },
      }),
    ) as unknown as Observable<void>;
  }

  register(email: string, password: string, displayName: string): Observable<void> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);
    return this.authService.register(email, password, password, displayName).pipe(
      tap(({ access, refresh }) => {
        this.authStore.setAccessToken(access);
        localStorage.setItem(REFRESH_KEY, refresh);
      }),
      switchMap(() => this.authService.getProfile()),
      tap({
        next: (user) => {
          this.authStore.setCurrentUser(user);
          this.authStore.setLoading(false);
          this.uiStore.addToast('Account created! Your 7-day trial has started.', 'success');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.authStore.setError(
            err.error?.email?.[0] ??
            err.error?.password1?.[0] ??
            err.error?.non_field_errors?.[0] ??
            'Registration failed',
          );
          this.authStore.setLoading(false);
        },
      }),
    ) as unknown as Observable<void>;
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.authStore.setCurrentUser(null);
        this.authStore.setAccessToken(null);
        localStorage.removeItem(REFRESH_KEY);
        this.uiStore.addToast('You have been logged out.', 'info');
        this.router.navigate(['/']);
      },
      error: () => {
        // Even if logout API fails, clear local state
        this.authStore.setCurrentUser(null);
        this.authStore.setAccessToken(null);
        localStorage.removeItem(REFRESH_KEY);
        this.router.navigate(['/']);
      },
    });
  }

  loadCurrentUser(): void {
    this.authService.getProfile().subscribe({
      next: (user) => this.authStore.setCurrentUser(user),
    });
  }
}
