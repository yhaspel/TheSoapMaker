import { TestBed } from '@angular/core/testing';
import { SubscriptionStore } from './subscription.store';

describe('SubscriptionStore', () => {
  let store: SubscriptionStore;

  const mockSubscription = (overrides = {}) => ({
    plan: 'premium_monthly' as const,
    status: 'active' as const,
    currentPeriodEnd: '2025-12-31',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubscriptionStore],
    });
    store = TestBed.inject(SubscriptionStore);
  });

  describe('isPremium', () => {
    it('should be false when subscription is null', () => {
      store.setSubscription(null);
      expect(store.isPremium()).toBe(false);
    });

    it('should be true for active premium_monthly', () => {
      store.setSubscription(mockSubscription({ plan: 'premium_monthly', status: 'active' }));
      expect(store.isPremium()).toBe(true);
    });

    it('should be true for trialing premium_monthly', () => {
      store.setSubscription(mockSubscription({ plan: 'premium_monthly', status: 'trialing' }));
      expect(store.isPremium()).toBe(true);
    });

    it('should be false for free plan even if active', () => {
      store.setSubscription(mockSubscription({ plan: 'free', status: 'active' }));
      expect(store.isPremium()).toBe(false);
    });

    it('should be false for canceled status', () => {
      store.setSubscription(mockSubscription({ plan: 'premium_monthly', status: 'canceled' }));
      expect(store.isPremium()).toBe(false);
    });
  });

  describe('plan', () => {
    it('should default to free when no subscription', () => {
      store.setSubscription(null);
      expect(store.plan()).toBe('free');
    });

    it('should return the plan from subscription', () => {
      store.setSubscription(mockSubscription({ plan: 'premium_annual' }));
      expect(store.plan()).toBe('premium_annual');
    });
  });

  describe('status', () => {
    it('should default to active when no subscription', () => {
      store.setSubscription(null);
      expect(store.status()).toBe('active');
    });

    it('should return the status from subscription', () => {
      store.setSubscription(mockSubscription({ status: 'past_due' }));
      expect(store.status()).toBe('past_due');
    });
  });

  describe('trialActive', () => {
    it('should be true when status is trialing', () => {
      store.setSubscription(mockSubscription({ status: 'trialing' }));
      expect(store.trialActive()).toBe(true);
    });

    it('should be false when status is not trialing', () => {
      store.setSubscription(mockSubscription({ status: 'active' }));
      expect(store.trialActive()).toBe(false);
    });

    it('should be false when subscription is null', () => {
      store.setSubscription(null);
      expect(store.trialActive()).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update the loading state', () => {
      store.setLoading(true);
      expect(store.loading()).toBe(true);
      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });
  });
});
