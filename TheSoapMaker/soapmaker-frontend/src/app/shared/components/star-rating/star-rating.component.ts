import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="stars" [attr.aria-label]="ariaLabel()" [attr.role]="interactive ? 'radiogroup' : 'img'">
      @for (star of stars; track star) {
        <button
          class="star"
          [class.star--filled]="star <= displayRating()"
          [class.star--user]="userRating !== null && star <= userRating && !hoveredStar()"
          [class.star--interactive]="interactive && isAuthenticated"
          [title]="getStarTitle(star)"
          (mouseenter)="onMouseEnter(star)"
          (mouseleave)="onMouseLeave()"
          (click)="onStarClick(star)"
          [disabled]="!interactive || !isAuthenticated"
          [attr.aria-label]="star + ' star' + (star !== 1 ? 's' : '')"
          type="button"
        >★</button>
      }
      @if (showCount && ratingCount > 0) {
        <span class="stars__count">({{ ratingCount }})</span>
      }
      @if (interactive && !isAuthenticated) {
        <span class="stars__hint">Login to rate</span>
      }
      @if (interactive && userRating !== null && !hoveredStar()) {
        <span class="stars__your-rating">Your rating: {{ userRating }}/5</span>
      }
    </div>
  `,
  styles: [`
    .stars { display: inline-flex; align-items: center; gap: 2px; flex-wrap: wrap; }
    .star {
      background: none; border: none; padding: 0;
      font-size: 1.25rem; color: #d6cfc4;
      line-height: 1; cursor: default;
      transition: color .1s, transform .1s;
    }
    .star--filled { color: #f4a800; }
    .star--user { color: #e07b20; }
    .star--interactive { cursor: pointer; &:hover { transform: scale(1.15); } }
    .stars__count { font-size: .8rem; color: #7a6f5e; margin-left: .25rem; }
    .stars__hint { font-size: .75rem; color: #7a6f5e; margin-left: .5rem; font-style: italic; }
    .stars__your-rating { font-size: .75rem; color: #c1633a; margin-left: .5rem; font-weight: 600; }
  `],
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() userRating: number | null = null;
  @Input() ratingCount = 0;
  @Input() interactive = false;
  @Input() isAuthenticated = false;
  @Input() showCount = true;
  @Output() ratingChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  hoveredStar = signal(0);

  displayRating = computed(() => {
    if (this.hoveredStar()) return this.hoveredStar();
    if (this.userRating !== null && this.interactive) return this.userRating;
    return this.rating;
  });

  ariaLabel = computed(() => `Rating: ${this.rating} out of 5 stars`);

  getStarTitle(star: number): string {
    if (!this.isAuthenticated && this.interactive) return 'Login to rate';
    if (this.userRating !== null && star <= this.userRating && this.interactive) return 'Your rating';
    return `${star} star${star !== 1 ? 's' : ''}`;
  }

  onMouseEnter(star: number): void {
    if (this.interactive && this.isAuthenticated) this.hoveredStar.set(star);
  }

  onMouseLeave(): void {
    this.hoveredStar.set(0);
  }

  onStarClick(star: number): void {
    if (this.interactive && this.isAuthenticated) this.ratingChange.emit(star);
  }
}
