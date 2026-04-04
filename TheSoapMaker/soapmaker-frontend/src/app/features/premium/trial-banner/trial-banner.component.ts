import { Component, inject, signal } from '@angular/core';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';

const DISMISS_KEY = 'sm_trial_banner_dismissed';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [],
  template: `
    @if (subscriptionFacade.trialActive() && !dismissed()) {
      <div class="trial-banner" role="banner" aria-label="Trial status">
        <p class="trial-banner__text">
          ⏰ <strong>{{ subscriptionFacade.trialDaysRemaining() }} days left</strong> in your free trial —
          <button class="trial-banner__cta-btn" (click)="upgrade()">Upgrade now to keep full access</button>
        </p>
        <button class="trial-banner__close" (click)="dismiss()" aria-label="Dismiss trial banner">✕</button>
      </div>
    }
  `,
  styles: [`
    .trial-banner {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: linear-gradient(90deg, #c1633a, #e8956d);
      color: #fff; padding: .875rem 1.5rem;
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      z-index: 500; box-shadow: 0 -4px 16px rgba(0,0,0,.15);
    }
    .trial-banner__text { margin: 0; font-size: .925rem; }
    .trial-banner__cta-btn { background: none; border: none; color: #fff; text-decoration: underline; font-weight: 700; cursor: pointer; font-size: inherit; padding: 0; white-space: nowrap; }
    .trial-banner__close { background: rgba(255,255,255,.2); border: none; color: #fff; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: .9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(255,255,255,.35); } }
  `],
})
export class TrialBannerComponent {
  subscriptionFacade = inject(SubscriptionFacade);

  private _dismissed = signal(sessionStorage.getItem(DISMISS_KEY) === '1');
  readonly dismissed = this._dismissed.asReadonly();

  upgrade(): void {
    this.subscriptionFacade.startCheckout('premium_monthly');
  }

  dismiss(): void {
    sessionStorage.setItem(DISMISS_KEY, '1');
    this._dismissed.set(true);
  }
}
