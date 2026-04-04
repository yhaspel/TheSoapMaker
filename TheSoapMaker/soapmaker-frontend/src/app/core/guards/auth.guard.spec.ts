import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from '../store/auth.store';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  let authStore: AuthStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthStore, provideRouter([])],
    });
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  it('Test 8 — authenticated: returns true', () => {
    authStore.setCurrentUser({
      id: '1', email: 'test@test.com', displayName: 'Test', avatarUrl: '',
      bio: '', isPremium: false, isInTrial: false, trialStartedAt: null,
      trialEndsAt: null, trialDaysRemaining: null, dateJoined: '',
    });
    const result = runGuard();
    expect(result).toBeTrue();
  });

  it('Test 9 — not authenticated: redirects to /auth/login', () => {
    authStore.setCurrentUser(null);
    const result = runGuard();
    expect(result).toEqual(router.createUrlTree(['/auth/login']));
  });
});
