import { Routes } from '@angular/router';
import { premiumGuard } from '../../core/guards/premium.guard';

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
    canActivate: [premiumGuard],
  },
  {
    path: 'my-recipes',
    loadComponent: () =>
      import('./my-recipes/my-recipes.component').then(m => m.MyRecipesComponent),
  },
  {
    path: 'bookmarks',
    loadComponent: () =>
      import('./bookmarks/bookmarks.component').then(m => m.BookmarksComponent),
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
    canActivate: [premiumGuard],
  },
];
