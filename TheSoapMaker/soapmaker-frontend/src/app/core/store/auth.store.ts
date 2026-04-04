import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _currentUser = signal<User | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _accessToken = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isPremium = computed(() => this._currentUser()?.isPremium ?? false);
  readonly isInTrial = computed(() => this._currentUser()?.isInTrial ?? false);

  setCurrentUser(user: User | null): void { this._currentUser.set(user); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(e: string | null): void { this._error.set(e); }
  setAccessToken(token: string | null): void { this._accessToken.set(token); }
  getAccessToken(): string | null { return this._accessToken(); }
}
