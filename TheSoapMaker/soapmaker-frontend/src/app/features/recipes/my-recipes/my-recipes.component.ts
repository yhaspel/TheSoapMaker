import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { CureTimePipe } from '../../../shared/pipes/cure-time.pipe';

@Component({
  selector: 'app-my-recipes',
  standalone: true,
  imports: [RouterLink, CureTimePipe],
  template: `
    <div class="my-recipes container">
      <div class="page-header">
        <div>
          <h1>My Recipes</h1>
          <p class="page-header__sub">Recipes by {{ authFacade.currentUser()?.displayName }}</p>
        </div>
        <a routerLink="/recipes/new" class="btn-primary">+ New Recipe</a>
      </div>

      @if (recipeFacade.loading()) {
        <div class="loading-msg">Loading your recipes…</div>
      } @else if (myRecipes().length === 0) {
        <div class="empty-state">
          <p>🧼 You haven't created any recipes yet.</p>
          <a routerLink="/recipes/new" class="btn-primary">Create Your First Recipe</a>
        </div>
      } @else {
        <div class="recipe-table-wrap">
          <table class="recipe-table">
            <thead>
              <tr>
                <th>Recipe</th>
                <th>Method</th>
                <th>Difficulty</th>
                <th>Cure Time</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (recipe of myRecipes(); track recipe.id) {
                <tr>
                  <td>
                    <div class="recipe-name-cell">
                      <img [src]="recipe.imageUrl" [alt]="recipe.name" class="recipe-thumb" />
                      <div>
                        <a [routerLink]="['/recipes', recipe.slug]" class="recipe-link">{{ recipe.name }}</a>
                        <p class="recipe-desc">{{ recipe.description | slice:0:60 }}…</p>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge badge-method">{{ recipe.method.replace('_',' ') }}</span></td>
                  <td><span class="badge badge-difficulty-{{ recipe.difficulty }}">{{ recipe.difficulty }}</span></td>
                  <td>{{ recipe.cureTimeDays | cureTime }}</td>
                  <td>
                    <span class="rating-cell">⭐ {{ recipe.averageRating.toFixed(1) }} ({{ recipe.ratingCount }})</span>
                  </td>
                  <td>
                    <span class="status-badge" [class.status-badge--published]="recipe.isPublished">
                      {{ recipe.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <a [routerLink]="['/recipes', recipe.slug, 'edit']" class="action-btn action-btn--edit">Edit</a>
                      <button class="action-btn action-btn--delete" (click)="onDelete(recipe.slug, recipe.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .my-recipes { padding: 2rem 0 4rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-header__sub { color: #7a6f5e; margin-top: .25rem; }
    h1 { font-size: 2rem; }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: #a0512e; text-decoration: none; } }
    .loading-msg { color: #7a6f5e; padding: 3rem; text-align: center; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: #7a6f5e; p { font-size: 1.1rem; margin-bottom: 1.5rem; } }
    .recipe-table-wrap { overflow-x: auto; border: 1px solid #e5d9ca; border-radius: 12px; }
    .recipe-table { width: 100%; border-collapse: collapse; font-size: .9rem;
      th { text-align: left; padding: .75rem 1rem; background: #f5ede0; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #7a6f5e; }
      td { padding: .875rem 1rem; border-bottom: 1px solid #e5d9ca; vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fff9f3; }
    }
    .recipe-name-cell { display: flex; align-items: center; gap: .75rem; }
    .recipe-thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
    .recipe-link { font-weight: 600; color: #1a1208; &:hover { color: #c1633a; text-decoration: none; } }
    .recipe-desc { font-size: .8rem; color: #7a6f5e; margin-top: .125rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .72rem; font-weight: 600; text-transform: uppercase; }
    .badge-method { background: #ede0d3; color: #c1633a; }
    .badge-difficulty-beginner { background: #d4e6d3; color: #2a6e3a; }
    .badge-difficulty-intermediate { background: #fdf0d5; color: #8a5e00; }
    .badge-difficulty-advanced { background: #fde8e8; color: #8b1a1a; }
    .rating-cell { font-size: .9rem; }
    .status-badge { padding: .25rem .625rem; border-radius: 20px; font-size: .75rem; font-weight: 600; background: #f5ede0; color: #7a6f5e;
      &--published { background: #d4e6d3; color: #2a6e3a; } }
    .action-btns { display: flex; gap: .5rem; }
    .action-btn { padding: .3rem .75rem; border-radius: 5px; font-size: .8rem; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: background .15s; }
    .action-btn--edit { background: #fdf0d5; color: #8a5e00; &:hover { background: #fce5b0; } }
    .action-btn--delete { background: #fde8e8; color: #8b1a1a; &:hover { background: #fac9c9; } }
  `],
})
export class MyRecipesComponent implements OnInit {
  recipeFacade = inject(RecipeFacade);
  authFacade = inject(AuthFacade);

  myRecipes = this.recipeFacade.myRecipes;

  ngOnInit(): void {
    this.recipeFacade.loadMyRecipes();
  }

  onDelete(slug: string, id: string): void {
    if (confirm('Delete this recipe?')) {
      this.recipeFacade.deleteRecipe(slug, id);
    }
  }
}
