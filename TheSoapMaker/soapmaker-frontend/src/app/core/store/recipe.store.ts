import { Injectable, computed, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';

export const PAGE_SIZE = 12;

@Injectable({ providedIn: 'root' })
export class RecipeStore {
  private _recipes = signal<Recipe[]>([]);
  private _myRecipes = signal<Recipe[]>([]);
  private _selectedRecipe = signal<Recipe | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _searchQuery = signal('');
  private _activeTag = signal<string | null>(null);
  private _activeMethod = signal<string | null>(null);
  private _activeDifficulty = signal<string | null>(null);
  private _activeOrdering = signal('-created_at');
  private _currentPage = signal(1);
  private _totalCount = signal(0);

  readonly recipes = this._recipes.asReadonly();
  readonly myRecipes = this._myRecipes.asReadonly();
  readonly selectedRecipe = this._selectedRecipe.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly activeMethod = this._activeMethod.asReadonly();
  readonly activeDifficulty = this._activeDifficulty.asReadonly();
  readonly activeOrdering = this._activeOrdering.asReadonly();

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

  readonly hasNextPage = computed(() =>
    this._currentPage() * PAGE_SIZE < this._totalCount()
  );

  readonly hasPrevPage = computed(() => this._currentPage() > 1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this._totalCount() / PAGE_SIZE))
  );

  setRecipes(recipes: Recipe[]): void { this._recipes.set(recipes); }
  setMyRecipes(recipes: Recipe[]): void { this._myRecipes.set(recipes); }
  setSelectedRecipe(r: Recipe | null): void { this._selectedRecipe.set(r); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(e: string | null): void { this._error.set(e); }
  setSearchQuery(q: string): void { this._searchQuery.set(q); }
  setActiveTag(tag: string | null): void { this._activeTag.set(tag); }
  setActiveMethod(m: string | null): void { this._activeMethod.set(m); }
  setActiveDifficulty(d: string | null): void { this._activeDifficulty.set(d); }
  setActiveOrdering(o: string): void { this._activeOrdering.set(o); }
  setCurrentPage(p: number): void { this._currentPage.set(p); }
  setTotalCount(c: number): void { this._totalCount.set(c); }
  addRecipe(r: Recipe): void { this._recipes.update(rs => [r, ...rs]); }
  removeRecipe(id: string): void { this._recipes.update(rs => rs.filter(r => r.id !== id)); }
  removeMyRecipe(id: string): void { this._myRecipes.update(rs => rs.filter(r => r.id !== id)); }
  updateRecipe(updated: Recipe): void {
    this._recipes.update(rs => rs.map(r => r.id === updated.id ? updated : r));
  }
}
