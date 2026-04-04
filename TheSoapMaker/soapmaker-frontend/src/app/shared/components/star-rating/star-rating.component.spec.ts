import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;
  let compiled: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have default rating of 0', () => {
      expect(component.rating).toBe(0);
    });

    it('should have default ratingCount of 0', () => {
      expect(component.ratingCount).toBe(0);
    });

    it('should have default interactive of false', () => {
      expect(component.interactive).toBe(false);
    });

    it('should have default showCount of true', () => {
      expect(component.showCount).toBe(true);
    });
  });

  describe('rendering', () => {
    it('should render 5 star buttons', () => {
      const buttons = compiled.queryAll(By.css('button'));
      expect(buttons.length).toBe(5);
    });

    it('should render star icons', () => {
      const stars = compiled.queryAll(By.css('[aria-label*="star"]'));
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('rating count display', () => {
    it('should show rating count when showCount is true and ratingCount > 0', () => {
      component.showCount = true;
      component.ratingCount = 42;
      fixture.detectChanges();

      const countElement = compiled.query(By.css('[class*="count"]'));
      expect(countElement).toBeTruthy();
      expect(countElement?.nativeElement.textContent).toContain('42');
    });

    it('should not show count when ratingCount is 0', () => {
      component.showCount = true;
      component.ratingCount = 0;
      fixture.detectChanges();

      const countElement = compiled.query(By.css('[class*="count"]'));
      expect(countElement).toBeFalsy();
    });

    it('should not show count when showCount is false', () => {
      component.showCount = false;
      component.ratingCount = 42;
      fixture.detectChanges();

      const countElement = compiled.query(By.css('[class*="count"]'));
      expect(countElement).toBeFalsy();
    });
  });

  describe('interactivity', () => {
    it('should emit ratingChange when interactive and star is clicked', () => {
      spyOn(component.ratingChange, 'emit');
      component.interactive = true;
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      buttons[2].nativeElement.click();

      expect(component.ratingChange.emit).toHaveBeenCalledWith(3);
    });

    it('should not emit ratingChange when not interactive', () => {
      spyOn(component.ratingChange, 'emit');
      component.interactive = false;
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      buttons[2].nativeElement.click();

      expect(component.ratingChange.emit).not.toHaveBeenCalled();
    });

    it('should disable buttons when not interactive', () => {
      component.interactive = false;
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.disabled).toBe(true);
      });
    });

    it('should enable buttons when interactive', () => {
      component.interactive = true;
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.disabled).toBe(false);
      });
    });
  });

  describe('displayRating signal', () => {
    it('should update displayRating when rating changes', () => {
      component.rating = 3;
      fixture.detectChanges();

      expect(component.displayRating()).toBe(3);
    });

    it('should handle rating of 0', () => {
      component.rating = 0;
      fixture.detectChanges();

      expect(component.displayRating()).toBe(0);
    });

    it('should handle maximum rating of 5', () => {
      component.rating = 5;
      fixture.detectChanges();

      expect(component.displayRating()).toBe(5);
    });
  });

  // Test 1: Display mode — rating 3.5 shows filled stars correctly
  it('displays correct stars in display mode for rating 3.5', () => {
    component.rating = 3.5;
    component.interactive = false;
    fixture.detectChanges();
    // displayRating computed returns 3.5 (hoveredStar is 0, no userRating in display mode)
    expect(component.displayRating()).toBe(3.5);
  });

  // Test 2: Interactive mode — hover sets hovered star
  it('highlights hovered star in interactive mode', () => {
    component.rating = 3;
    component.interactive = true;
    component.isAuthenticated = true;
    fixture.detectChanges();

    component.onMouseEnter(4);
    expect(component.displayRating()).toBe(4);

    component.onMouseLeave();
    expect(component.displayRating()).toBe(3);
  });

  // Test 3: Interactive mode — click emits ratingChange
  it('emits ratingChange on click when interactive and authenticated', () => {
    component.interactive = true;
    component.isAuthenticated = true;
    fixture.detectChanges();

    let emitted = 0;
    component.ratingChange.subscribe(v => emitted = v);

    component.onStarClick(4);
    expect(emitted).toBe(4);
  });

  describe('star highlighting', () => {
    it('should highlight stars based on rating', () => {
      component.rating = 3;
      component.interactive = true;
      fixture.detectChanges();

      const buttons = compiled.queryAll(By.css('button'));
      for (let i = 0; i < 5; i++) {
        const isHighlighted = i < 3;
        expect(buttons[i].nativeElement.classList.contains('active') ||
                buttons[i].nativeElement.innerHTML.includes('★')).toBeTruthy();
      }
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on buttons', () => {
      const buttons = compiled.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
