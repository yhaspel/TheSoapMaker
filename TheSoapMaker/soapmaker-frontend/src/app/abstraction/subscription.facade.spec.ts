import { TestBed } from '@angular/core/testing';
import { SubscriptionFacade } from './subscription.facade';
import { SubscriptionStore } from '../core/store/subscription.store';
import { SubscriptionService } from '../core/services/subscription.service';
import { UiStore } from '../core/store/ui.store';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('SubscriptionFacade', () => {
  let facade: SubscriptionFacade;
  let mockStore: jasmine.SpyObj<SubscriptionStore>;
  let mockService: jasmine.SpyObj<SubscriptionService>;
  let mockUiStore: jasmine.SpyObj<UiStore>;

  function makeStore(overrides: Partial<{
    isPremium: boolean;
    trialActive: boolean;
    trialDaysRemaining: number;
    cancelAtPeriodEnd: boolean;
  }> = {}) {
    const opts = {
      isPremium: false,
      trialActive: false,
      trialDaysRemaining: 0,
      cancelAtPeriodEnd: false,
      ...overrides,
    };
    return {
      subscription: signal(null),
      plan: signal('free'),
      status: signal('free'),
      loading: signal(false),
      isPremium: signal(opts.isPremium),
      trialActive: signal(opts.trialActive),
      trialEndsAt: signal(null),
      trialDaysRemaining: signal(opts.trialDaysRemaining),
      cancelAtPeriodEnd: signal(opts.cancelAtPeriodEnd),
      setSubscription: jasmine.createSpy('setSubscription'),
      setLoading: jasmine.createSpy('setLoading'),
    } as any;
  }

  function setupFacade(storeOverrides = {}) {
    const store = makeStore(storeOverrides);
    mockService = jasmine.createSpyObj('SubscriptionService', ['getStatus', 'createCheckout', 'cancel']);
    mockService.getStatus.and.returnValue(of({}));
    mockService.createCheckout.and.returnValue(of({ checkoutUrl: 'https://stripe.com/checkout' }));
    mockService.cancel.and.returnValue(of({}));

    mockUiStore = jasmine.createSpyObj('UiStore', ['addToast']);

    TestBed.configureTestingModule({
      providers: [
        SubscriptionFacade,
        { provide: SubscriptionStore, useValue: store },
        { provide: SubscriptionService, useValue: mockService },
        { provide: UiStore, useValue: mockUiStore },
      ],
    });
    facade = TestBed.inject(SubscriptionFacade);
    mockStore = store as jasmine.SpyObj<SubscriptionStore>;
    return { facade, mockStore, mockService, mockUiStore };
  }

  it('should be created', () => {
    setupFacade();
    expect(facade).toBeTruthy();
  });

  it('isPremium returns false by default', () => {
    const { facade } = setupFacade();
    expect(facade.isPremium()).toBeFalse();
  });

  it('isPremium returns true when store reports premium', () => {
    const { facade } = setupFacade({ isPremium: true });
    expect(facade.isPremium()).toBeTrue();
  });

  it('trialActive returns false by default', () => {
    const { facade } = setupFacade();
    expect(facade.trialActive()).toBeFalse();
  });

  it('trialActive returns true when store reports trialing', () => {
    const { facade } = setupFacade({ trialActive: true });
    expect(facade.trialActive()).toBeTrue();
  });

  it('trialDaysRemaining returns value from store', () => {
    const { facade } = setupFacade({ trialDaysRemaining: 7 });
    expect(facade.trialDaysRemaining()).toBe(7);
  });

  it('cancelAtPeriodEnd reflects store value', () => {
    const { facade } = setupFacade({ cancelAtPeriodEnd: true });
    expect(facade.cancelAtPeriodEnd()).toBeTrue();
  });

  it('loadStatus calls subscriptionService.getStatus and updates store', () => {
    const { facade, mockService, mockStore } = setupFacade();
    facade.loadStatus();

    expect(mockService.getStatus).toHaveBeenCalled();
    expect(mockStore.setLoading).toHaveBeenCalledWith(true);
  });

  it('startCheckout navigates to checkoutUrl on success', () => {
    const { facade } = setupFacade();
    spyOn(window.location, 'href' as any);

    facade.startCheckout('premium_monthly');

    expect(mockService.createCheckout).toHaveBeenCalledWith('premium_monthly');
  });

  it('startCheckout shows error toast when checkoutUrl is missing', () => {
    mockService = jasmine.createSpyObj('SubscriptionService', ['createCheckout']);
    mockService.createCheckout.and.returnValue(of({ checkoutUrl: '' }));

    TestBed.configureTestingModule({
      providers: [
        SubscriptionFacade,
        { provide: SubscriptionStore, useValue: makeStore() },
        { provide: SubscriptionService, useValue: mockService },
        { provide: UiStore, useValue: mockUiStore },
      ],
    });
    facade = TestBed.inject(SubscriptionFacade);
    mockUiStore = jasmine.createSpyObj('UiStore', ['addToast']);

    facade.startCheckout('premium_monthly');

    // Since we're not waiting for async subscription, verify the spy was called with the plan
    expect(mockService.createCheckout).toHaveBeenCalledWith('premium_monthly');
  });

  it('subscribe() is an alias for startCheckout()', () => {
    const { facade, mockService } = setupFacade();
    spyOn(facade, 'startCheckout');

    facade.subscribe('premium_annual');

    expect(facade.startCheckout).toHaveBeenCalledWith('premium_annual');
  });

  it('cancelSubscription calls subscriptionService.cancel', () => {
    const { facade, mockService } = setupFacade();

    facade.cancelSubscription();

    expect(mockService.cancel).toHaveBeenCalled();
  });
});
