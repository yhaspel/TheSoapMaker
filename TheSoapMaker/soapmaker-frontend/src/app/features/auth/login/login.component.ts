import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__header">
          <a routerLink="/" class="auth-logo">🧼 The Soap Maker</a>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue crafting.</p>
        </div>

        <form class="auth-form" (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="email">Email address</label>
            <input id="email" type="email" [(ngModel)]="email" name="email"
              placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password"
              placeholder="••••••••" autocomplete="current-password" required />
            <button type="button" class="show-pass-btn" (click)="showPassword.update(v=>!v)">
              {{ showPassword() ? 'Hide' : 'Show' }}
            </button>
          </div>

          @if (facade.error()) {
            <div class="auth-error" role="alert">{{ facade.error() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="facade.loading()">
            {{ facade.loading() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-divider"><span>or continue with</span></div>

        <div class="social-btns">
          <button class="social-btn social-btn--google" (click)="socialLogin('google')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
        </div>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Create one free →</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: url('/images/bg-texture.jpg') center/cover no-repeat; background-color: #2d2416; padding: 2rem; position: relative; }
    .auth-page::before { content: ''; position: absolute; inset: 0; background: rgba(26,18,8,.55); pointer-events: none; }
    .auth-card { width: 100%; max-width: 420px; background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 16px; padding: 2.5rem; box-shadow: 0 8px 40px rgba(0,0,0,.28); position: relative; z-index: 1; }
    .auth-card__header { text-align: center; margin-bottom: 2rem; h1 { font-size: 1.75rem; margin-bottom: .375rem; } p { color: #7a6f5e; font-size: .95rem; } }
    .auth-logo { font-size: 1.4rem; font-weight: 700; color: #c1633a; text-decoration: none; display: block; margin-bottom: 1.25rem; &:hover { text-decoration: none; } }
    .auth-form { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; position: relative; }
    label { font-size: .78rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; }
    input { padding: .625rem .875rem; border: 1px solid #e5d9ca; border-radius: 8px; font-size: .95rem; background: #fdf6ec; color: #2d2416; &:focus { outline: none; border-color: #c1633a; box-shadow: 0 0 0 3px rgba(193,99,58,.12); } }
    .show-pass-btn { position: absolute; right: .75rem; bottom: .625rem; background: none; border: none; color: #c1633a; font-size: .8rem; font-weight: 600; cursor: pointer; }
    .auth-error { background: #fde8e8; border: 1px solid #f5c0c0; border-radius: 6px; padding: .625rem .875rem; font-size: .875rem; color: #8b1a1a; }
    .btn-submit { width: 100%; padding: .75rem; background: #c1633a; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: .375rem; transition: background .15s; &:hover:not(:disabled) { background: #a0512e; } &:disabled { opacity: .6; cursor: not-allowed; } }
    .auth-divider { text-align: center; position: relative; margin: 1.25rem 0; color: #7a6f5e; font-size: .85rem; &::before, &::after { content: ''; position: absolute; top: 50%; width: calc(50% - 3rem); height: 1px; background: #e5d9ca; } &::before { left: 0; } &::after { right: 0; } }
    .social-btns { display: flex; flex-direction: column; gap: .625rem; margin-bottom: 1.5rem; }
    .social-btn { display: flex; align-items: center; justify-content: center; gap: .625rem; padding: .625rem; border: 1px solid #e5d9ca; border-radius: 8px; background: #fdf6ec; font-size: .9rem; font-weight: 600; cursor: pointer; transition: background .15s; color: #2d2416; &:hover { background: #f5ede0; } }
    .auth-footer { text-align: center; font-size: .9rem; color: #7a6f5e; a { color: #c1633a; font-weight: 600; } }
  `],
})
export class LoginComponent {
  facade = inject(AuthFacade);
  email = '';
  password = '';
  showPassword = signal(false);

  socialLogin(provider: string): void {
    window.location.href = `${environment.apiUrl}/auth/${provider}/login/`;
  }

  onLogin(): void {
    this.facade.login(this.email, this.password).subscribe();
  }
}
