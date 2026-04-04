import { Component, inject, AfterViewInit } from '@angular/core';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (!subscriptionFacade.isPremium()) {
      <div class="ad-slot" aria-label="Advertisement">
        @if (hasRealAdSense()) {
          <ins class="adsbygoogle"
               style="display:block"
               [attr.data-ad-client]="adSenseId"
               data-ad-slot="0000000000"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
        } @else {
          <div class="ad-placeholder" role="complementary">
            <span class="ad-label">Ad</span>
            <p>Enjoying the recipes? <a routerLink="/premium/pricing">Go Premium</a> to remove ads and unlock advanced features.</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .ad-slot { margin: .5rem 0; }
    .ad-placeholder {
      background: repeating-linear-gradient(
        45deg, #f5ede0, #f5ede0 10px, #fdf6ec 10px, #fdf6ec 20px
      );
      border: 1.5px dashed #cdbfab;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      color: #7a6f5e; font-size: .9rem;
      a { color: #c1633a; font-weight: 600; }
    }
    .ad-label {
      background: #cdbfab; color: #fff;
      font-size: .7rem; font-weight: 700;
      padding: 2px 6px; border-radius: 3px;
      text-transform: uppercase; white-space: nowrap;
    }
  `],
})
export class AdBannerComponent implements AfterViewInit {
  subscriptionFacade = inject(SubscriptionFacade);
  adSenseId = environment.adSensePublisherId;
  hasRealAdSense = () => this.adSenseId && !this.adSenseId.includes('XXXXXXXXXX');

  ngAfterViewInit(): void {
    if (this.hasRealAdSense() && !this.subscriptionFacade.isPremium()) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded
      }
    }
  }
}
