import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrialBannerComponent } from './trial-banner.component';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('TrialBannerComponent', () => {
  let component: TrialBannerComponent;
  let fixture: ComponentFixture<TrialBannerComponent>;
  let mockFacade: any;

  beforeEach(async () => {
    mockFacade = {
      trialActive: signal(false),
      trialDaysRemaining: signal(0),
      trialEndsAt: signal(null),
      startCheckout: jasmine.createSpy('startCheckout'),
      loadStatus: jasmine.createSpy('loadStatus'),
    };

    // Reset sessionStorage before each test
    sessionStorage.removeItem('sm_trial_banner_dismissed');

    await TestBed.configureTestingModule({
      imports: [TrialBannerComponent],
      providers: [
        { provide: SubscriptionFacade, useValue: mockFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Test 13: trialActive=true, 3 days remaining → Banner shows "3 days left"
  it('shows banner with correct days remaining when trial is active', () => {
    mockFacade.trialActive.set(true);
    mockFacade.trialDaysRemaining.set(3);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.trial-banner'));
    expect(banner).toBeTruthy();
    expect(banner.nativeElement.textContent).toContain('3');
  });

  // Test 14: trialActive=false → Banner not rendered
  it('does not show banner when trial is not active', () => {
    mockFacade.trialActive.set(false);
    fixture.detectChanges();

    const banner = fixture.debugElement.query(By.css('.trial-banner'));
    expect(banner).toBeFalsy();
  });
});
