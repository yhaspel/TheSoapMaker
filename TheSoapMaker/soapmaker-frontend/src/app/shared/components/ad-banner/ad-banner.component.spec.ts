import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdBannerComponent } from './ad-banner.component';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('AdBannerComponent', () => {
  let component: AdBannerComponent;
  let fixture: ComponentFixture<AdBannerComponent>;
  let mockSubscriptionFacade: any;

  beforeEach(async () => {
    // Create mock facade with signal
    mockSubscriptionFacade = {
      isPremium: signal(false)
    };

    await TestBed.configureTestingModule({
      imports: [AdBannerComponent],
      providers: [
        {
          provide: SubscriptionFacade,
          useValue: mockSubscriptionFacade
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ad banner visibility', () => {
    it('should show ad placeholder when user is NOT premium', () => {
      mockSubscriptionFacade.isPremium.set(false);
      fixture.detectChanges();

      const adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeTruthy();
    });

    it('should hide ad placeholder when user IS premium', () => {
      mockSubscriptionFacade.isPremium.set(true);
      fixture.detectChanges();

      const adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeFalsy();
    });

    it('should toggle ad visibility when subscription status changes', () => {
      // Start as non-premium
      mockSubscriptionFacade.isPremium.set(false);
      fixture.detectChanges();

      let adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeTruthy();

      // Change to premium
      mockSubscriptionFacade.isPremium.set(true);
      fixture.detectChanges();

      adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeFalsy();

      // Change back to non-premium
      mockSubscriptionFacade.isPremium.set(false);
      fixture.detectChanges();

      adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeTruthy();
    });
  });

  describe('reactive signal updates', () => {
    it('should reactively update when isPremium signal changes', (done) => {
      mockSubscriptionFacade.isPremium.set(false);
      fixture.detectChanges();

      let adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeTruthy();

      // Update signal
      mockSubscriptionFacade.isPremium.set(true);

      // Wait for change detection
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
        expect(adElement).toBeFalsy();
        done();
      });
    });
  });

  describe('premium user scenario', () => {
    beforeEach(() => {
      mockSubscriptionFacade.isPremium.set(true);
      fixture.detectChanges();
    });

    it('should not display any ad content', () => {
      const adContainers = fixture.debugElement.queryAll(By.css('[class*="ad-banner"]'));
      expect(adContainers.length).toBe(0);
    });
  });

  describe('non-premium user scenario', () => {
    beforeEach(() => {
      mockSubscriptionFacade.isPremium.set(false);
      fixture.detectChanges();
    });

    it('should display ad banner', () => {
      const adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement).toBeTruthy();
    });

    it('should have proper ad structure', () => {
      const adElement = fixture.debugElement.query(By.css('[class*="ad"]'));
      expect(adElement?.nativeElement.offsetParent).not.toBeNull();
    });
  });
});
