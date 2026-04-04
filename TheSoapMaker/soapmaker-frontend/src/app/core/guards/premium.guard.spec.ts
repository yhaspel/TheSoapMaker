import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { premiumGuard } from './premium.guard';
import { SubscriptionFacade } from '../../abstraction/subscription.facade';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    premiumGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('premiumGuard', () => {
  let router: Router;
  const mockFacade = { isPremium: signal(false) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SubscriptionFacade, useValue: mockFacade },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('Test 10 — isPremium=true: returns true', () => {
    mockFacade.isPremium.set(true);
    const result = runGuard();
    expect(result).toBeTrue();
  });

  it('Test 11 — isPremium=false: redirects to /premium/pricing', () => {
    mockFacade.isPremium.set(false);
    const result = runGuard();
    expect(result).toEqual(router.createUrlTree(['/premium/pricing']));
  });
});
