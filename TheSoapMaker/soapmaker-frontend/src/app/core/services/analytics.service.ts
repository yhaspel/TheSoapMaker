import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare function gtag(...args: unknown[]): void;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private get isActive(): boolean {
    return environment.production && !!environment.gaMeasurementId;
  }

  trackPageView(path: string): void {
    if (!this.isActive) return;
    gtag('event', 'page_view', { page_path: path });
  }

  trackRecipeView(recipeSlug: string, recipeMethod: string): void {
    if (!this.isActive) return;
    gtag('event', 'view_recipe', { recipe_slug: recipeSlug, recipe_method: recipeMethod });
  }

  trackRatingSubmitted(stars: number): void {
    if (!this.isActive) return;
    gtag('event', 'rate_recipe', { stars });
  }

  trackCheckoutStarted(plan: string): void {
    if (!this.isActive) return;
    gtag('event', 'begin_checkout', { plan });
  }

  trackSignUp(method: 'email' | 'google' | 'facebook'): void {
    if (!this.isActive) return;
    gtag('event', 'sign_up', { method });
  }
}
