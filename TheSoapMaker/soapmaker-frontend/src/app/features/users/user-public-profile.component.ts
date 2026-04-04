import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeFacade } from '../../abstraction/recipe.facade';
import { RecipeCardComponent } from '../../shared/components/recipe-card/recipe-card.component';

@Component({
  selector: 'app-user-public-profile',
  standalone: true,
  imports: [RouterLink, RecipeCardComponent],
  template: `
    <div class="user-profile container">
      @if (loading()) {
        <div class="loading-state">Loading profile…</div>
      } @else {
        <header class="user-header">
          <img
            [src]="avatarUrl || 'https://i.pravatar.cc/120'"
            [alt]="displayName"
            class="user-avatar"
          />
          <div class="user-info">
            <h1 class="user-name">{{ displayName || 'Community Member' }}</h1>
            @if (bio) {
              <p class="user-bio">{{ bio }}</p>
            }
          </div>
        </header>

        <section class="user-recipes">
          <h2>Recipes by {{ displayName || 'this member' }}</h2>

          @if (recipeFacade.loading()) {
            <div class="loading-state">Loading recipes…</div>
          } @else if (recipeFacade.recipes().length === 0) {
            <div class="empty-state">
              <p>No recipes published yet.</p>
              <a routerLink="/recipes" class="btn-secondary">Browse all recipes →</a>
            </div>
          } @else {
            <div class="recipes-grid">
              @for (recipe of recipeFacade.recipes(); track recipe.id) {
                <app-recipe-card [recipe]="recipe" />
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .user-profile { padding: 2.5rem 0 4rem; }
    .loading-state { padding: 3rem 0; text-align: center; color: #7a6f5e; }
    .user-header { display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 2px solid #e5d9ca; }
    .user-avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #e5d9ca; flex-shrink: 0; }
    .user-info { flex: 1; }
    .user-name { font-size: 1.75rem; margin-bottom: .5rem; }
    .user-bio { color: #4a4035; line-height: 1.6; max-width: 60ch; }
    .user-recipes h2 { font-size: 1.4rem; margin-bottom: 1.5rem; }
    .recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .empty-state { text-align: center; padding: 3rem; background: #fff9f3; border: 1px dashed #e5d9ca; border-radius: 12px; p { color: #7a6f5e; margin-bottom: 1.25rem; } }
    .btn-secondary { padding: .625rem 1.5rem; border: 2px solid #c1633a; color: #c1633a; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: rgba(193,99,58,.06); } }
  `],
})
export class UserPublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  recipeFacade = inject(RecipeFacade);

  loading = () => false;
  displayName = '';
  avatarUrl = '';
  bio = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = params['id'] ?? '';
      this.recipeFacade.loadRecipes({ authorId: userId });
      setTimeout(() => {
        const recipes = this.recipeFacade.recipes();
        if (recipes.length > 0) {
          this.displayName = recipes[0].authorName;
          this.avatarUrl = recipes[0].authorAvatar;
        }
      }, 500);
    });
  }
}
