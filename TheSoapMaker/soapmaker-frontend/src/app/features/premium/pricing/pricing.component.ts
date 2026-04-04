import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="pricing-page">
      <div class="container">
        <div class="pricing-header">
          <h1>Simple, Honest Pricing</h1>
          <p>Start with a 7-day free trial. No credit card required.</p>
        </div>

        @if (subscriptionFacade.isPremium()) {
          <div class="premium-active-card">
            <h2>⭐ You're Premium!</h2>
            <p>Current plan: <strong>{{ subscriptionFacade.plan() === 'premium_annual' ? 'Annual' : 'Monthly' }}</strong></p>
            @if (subscriptionFacade.trialActive()) {
              <p class="trial-note">Trial: {{ subscriptionFacade.trialDaysRemaining() }} days remaining</p>
            }
            @if (subscriptionFacade.cancelAtPeriodEnd()) {
              <div class="cancel-notice">
                <span class="cancel-chip">Canceling at period end</span>
                <p>Your access continues until {{ subscriptionFacade.trialEndsAt() | date:'mediumDate' }}.</p>
                <button class="btn-primary" (click)="selectPlan('monthly')">Resume Subscription</button>
              </div>
            } @else {
              <button class="btn-cancel" (click)="onCancel()">Cancel Subscription</button>
            }
          </div>
        }

        <div class="pricing-cards">
          <!-- Monthly -->
          <div class="pricing-card">
            <div class="pricing-card__top">
              <h2>Monthly</h2>
              <div class="pricing-card__price">
                <span class="price-amount">$4.99</span>
                <span class="price-period">/month</span>
              </div>
              <p class="pricing-card__tagline">Perfect for getting started</p>
            </div>
            <ul class="feature-list">
              @for (f of allFeatures; track f) {
                <li class="feature-item"><span class="check">✓</span> {{ f }}</li>
              }
            </ul>
            <button class="pricing-card__cta" (click)="selectPlan('monthly')" [disabled]="checkoutLoading()">
              @if (checkoutLoading()) { Processing… }
              @else if (currentPlan() === 'premium_monthly') { Current Plan }
              @else { Start Free Trial }
            </button>
          </div>

          <!-- Annual — highlighted -->
          <div class="pricing-card pricing-card--featured">
            <div class="pricing-card__badge">Most Popular</div>
            <div class="pricing-card__top">
              <h2>Annual</h2>
              <div class="pricing-card__price">
                <span class="price-amount">$39.99</span>
                <span class="price-period">/year</span>
              </div>
              <div class="pricing-card__saving">Save 33% vs monthly</div>
              <p class="pricing-card__tagline">Best value for serious crafters</p>
            </div>
            <ul class="feature-list">
              @for (f of allFeatures; track f) {
                <li class="feature-item"><span class="check">✓</span> {{ f }}</li>
              }
              <li class="feature-item feature-item--bonus"><span class="check">⭐</span> Priority support</li>
              <li class="feature-item feature-item--bonus"><span class="check">⭐</span> Exclusive annual-only recipes</li>
            </ul>
            <button class="pricing-card__cta pricing-card__cta--featured" (click)="selectPlan('annual')" [disabled]="checkoutLoading()">
              @if (checkoutLoading()) { Processing… }
              @else if (currentPlan() === 'premium_annual') { Current Plan }
              @else { Start Free Trial }
            </button>
          </div>
        </div>

        <!-- Comparison table -->
        <div class="comparison-section">
          <h2>Feature Comparison</h2>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              @for (row of comparisonRows; track row.feature) {
                <tr>
                  <td>{{ row.feature }}</td>
                  <td class="table-cell">{{ row.free ? '✓' : '✗' }}</td>
                  <td class="table-cell table-cell--premium">{{ row.premium ? '✓' : '✗' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- FAQ -->
        <div class="faq-section">
          <h2>FAQ</h2>
          @for (faq of faqs; track faq.q; let i = $index) {
            <div class="faq-item">
              <button class="faq-question" (click)="toggleFaq(i)" [attr.aria-expanded]="openFaq === i">
                {{ faq.q }}
                <span class="faq-chevron">{{ openFaq === i ? '▲' : '▼' }}</span>
              </button>
              @if (openFaq === i) {
                <p class="faq-answer">{{ faq.a }}</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-page { padding: 4rem 0; }
    .pricing-header { text-align: center; margin-bottom: 3rem; h1 { font-size: 2.5rem; margin-bottom: .75rem; } p { color: #7a6f5e; font-size: 1.1rem; } }
    .premium-active-card { background: linear-gradient(135deg, #fff9f3, #fdf0d5); border: 2px solid #c1633a; border-radius: 16px; padding: 2rem; margin-bottom: 3rem; text-align: center; h2 { font-size: 1.5rem; margin-bottom: .75rem; } p { color: #7a6f5e; } }
    .trial-note { color: #c1633a !important; font-weight: 600; }
    .cancel-notice { margin-top: 1rem; display: flex; flex-direction: column; gap: .75rem; align-items: center; }
    .cancel-chip { background: #fce5b0; color: #8a5e00; padding: .25rem 1rem; border-radius: 20px; font-size: .85rem; font-weight: 700; }
    .btn-cancel { padding: .5rem 1.5rem; border: 2px solid #c44040; color: #c44040; background: none; border-radius: 8px; font-weight: 600; cursor: pointer; &:hover { background: rgba(196,64,64,.06); } }
    .pricing-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; max-width: 800px; margin: 0 auto 4rem; }
    .pricing-card { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 16px; padding: 2rem; position: relative; display: flex; flex-direction: column; }
    .pricing-card--featured { border: 2px solid #c1633a; box-shadow: 0 8px 32px rgba(193,99,58,.15); }
    .pricing-card__badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #c1633a; color: #fff; padding: .25rem 1.25rem; border-radius: 20px; font-size: .8rem; font-weight: 700; white-space: nowrap; }
    .pricing-card__top { margin-bottom: 1.5rem; h2 { font-size: 1.4rem; margin-bottom: .75rem; } }
    .pricing-card__price { display: flex; align-items: baseline; gap: .25rem; margin-bottom: .375rem; }
    .price-amount { font-size: 2.75rem; font-weight: 800; color: #1a1208; }
    .price-period { font-size: 1rem; color: #7a6f5e; }
    .pricing-card__saving { display: inline-block; background: #d4e6d3; color: #2a6e3a; padding: .2rem .75rem; border-radius: 20px; font-size: .8rem; font-weight: 700; margin-bottom: .5rem; }
    .pricing-card__tagline { color: #7a6f5e; font-size: .9rem; }
    .feature-list { list-style: none; margin: 0 0 1.75rem; flex: 1; display: flex; flex-direction: column; gap: .625rem; }
    .feature-item { display: flex; align-items: center; gap: .625rem; font-size: .9rem; color: #2d2416; }
    .feature-item--bonus { color: #c1633a; font-weight: 600; }
    .check { color: #3a8c5c; font-weight: 700; }
    .pricing-card__cta { width: 100%; padding: .875rem; border: 2px solid #c1633a; background: transparent; color: #c1633a; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all .15s; &:hover:not(:disabled) { background: rgba(193,99,58,.06); } &:disabled { opacity: .6; cursor: not-allowed; } }
    .pricing-card__cta--featured { background: #c1633a; color: #fff; border-color: #c1633a; &:hover:not(:disabled) { background: #a0512e; } }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; &:hover { background: #a0512e; } }

    .comparison-section { margin-bottom: 3rem; h2 { font-size: 1.5rem; margin-bottom: 1.25rem; } }
    .comparison-table { width: 100%; border-collapse: collapse;
      th { text-align: left; padding: .75rem 1rem; background: #f5ede0; font-size: .85rem; color: #7a6f5e; text-transform: uppercase; }
      th:not(:first-child) { text-align: center; }
      td { padding: .75rem 1rem; border-bottom: 1px solid #e5d9ca; font-size: .9rem; }
    }
    .table-cell { text-align: center; font-size: 1.1rem; color: #c0392b; }
    .table-cell--premium { color: #3a8c5c; font-weight: 700; }

    .faq-section { h2 { font-size: 1.5rem; margin-bottom: 1.5rem; } }
    .faq-item { border-bottom: 1px solid #e5d9ca; }
    .faq-question { width: 100%; text-align: left; background: none; border: none; padding: 1rem 0; font-size: 1rem; font-weight: 600; color: #1a1208; cursor: pointer; display: flex; justify-content: space-between; align-items: center; &:hover { color: #c1633a; } }
    .faq-chevron { color: #c1633a; }
    .faq-answer { padding: 0 0 1rem; color: #4a4035; font-size: .95rem; line-height: 1.6; }
  `],
})
export class PricingComponent implements OnInit {
  subscriptionFacade = inject(SubscriptionFacade);
  authFacade = inject(AuthFacade);
  private analytics = inject(AnalyticsService);
  openFaq: number | null = null;
  checkoutLoading = signal(false);

  currentPlan = this.subscriptionFacade.plan;

  allFeatures = [
    'Unlimited recipe creation', 'Access to full ingredient library',
    'Star ratings & reviews', 'Community comments',
    'Built-in lye calculator', 'Ad-free experience',
    'Advanced filtering & search', 'Export recipes as PDF',
  ];

  comparisonRows = [
    { feature: 'Browse recipes', free: true, premium: true },
    { feature: 'Create recipes (up to 5)', free: true, premium: true },
    { feature: 'Unlimited recipe creation', free: false, premium: true },
    { feature: 'Ad-free experience', free: false, premium: true },
    { feature: 'Advanced search & filters', free: false, premium: true },
    { feature: 'Export recipes as PDF', free: false, premium: true },
    { feature: 'Lye calculator', free: true, premium: true },
    { feature: 'Community comments', free: true, premium: true },
    { feature: 'Priority support', free: false, premium: true },
  ];

  faqs = [
    { q: 'What happens after the 7-day trial?', a: 'After your trial ends, you will automatically move to the free plan. We will remind you before it expires. No charges without your consent.' },
    { q: 'Can I cancel at any time?', a: 'Yes, absolutely. Cancel from your Profile page and your premium access continues until the end of the billing period.' },
    { q: 'Is my payment information secure?', a: 'Yes. Payments are processed by Stripe, a PCI-DSS compliant payment processor. We never store your card details.' },
    { q: 'What is the difference between monthly and annual?', a: 'Same features, different billing cycle. Annual saves you about 33% compared to paying monthly. Perfect if you know you will be crafting long-term.' },
  ];

  ngOnInit() { this.subscriptionFacade.loadStatus(); }

  selectPlan(plan: 'monthly' | 'annual') {
    if (!this.authFacade.isAuthenticated()) return;
    const planId = plan === 'monthly' ? 'premium_monthly' : 'premium_annual';
    this.analytics.trackCheckoutStarted(planId);
    this.checkoutLoading.set(true);
    this.subscriptionFacade.startCheckout(planId);
    setTimeout(() => this.checkoutLoading.set(false), 5000);
  }

  onCancel() {
    if (confirm('Are you sure you want to cancel? You will keep access until the end of your billing period.')) {
      this.subscriptionFacade.cancelSubscription();
    }
  }

  toggleFaq(i: number) { this.openFaq = this.openFaq === i ? null : i; }
}
