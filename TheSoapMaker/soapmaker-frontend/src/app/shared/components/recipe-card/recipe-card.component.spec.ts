import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeCardComponent } from './recipe-card.component';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { signal, computed } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Recipe } from '../../../core/models/recipe.model';
import { provideRouter } from '@angular/router';

describe('RecipeCardComponent', () => {
  let component: RecipeCardComponent;
  let fixture: ComponentFixture<RecipeCardComponent>;
  let mockRecipeFacade: any;
  let mockAuthFacade: any;
  let mockSubFacade: any;

  const mockRecipe: Recipe = {
    id: 'r1',
    slug: 'lavender-soap',
    name: 'Lavender Soap',
    description: 'A lovely soap',
    method: 'cold_process',
    difficulty: 'beginner',
    cureTimeDays: 28,
    batchSizeGrams: 1000,
    yieldBars: 8,
    imageUrl: '',
    isPublished: true,
    tags: [],
    ingredients: [],
    steps: [],
    averageRating: 4.2,
    ratingCount: 10,
    authorId: 'u1',
    authorName: 'Alice',
    authorAvatar: '',
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(async () => {
    mockRecipeFacade = {
      isBookmarked: (slug: string) => signal(false),
      toggleBookmark: jasmine.createSpy('toggleBookmark'),
    };
    mockAuthFacade = {
      isAuthenticated: signal(true),
    };
    mockSubFacade = {
      isPremium: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeCardComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeFacade, useValue: mockRecipeFacade },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: SubscriptionFacade, useValue: mockSubFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCardComponent);
    component = fixture.componentInstance;
    component.recipe = mockRecipe;
    fixture.detectChanges();
  });

  // Test 15: premium user → bookmark heart icon visible
  it('shows bookmark heart icon for authenticated premium users', () => {
    mockAuthFacade.isAuthenticated.set(true);
    mockSubFacade.isPremium.set(true);
    fixture.detectChanges();

    const bookmark = fixture.debugElement.query(By.css('.recipe-card__bookmark'));
    expect(bookmark).toBeTruthy();
  });

  // Test 16: free user → bookmark heart icon not visible
  it('does not show bookmark heart icon for free users', () => {
    mockAuthFacade.isAuthenticated.set(true);
    mockSubFacade.isPremium.set(false);
    fixture.detectChanges();

    const bookmark = fixture.debugElement.query(By.css('.recipe-card__bookmark'));
    expect(bookmark).toBeFalsy();
  });
});
