import { Injectable, inject } from '@angular/core';
import { SubscriptionService } from '../core/services/subscription.service';
import { SubscriptionStore } from '../core/store/subscription.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionFacade {
  private subscriptionService = inject(SubscriptionService);
  private subscriptionStore = inject(SubscriptionStore);

  readonly subscription = this.subscriptionStore.subscription;
  readonly plan = this.subscriptionStore.plan;
  readonly isPremium = this.subscriptionStore.isPremium;
  readonly trialActive = this.subscriptionStore.trialActive;
  readonly trialEndsAt = this.subscriptionStore.trialEndsAt;

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

  subscribe(priceId: string): void {
    this.subscriptionService.createCheckout(priceId).subscribe({
      next: ({ checkoutUrl }) => {
        window.location.href = checkoutUrl;
      },
    });
  }

  cancelSubscription(): void {
    this.subscriptionService.cancel().subscribe({
      next: () => this.loadStatus(),
    });
  }
}
