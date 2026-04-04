import { Routes } from '@angular/router';

export const PREMIUM_ROUTES: Routes = [
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pricing/pricing.component').then(m => m.PricingComponent),
  },
];
