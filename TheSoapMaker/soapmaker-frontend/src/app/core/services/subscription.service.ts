import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subscription } from '../models/subscription.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private mapSubscription(raw: Record<string, unknown>): Subscription {
    return {
      id: raw['id'] as string ?? '',
      plan: (raw['plan'] as Subscription['plan']) ?? 'free',
      status: (raw['status'] as Subscription['status']) ?? 'free',
      currentPeriodEnd: raw['current_period_end'] as string | null ?? null,
      cancelAtPeriodEnd: raw['cancel_at_period_end'] as boolean ?? false,
      trialDaysRemaining: raw['trial_days_remaining'] as number | null ?? null,
    };
  }

  getStatus(): Observable<Subscription> {
    return this.http.get<Record<string, unknown>>(`${this.base}/subscriptions/status/`).pipe(
      map(r => this.mapSubscription(r)),
    );
  }

  createCheckout(plan: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<Record<string, unknown>>(`${this.base}/subscriptions/checkout/`, { plan }).pipe(
      map(r => ({ checkoutUrl: r['checkout_url'] as string ?? r['checkoutUrl'] as string ?? '' })),
    );
  }

  cancel(): Observable<void> {
    return this.http.post<void>(`${this.base}/subscriptions/cancel/`, {});
  }
}
