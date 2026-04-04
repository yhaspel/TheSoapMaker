import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionFacade } from '../../abstraction/subscription.facade';

export const premiumGuard: CanActivateFn = () => {
  const subFacade = inject(SubscriptionFacade);
  const router = inject(Router);
  if (subFacade.isPremium()) return true;
  return router.createUrlTree(['/premium/pricing']);
};
