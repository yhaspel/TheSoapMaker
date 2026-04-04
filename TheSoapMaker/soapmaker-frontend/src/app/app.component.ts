import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { TrialBannerComponent } from './features/premium/trial-banner/trial-banner.component';
import { AuthService } from './core/services/auth.service';
import { AuthStore } from './core/store/auth.store';
import { SubscriptionFacade } from './abstraction/subscription.facade';

const REFRESH_KEY = 'sm_refresh';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoadingSpinnerComponent,
    ToastNotificationComponent,
    TrialBannerComponent,
  ],
  template: `
    <div class="app-shell">
      <app-header />
      <div class="app-content">
        <router-outlet />
      </div>
      <app-footer />
      <app-trial-banner />
      <app-loading-spinner />
      <app-toast-notification />
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-content {
      flex: 1;
      padding-top: 64px; /* offset for fixed header */
    }
  `],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private subscriptionFacade = inject(SubscriptionFacade);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this._bootstrapSession();
    this._checkCheckoutReturn();
  }

  private _bootstrapSession(): void {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return;

    this.authService.refreshToken(refresh).pipe(
      switchMap(({ access }) => {
        this.authStore.setAccessToken(access);
        return this.authService.getProfile();
      }),
    ).subscribe({
      next: (user) => this.authStore.setCurrentUser(user),
      error: () => localStorage.removeItem(REFRESH_KEY),
    });
  }

  private _checkCheckoutReturn(): void {
    this.route.queryParams.subscribe(params => {
      if (params['checkout'] === 'success') {
        this.subscriptionFacade.loadStatus();
      }
    });
  }
}
