import { Injectable, inject } from '@angular/core';
import { RecipeService, RecipeFilters } from '../core/services/recipe.service';
import { RecipeStore } from '../core/store/recipe.store';
import { Recipe } from '../core/models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeFacade {
  private recipeService = inject(RecipeService);
  private recipeStore = inject(RecipeStore);

  readonly recipes = this.recipeStore.recipes;
  readonly filteredRecipes = this.recipeStore.filteredRecipes;
  readonly topRated = this.recipeStore.topRated;
  readonly selectedRecipe = this.recipeStore.selectedRecipe;
  readonly loading = this.recipeStore.loading;
  readonly error = this.recipeStore.error;

  loadRecipes(filters: RecipeFilters = {}): void {
    this.recipeStore.setLoading(true);
    this.recipeService.getAll(filters).subscribe({
      next: (res) => {
        this.recipeStore.setRecipes(res.results);
        this.recipeStore.setLoading(false);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  loadRecipeBySlug(slug: string): void {
    this.recipeStore.setLoading(true);
    this.recipeService.getBySlug(slug).subscribe({
      next: (recipe) => {
        this.recipeStore.setSelectedRecipe(recipe);
        this.recipeStore.setLoading(false);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  submitRecipe(data: Partial<Recipe>): void {
    this.recipeStore.setLoading(true);
    this.recipeService.create(data).subscribe({
      next: (recipe) => {
        this.recipeStore.addRecipe(recipe);
        this.recipeStore.setLoading(false);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  deleteRecipe(slug: string, id: string): void {
    this.recipeService.delete(slug).subscribe({
      next: () => this.recipeStore.removeRecipe(id),
    });
  }

  setSearchQuery(q: string): void { this.recipeStore.setSearchQuery(q); }
  setActiveTag(tag: string | null): void { this.recipeStore.setActiveTag(tag); }
}
