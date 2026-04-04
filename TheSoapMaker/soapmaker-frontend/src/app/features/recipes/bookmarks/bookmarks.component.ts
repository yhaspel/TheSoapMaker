import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { RecipeService } from '../../../core/services/recipe.service';
import { RecipeCardComponent } from '../../../shared/components/recipe-card/recipe-card.component';
import { Recipe } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [RouterLink, RecipeCardComponent],
  template: `
    <div class="bookmarks-page container">
      <div class="page-header">
        <h1>My Bookmarks</h1>
        <a routerLink="/recipes" class="btn-secondary">← All Recipes</a>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading bookmarks…</div>
      } @else if (recipes().length === 0) {
        <div class="empty-state">
          <p>🔖 You haven't bookmarked any recipes yet.</p>
          <a routerLink="/recipes" class="btn-primary">Browse Recipes</a>
        </div>
      } @else {
        <div class="bookmarks-grid">
          @for (recipe of recipes(); track recipe.id) {
            <app-recipe-card [recipe]="recipe" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .bookmarks-page { padding: 2.5rem 0 4rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; }
    h1 { font-size: 2rem; }
    .loading-state { padding: 3rem 0; text-align: center; color: #7a6f5e; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: #7a6f5e; p { font-size: 1.1rem; margin-bottom: 1.5rem; } display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .bookmarks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: #a0512e; } }
    .btn-secondary { padding: .5rem 1.25rem; border: 2px solid #c1633a; color: #c1633a; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: rgba(193,99,58,.06); } }
  `],
})
export class BookmarksComponent implements OnInit {
  private recipeService = inject(RecipeService);
  recipeFacade = inject(RecipeFacade);

  loading = signal(true);
  recipes = signal<Recipe[]>([]);

  ngOnInit(): void {
    this.recipeService.getBookmarked().subscribe({
      next: (bookmarked) => {
        this.recipes.set(bookmarked);
        this.loading.set(false);
        // Update bookmark store with current slugs
        this.recipeFacade.loadBookmarks();
      },
      error: () => this.loading.set(false),
    });
  }
}
