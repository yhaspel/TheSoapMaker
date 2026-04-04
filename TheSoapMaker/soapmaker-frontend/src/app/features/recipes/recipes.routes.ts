import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const RECIPE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./recipe-list/recipe-list.component').then(m => m.RecipeListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-recipes',
    loadComponent: () =>
      import('./my-recipes/my-recipes.component').then(m => m.MyRecipesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'bookmarks',
    loadComponent: () =>
      import('./bookmarks/bookmarks.component').then(m => m.BookmarksComponent),
    canActivate: [authGuard],
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent),
  },
  {
    path: ':slug/edit',
    loadComponent: () =>
      import('./recipe-form/recipe-form.component').then(m => m.RecipeFormComponent),
    canActivate: [authGuard],
  },
];
