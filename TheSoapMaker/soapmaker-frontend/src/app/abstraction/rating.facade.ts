import { Injectable, inject, Signal } from '@angular/core';
import { RatingService } from '../core/services/rating.service';
import { RatingStore } from '../core/store/rating.store';
import { RecipeStore } from '../core/store/recipe.store';
import { UiStore } from '../core/store/ui.store';

@Injectable({ providedIn: 'root' })
export class RatingFacade {
  private ratingService = inject(RatingService);
  private ratingStore = inject(RatingStore);
  private recipeStore = inject(RecipeStore);
  private uiStore = inject(UiStore);

  getUserRating(slug: string): Signal<number | null> {
    return this.ratingStore.getUserRating(slug);
  }

  submitRating(slug: string, stars: number): void {
    // Optimistic update
    const prevRating = this.ratingStore.getUserRating(slug)();
    this.ratingStore.setUserRating(slug, stars);

    this.ratingService.submitRating(slug, stars).subscribe({
      next: (response) => {
        // Update recipe store with new averageRating if response has it
        const current = this.recipeStore.selectedRecipe();
        if (current && current.slug === slug) {
          const averageRating = response['average_rating'] !== undefined
            ? parseFloat(String(response['average_rating']))
            : current.averageRating;
          const ratingCount = response['rating_count'] !== undefined
            ? Number(response['rating_count'])
            : current.ratingCount;
          this.recipeStore.setSelectedRecipe({ ...current, averageRating, ratingCount });
        }
        this.uiStore.addToast('Rating submitted!', 'success');
      },
      error: () => {
        // Revert optimistic update
        if (prevRating !== null) {
          this.ratingStore.setUserRating(slug, prevRating);
        } else {
          this.ratingStore.removeUserRating(slug);
        }
        this.uiStore.addToast('Failed to submit rating', 'error');
      },
    });
  }
}
