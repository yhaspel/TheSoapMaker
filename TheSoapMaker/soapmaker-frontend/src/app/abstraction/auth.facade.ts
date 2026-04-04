import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AuthStore } from '../core/store/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  readonly currentUser = this.authStore.currentUser;
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isPremium = this.authStore.isPremium;
  readonly isInTrial = this.authStore.isInTrial;
  readonly loading = this.authStore.loading;
  readonly error = this.authStore.error;

  login(email: string, password: string): void {
    this.authStore.setLoading(true);
    this.authStore.setError(null);
    this.authService.login({ email, password }).subscribe({
      next: (tokens) => {
        this.authStore.setAccessToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        this.loadCurrentUser();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.authStore.setError(err.error?.non_field_errors?.[0] ?? 'Login failed');
        this.authStore.setLoading(false);
      },
    });
  }

  register(email: string, password1: string, password2: string): void {
    this.authStore.setLoading(true);
    this.authStore.setError(null);
    this.authService.register({ email, password1, password2 }).subscribe({
      next: (tokens) => {
        this.authStore.setAccessToken(tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        this.loadCurrentUser();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.authStore.setError(err.error?.email?.[0] ?? 'Registration failed');
        this.authStore.setLoading(false);
      },
    });
  }

  logout(): void {
    const refresh = localStorage.getItem('refresh_token') ?? '';
    this.authService.logout(refresh).subscribe({
      complete: () => {
        this.authStore.setCurrentUser(null);
        this.authStore.setAccessToken(null);
        localStorage.removeItem('refresh_token');
        this.router.navigate(['/auth/login']);
      },
    });
  }

  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (user) => {
        this.authStore.setCurrentUser(user);
        this.authStore.setLoading(false);
      },
      error: () => this.authStore.setLoading(false),
    });
  }
}
