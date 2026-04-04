import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

// Mock gtag globally
const gtagSpy = jasmine.createSpy('gtag');
(window as any).gtag = gtagSpy;

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    gtagSpy.calls.reset();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('trackPageView does not fire gtag in dev (production=false)', () => {
    // In test environment, environment.production is false
    service.trackPageView('/recipes');
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackRecipeView does not fire gtag in dev (production=false)', () => {
    // In test environment, environment.production is false
    service.trackRecipeView('my-soap', 'cold_process');
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackRatingSubmitted does not fire gtag in dev', () => {
    service.trackRatingSubmitted(5);
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackCheckoutStarted does not fire gtag in dev', () => {
    service.trackCheckoutStarted('premium_monthly');
    expect(gtagSpy).not.toHaveBeenCalled();
  });

  it('trackSignUp does not fire gtag in dev', () => {
    service.trackSignUp('email');
    expect(gtagSpy).not.toHaveBeenCalled();
  });
});
