import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__header">
          <a routerLink="/" class="auth-logo">🧼 The Soap Maker</a>
          <h1>Start Crafting</h1>
          <div class="trial-badge">🎉 7-day free trial — no credit card required</div>
        </div>

        <form class="auth-form" (ngSubmit)="onRegister()">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input id="displayName" type="text" [(ngModel)]="displayName" name="displayName" placeholder="Your name in the community" />
          </div>
          <div class="form-group">
            <label for="email">Email address *</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Password *</label>
            <input id="password" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="Minimum 8 characters" required autocomplete="new-password" />
            <button type="button" class="show-pass-btn" (click)="showPassword.update(v=>!v)">{{ showPassword() ? 'Hide' : 'Show' }}</button>
          </div>
          <div class="form-group">
            <label for="confirm">Confirm Password *</label>
            <input id="confirm" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Repeat your password" required autocomplete="new-password" />
          </div>

          @if (passwordMismatch()) {
            <div class="auth-error" role="alert">Passwords do not match.</div>
          } @else if (facade.error()) {
            <div class="auth-error" role="alert">{{ facade.error() }}</div>
          }

          <button type="submit" class="btn-submit" [disabled]="facade.loading()">
            {{ facade.loading() ? 'Creating account…' : 'Create Free Account' }}
          </button>
        </form>

        <div class="trial-perks">
          <div class="perk">✅ Full access to all premium features</div>
          <div class="perk">✅ Unlimited recipe creation</div>
          <div class="perk">✅ Cancel anytime, no obligation</div>
        </div>

        <p class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign in →</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: url('/images/bg-texture.jpg') center/cover no-repeat; background-color: #2d2416; padding: 2rem; position: relative; }
    .auth-page::before { content: ''; position: absolute; inset: 0; background: rgba(26,18,8,.55); pointer-events: none; }
    .auth-card { width: 100%; max-width: 440px; background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 16px; padding: 2.5rem; box-shadow: 0 8px 40px rgba(0,0,0,.28); position: relative; z-index: 1; }
    .auth-card__header { text-align: center; margin-bottom: 2rem; h1 { font-size: 1.75rem; margin-bottom: .75rem; } }
    .auth-logo { font-size: 1.4rem; font-weight: 700; color: #c1633a; text-decoration: none; display: block; margin-bottom: 1.25rem; &:hover { text-decoration: none; } }
    .trial-badge { display: inline-block; background: linear-gradient(135deg, #c1633a, #e8956d); color: #fff; padding: .5rem 1rem; border-radius: 20px; font-size: .875rem; font-weight: 600; }
    .auth-form { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; position: relative; }
    label { font-size: .78rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; }
    input { padding: .625rem .875rem; border: 1px solid #e5d9ca; border-radius: 8px; font-size: .95rem; background: #fdf6ec; color: #2d2416; &:focus { outline: none; border-color: #c1633a; box-shadow: 0 0 0 3px rgba(193,99,58,.12); } }
    .show-pass-btn { position: absolute; right: .75rem; bottom: .625rem; background: none; border: none; color: #c1633a; font-size: .8rem; font-weight: 600; cursor: pointer; }
    .auth-error { background: #fde8e8; border: 1px solid #f5c0c0; border-radius: 6px; padding: .625rem .875rem; font-size: .875rem; color: #8b1a1a; }
    .btn-submit { width: 100%; padding: .75rem; background: #c1633a; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: .375rem; transition: background .15s; &:hover:not(:disabled) { background: #a0512e; } &:disabled { opacity: .6; cursor: not-allowed; } }
    .trial-perks { background: #f0f9f0; border: 1px solid #c8e6c9; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: .5rem; }
    .perk { font-size: .875rem; color: #2a5e30; font-weight: 500; }
    .auth-footer { text-align: center; font-size: .9rem; color: #7a6f5e; a { color: #c1633a; font-weight: 600; } }
  `],
})
export class RegisterComponent {
  facade = inject(AuthFacade);
  private analytics = inject(AnalyticsService);
  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = signal(false);

  passwordMismatch = signal(false);

  onRegister(): void {
    if (this.password !== this.confirmPassword) {
      this.passwordMismatch.set(true);
      return;
    }
    this.passwordMismatch.set(false);
    this.facade.register(this.email, this.password, this.displayName).subscribe(() => {
      this.analytics.trackSignUp('email');
    });
  }
}
