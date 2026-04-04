import { Injectable, inject } from '@angular/core';
import { RatingService } from '../core/services/rating.service';
import { UiStore } from '../core/store/ui.store';

@Injectable({ providedIn: 'root' })
export class RatingFacade {
  private ratingService = inject(RatingService);
  private uiStore = inject(UiStore);

  submitRating(slug: string, stars: number): void {
    this.ratingService.submitRating(slug, stars).subscribe({
      next: () => this.uiStore.addToast('Rating submitted!', 'success'),
      error: () => this.uiStore.addToast('Failed to submit rating', 'error'),
    });
  }
}
