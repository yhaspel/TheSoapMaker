import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'recipes',
    loadChildren: () => import('./features/recipes/recipes.routes').then(m => m.RECIPE_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'premium',
    loadChildren: () => import('./features/premium/premium.routes').then(m => m.PREMIUM_ROUTES),
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/users/user-public-profile.component').then(m => m.UserPublicProfileComponent),
  },
  {
    path: 'calculator',
    loadComponent: () => import('./features/calculator/lye-calculator.component').then(m => m.LyeCalculatorComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
