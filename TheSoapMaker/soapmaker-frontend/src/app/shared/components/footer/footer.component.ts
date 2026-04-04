import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer__inner container">
        <div class="footer__brand">
          <span class="footer__logo">🧼 The Soap Maker</span>
          <p class="footer__tagline">Craft beautiful soap. Share the art.</p>
        </div>
        <nav class="footer__nav" aria-label="Footer navigation">
          <a routerLink="/">Home</a>
          <a routerLink="/recipes">Recipes</a>
          <a routerLink="/premium/pricing">Pricing</a>
          <a routerLink="/auth/login">Sign In</a>
        </nav>
        <p class="footer__copy">&copy; {{ year }} The Soap Maker. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1a1208;
      color: #c9b99a;
      padding: 2.5rem 0 1.5rem;
      margin-top: auto;
    }
    .footer__inner { display: flex; flex-direction: column; gap: 1.25rem; }
    .footer__logo { font-size: 1.25rem; font-weight: 700; color: #fdf6ec; }
    .footer__tagline { font-size: .85rem; margin: .25rem 0 0; }
    .footer__nav {
      display: flex; gap: 1.5rem; flex-wrap: wrap;
      a { color: #c9b99a; font-size: .9rem;
          &:hover { color: #fdf6ec; text-decoration: none; } }
    }
    .footer__copy { font-size: .8rem; color: #7a6f5e; }
  `],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
