import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subscription } from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/subscriptions`;

  getStatus(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/status/`);
  }

  createCheckout(priceId: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(`${this.base}/create-checkout/`, { price_id: priceId });
  }

  cancel(): Observable<void> {
    return this.http.post<void>(`${this.base}/cancel/`, {});
  }
}
