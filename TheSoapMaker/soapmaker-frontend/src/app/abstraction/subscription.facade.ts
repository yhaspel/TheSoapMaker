import { Injectable, inject } from '@angular/core';
import { SubscriptionService } from '../core/services/subscription.service';
import { SubscriptionStore } from '../core/store/subscription.store';
import { UiStore } from '../core/store/ui.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionFacade {
  private subscriptionService = inject(SubscriptionService);
  private subscriptionStore = inject(SubscriptionStore);
  private uiStore = inject(UiStore);

  readonly subscription = this.subscriptionStore.subscription;
  readonly plan = this.subscriptionStore.plan;
  readonly isPremium = this.subscriptionStore.isPremium;
  readonly trialActive = this.subscriptionStore.trialActive;
  readonly trialEndsAt = this.subscriptionStore.trialEndsAt;
  readonly cancelAtPeriodEnd = this.subscriptionStore.cancelAtPeriodEnd;
  readonly trialDaysRemaining = this.subscriptionStore.trialDaysRemaining;

  loadStatus(): void {
    this.subscriptionStore.setLoading(true);
    this.subscriptionService.getStatus().subscribe({
      next: (sub) => {
        this.subscriptionStore.setSubscription(sub);
        this.subscriptionStore.setLoading(false);
      },
      error: () => this.subscriptionStore.setLoading(false),
    });
  }

  startCheckout(plan: string): void {
    this.subscriptionService.createCheckout(plan).subscribe({
      next: ({ checkoutUrl }) => {
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          this.uiStore.addToast('Could not start checkout', 'error');
        }
      },
      error: () => this.uiStore.addToast('Could not start checkout', 'error'),
    });
  }

  // Backward compat alias
  subscribe(priceId: string): void {
    this.startCheckout(priceId);
  }

  cancelSubscription(): void {
    this.subscriptionService.cancel().subscribe({
      next: () => {
        this.loadStatus();
        this.uiStore.addToast('Subscription will end at the current period end.', 'info');
      },
      error: () => this.uiStore.addToast('Failed to cancel subscription', 'error'),
    });
  }
}
