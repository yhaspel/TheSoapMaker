import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../../core/models/recipe.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { CureTimePipe } from '../../pipes/cure-time.pipe';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [RouterLink, StarRatingComponent, CureTimePipe],
  template: `
    <article class="recipe-card" [routerLink]="['/recipes', recipe.slug]">
      <div class="recipe-card__image-wrap">
        <img
          [src]="recipe.imageUrl || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'"
          [alt]="recipe.name"
          class="recipe-card__image"
          loading="lazy"
        />
        <span class="recipe-card__method badge badge-method">{{ methodLabel(recipe.method) }}</span>
      </div>

      <div class="recipe-card__body">
        <div class="recipe-card__meta">
          <span class="badge badge-difficulty-{{ recipe.difficulty }}">{{ recipe.difficulty }}</span>
          <span class="recipe-card__cure">⏱ {{ recipe.cureTimeDays | cureTime }}</span>
        </div>

        <h3 class="recipe-card__name">{{ recipe.name }}</h3>
        <p class="recipe-card__desc">{{ recipe.description }}</p>

        <div class="recipe-card__footer">
          <a [routerLink]="['/users', recipe.authorId]" class="recipe-card__author" (click)="$event.stopPropagation()">
            <img [src]="recipe.authorAvatar || 'https://i.pravatar.cc/32'" [alt]="recipe.authorName" class="recipe-card__author-avatar" loading="lazy" />
            <span>{{ recipe.authorName }}</span>
          </a>
          <div class="recipe-card__actions">
            @if (authFacade.isAuthenticated() && subscriptionFacade.isPremium()) {
              <button
                class="recipe-card__bookmark"
                [class.recipe-card__bookmark--active]="recipeFacade.isBookmarked(recipe.slug)()"
                (click)="onBookmark($event)"
                [title]="recipeFacade.isBookmarked(recipe.slug)() ? 'Remove bookmark' : 'Bookmark recipe'"
                type="button"
              >
                {{ recipeFacade.isBookmarked(recipe.slug)() ? '♥' : '♡' }}
              </button>
            }
            <app-star-rating [rating]="recipe.averageRating" [ratingCount]="recipe.ratingCount" />
          </div>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .recipe-card {
      background: #fff9f3;
      border: 1px solid #e5d9ca;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform .2s, box-shadow .2s;
      text-decoration: none; color: inherit;
      display: block;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    }
    .recipe-card__image-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .recipe-card__image { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
    .recipe-card:hover .recipe-card__image { transform: scale(1.04); }
    .recipe-card__method { position: absolute; top: .75rem; left: .75rem; }
    .recipe-card__body { padding: 1rem; }
    .recipe-card__meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .recipe-card__cure { font-size: .8rem; color: #7a6f5e; margin-left: auto; }
    .recipe-card__name { font-size: 1.05rem; font-weight: 700; margin-bottom: .375rem; color: #1a1208;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .recipe-card__desc { font-size: .85rem; color: #7a6f5e; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      margin-bottom: .75rem; }
    .recipe-card__footer { display: flex; align-items: center; justify-content: space-between; }
    .recipe-card__author { display: flex; align-items: center; gap: .375rem; font-size: .8rem; color: #7a6f5e; text-decoration: none; }
    .recipe-card__author-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .recipe-card__actions { display: flex; align-items: center; gap: .375rem; }
    .recipe-card__bookmark { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: .25rem; color: #cdbfab; transition: color .1s, transform .1s; &--active { color: #c1633a; } &:hover { transform: scale(1.2); } }
  `],
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;

  recipeFacade = inject(RecipeFacade);
  authFacade = inject(AuthFacade);
  subscriptionFacade = inject(SubscriptionFacade);

  methodLabel(method: string): string {
    const map: Record<string,string> = {
      cold_process: 'Cold Process', hot_process: 'Hot Process',
      melt_and_pour: 'M&P', liquid: 'Liquid'
    };
    return map[method] ?? method;
  }

  onBookmark(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.recipeFacade.toggleBookmark(this.recipe.slug);
  }
}
