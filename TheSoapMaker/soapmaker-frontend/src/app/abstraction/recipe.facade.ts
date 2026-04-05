import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';
import { RecipeService, RecipeFilters, RecipePayload } from '../core/services/recipe.service';
import { RecipeStore } from '../core/store/recipe.store';
import { UiStore } from '../core/store/ui.store';
import { BookmarkStore } from '../core/store/bookmark.store';
import { Recipe } from '../core/models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeFacade {
  private recipeService = inject(RecipeService);
  private recipeStore = inject(RecipeStore);
  private uiStore = inject(UiStore);
  private bookmarkStore = inject(BookmarkStore);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Store signals exposed
  readonly recipes = this.recipeStore.recipes;
  readonly myRecipes = this.recipeStore.myRecipes;
  readonly filteredRecipes = this.recipeStore.filteredRecipes;
  readonly topRated = this.recipeStore.topRated;
  readonly selectedRecipe = this.recipeStore.selectedRecipe;
  readonly loading = this.recipeStore.loading;
  readonly error = this.recipeStore.error;
  readonly currentPage = this.recipeStore.currentPage;
  readonly totalCount = this.recipeStore.totalCount;
  readonly hasNextPage = this.recipeStore.hasNextPage;
  readonly hasPrevPage = this.recipeStore.hasPrevPage;
  readonly totalPages = this.recipeStore.totalPages;

  // Track current filters to use when paginating
  private _currentFilters: RecipeFilters = {};

  loadRecipes(filters: RecipeFilters = {}): void {
    this._currentFilters = { ...filters };
    this.recipeStore.setLoading(true);
    this.recipeStore.setError(null);
    this.recipeService.getAll(filters).subscribe({
      next: (res) => {
        this.recipeStore.setRecipes(res.results);
        this.recipeStore.setTotalCount(res.count);
        this.recipeStore.setCurrentPage(filters.page ?? 1);
        this.recipeStore.setLoading(false);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  loadTopRated(): void {
    this.recipeService.getTopRated().subscribe({
      next: (recipes) => this.recipeStore.setRecipes(recipes),
    });
  }

  loadMyRecipes(): void {
    this.recipeStore.setLoading(true);
    this.recipeService.getMyRecipes().subscribe({
      next: (recipes) => {
        this.recipeStore.setMyRecipes(recipes);
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
    this.recipeStore.setSelectedRecipe(null);
    this.recipeStore.setError(null);
    this.recipeService.getBySlug(slug).subscribe({
      next: (recipe) => {
        this.recipeStore.setSelectedRecipe(recipe);
        this.recipeStore.setLoading(false);
      },
      error: (err) => {
        let errorMsg = err.message;
        if (err.status === 404) errorMsg = 'Recipe not found';
        else if (err.status === 403) errorMsg = 'premium_required';
        this.recipeStore.setError(errorMsg);
        this.recipeStore.setLoading(false);
      },
    });
  }

  loadNextPage(): void {
    const nextPage = this.recipeStore.currentPage() + 1;
    this.loadRecipes({ ...this._currentFilters, page: nextPage });
  }

  loadPrevPage(): void {
    const prevPage = Math.max(1, this.recipeStore.currentPage() - 1);
    this.loadRecipes({ ...this._currentFilters, page: prevPage });
  }

  setSearchQuery(q: string): void {
    this.recipeStore.setSearchQuery(q);
    // Also trigger server-side search
    this.loadRecipes({ ...this._currentFilters, search: q, page: 1 });
  }

  setActiveTag(tag: string | null): void {
    this.recipeStore.setActiveTag(tag);
    this.loadRecipes({ ...this._currentFilters, tag: tag ?? undefined, page: 1 });
  }

  setMethod(method: string | null): void {
    this.recipeStore.setActiveMethod(method);
    this.loadRecipes({ ...this._currentFilters, method: method ?? undefined, page: 1 });
  }

  setDifficulty(difficulty: string | null): void {
    this.recipeStore.setActiveDifficulty(difficulty);
    this.loadRecipes({ ...this._currentFilters, difficulty: difficulty ?? undefined, page: 1 });
  }

  setOrdering(ordering: string): void {
    this.recipeStore.setActiveOrdering(ordering);
    this.loadRecipes({ ...this._currentFilters, ordering, page: 1 });
  }

  submitRecipe(data: RecipePayload): void {
    this.recipeStore.setLoading(true);
    this.recipeService.create(data).subscribe({
      next: (recipe) => {
        this.recipeStore.addRecipe(recipe);
        this.recipeStore.setLoading(false);
        this.uiStore.addToast('Recipe created successfully!', 'success');
        this.router.navigate(['/recipes', recipe.slug]);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  updateRecipe(slug: string, data: RecipePayload): void {
    this.recipeStore.setLoading(true);
    this.recipeService.update(slug, data).subscribe({
      next: (recipe) => {
        this.recipeStore.updateRecipe(recipe);
        this.recipeStore.setLoading(false);
        this.uiStore.addToast('Recipe updated successfully!', 'success');
        this.router.navigate(['/recipes', recipe.slug]);
      },
      error: (err) => {
        this.recipeStore.setError(err.message);
        this.recipeStore.setLoading(false);
      },
    });
  }

  deleteRecipe(slug: string, id: string): void {
    this.recipeService.delete(slug).subscribe({
      next: () => {
        this.recipeStore.removeRecipe(id);
        this.recipeStore.removeMyRecipe(id);
        this.uiStore.addToast('Recipe deleted.', 'info');
      },
    });
  }

  uploadImage(file: File): Observable<string> {
    return this.recipeService.getUploadUrl().pipe(
      switchMap(config => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('api_key', config.apiKey);
        fd.append('timestamp', config.timestamp);
        fd.append('signature', config.signature);
        return this.http.post<{ secure_url: string }>(config.uploadUrl, fd);
      }),
      map(res => res.secure_url),
    );
  }

  isBookmarked(slug: string) {
    return this.bookmarkStore.isBookmarked(slug);
  }

  loadBookmarks(): void {
    this.recipeService.getBookmarked().subscribe({
      next: (recipes) => {
        this.bookmarkStore.setBookmarkedSlugs(recipes.map(r => r.slug));
      },
    });
  }

  toggleBookmark(slug: string): void {
    const wasBookmarked = this.bookmarkStore.isBookmarked(slug)();
    // Optimistic update
    if (wasBookmarked) {
      this.bookmarkStore.removeBookmark(slug);
    } else {
      this.bookmarkStore.addBookmark(slug);
    }

    this.recipeService.toggleBookmark(slug).subscribe({
      error: () => {
        // Revert optimistic update
        if (wasBookmarked) {
          this.bookmarkStore.addBookmark(slug);
        } else {
          this.bookmarkStore.removeBookmark(slug);
        }
        this.uiStore.addToast('Failed to update bookmark', 'error');
      },
    });
  }
}
