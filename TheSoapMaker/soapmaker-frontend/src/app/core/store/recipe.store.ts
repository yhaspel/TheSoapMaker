import { Injectable, computed, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeStore {
  private _recipes = signal<Recipe[]>([]);
  private _selectedRecipe = signal<Recipe | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _searchQuery = signal('');
  private _activeTag = signal<string | null>(null);

  readonly recipes = this._recipes.asReadonly();
  readonly selectedRecipe = this._selectedRecipe.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredRecipes = computed(() => {
    const q = this._searchQuery().toLowerCase();
    const tag = this._activeTag();
    return this._recipes().filter(r =>
      (!q || r.name.toLowerCase().includes(q) || r.tags.some(t => t.name.includes(q))) &&
      (!tag || r.tags.some(t => t.name === tag))
    );
  });

  readonly topRated = computed(() =>
    [...this._recipes()].sort((a, b) => b.averageRating - a.averageRating).slice(0, 6)
  );

  setRecipes(recipes: Recipe[]): void { this._recipes.set(recipes); }
  setSelectedRecipe(r: Recipe | null): void { this._selectedRecipe.set(r); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(e: string | null): void { this._error.set(e); }
  setSearchQuery(q: string): void { this._searchQuery.set(q); }
  setActiveTag(tag: string | null): void { this._activeTag.set(tag); }
  addRecipe(r: Recipe): void { this._recipes.update(rs => [r, ...rs]); }
  removeRecipe(id: string): void { this._recipes.update(rs => rs.filter(r => r.id !== id)); }
  updateRecipe(updated: Recipe): void {
    this._recipes.update(rs => rs.map(r => r.id === updated.id ? updated : r));
  }
}
