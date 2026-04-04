import { Injectable, computed, signal } from '@angular/core';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  private _subscription = signal<Subscription | null>(null);
  private _loading = signal(false);

  readonly subscription = this._subscription.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly plan = computed<SubscriptionPlan>(() => this._subscription()?.plan ?? 'free');
  readonly status = computed<SubscriptionStatus>(() => this._subscription()?.status ?? 'free');
  readonly isPremium = computed(() => {
    const s = this._subscription();
    return s !== null && (s.status === 'active' || s.status === 'trialing') && s.plan !== 'free';
  });
  readonly trialActive = computed(() => this._subscription()?.status === 'trialing');
  readonly trialEndsAt = computed(() => this._subscription()?.currentPeriodEnd ?? null);
  readonly cancelAtPeriodEnd = computed(() => this._subscription()?.cancelAtPeriodEnd ?? false);
  readonly trialDaysRemaining = computed(() => this._subscription()?.trialDaysRemaining ?? 0);

  setSubscription(s: Subscription | null): void { this._subscription.set(s); }
  setLoading(v: boolean): void { this._loading.set(v); }
}
