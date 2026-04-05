import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { RecipeFacade } from '../../abstraction/recipe.facade';
import { AuthFacade } from '../../abstraction/auth.facade';
import { SubscriptionFacade } from '../../abstraction/subscription.facade';
import { RecipeCardComponent } from '../../shared/components/recipe-card/recipe-card.component';
import { AdBannerComponent } from '../../shared/components/ad-banner/ad-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RecipeCardComponent, AdBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero__inner container">
        <div class="hero__text">
          <h1 class="hero__title">Craft Beautiful Soap.<br>Share the Art.</h1>
          <p class="hero__sub">Discover hand-crafted recipes, connect with fellow soap makers, and take your craft to the next level.</p>
          <div class="hero__cta">
            <a routerLink="/recipes" class="btn-primary btn-lg">Browse Recipes</a>
            <a routerLink="/auth/register" class="btn-secondary btn-lg">Start Free Trial</a>
          </div>
        </div>
        <div class="hero__visual" aria-hidden="true">
          <div class="hero__soap-stack">
            <div class="soap-block soap-block--1"></div>
            <div class="soap-block soap-block--2"></div>
            <div class="soap-block soap-block--3"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features strip -->
    <section class="features container">
      <div class="feature">
        <span class="feature__icon">🧪</span>
        <h3>Lye Calculator</h3>
        <p>Built-in NaOH/KOH calculator for every recipe. No more spreadsheets.</p>
      </div>
      <div class="feature">
        <span class="feature__icon">🌿</span>
        <h3>Natural Ingredients</h3>
        <p>Browse our curated ingredient library with saponification values.</p>
      </div>
      <div class="feature">
        <span class="feature__icon">👥</span>
        <h3>Community</h3>
        <p>Rate, comment, and share recipes with thousands of crafters.</p>
      </div>
    </section>

    <!-- Top Rated Recipes -->
    <section class="top-rated">
      <div class="container">
        <div class="section-header">
          <h2>Top Rated Recipes</h2>
          <a routerLink="/recipes" class="section-header__link">View all →</a>
        </div>

        @if (recipeFacade.loading()) {
          <div class="recipes-grid recipes-grid--skeleton">
            @for (n of [1,2,3,4,5,6]; track n) {
              <div class="skeleton-card"></div>
            }
          </div>
        } @else {
          <div class="recipes-grid">
            @for (recipe of recipeFacade.topRated(); track recipe.id) {
              <app-recipe-card [recipe]="recipe" />
            }
          </div>
        }
      </div>
    </section>

    <!-- Ad Banner -->
    <div class="container" style="margin: 2rem auto;">
      <app-ad-banner />
    </div>

    <!-- CTA Banner -->
    <section class="cta-banner">
      <div class="container">
        <h2>Ready to share your recipe?</h2>
        <p>Join thousands of soap makers who share their creations and inspire others.</p>
        <a routerLink="/auth/register" class="btn-primary btn-lg">Start Your Free 7-Day Trial</a>
      </div>
    </section>
  `,
  styles: [`
    /* ── Hero ──────────────────────────────────────────────── */
    .hero {
      position: relative;
      background: url('/images/bg-hero.jpg') center/cover no-repeat;
      padding: 6rem 0 4rem;
      /* Fallback gradient shown while image loads or if image is missing */
      background-color: #2d2416;
    }
    /* Dark overlay for text readability */
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(26,18,8,.68) 0%, rgba(45,36,22,.52) 100%);
      pointer-events: none;
    }
    .hero__inner {
      position: relative; z-index: 1;
      display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center;
      @media(min-width:768px) { grid-template-columns: 1fr 1fr; }
    }
    .hero__title { font-size: clamp(2rem,4vw,3rem); line-height: 1.15; margin-bottom: 1.25rem; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.35); }
    .hero__sub { font-size: 1.1rem; color: rgba(255,255,255,.85); margin-bottom: 2rem; line-height: 1.6; text-shadow: 0 1px 4px rgba(0,0,0,.3); }
    .hero__cta { display: flex; gap: 1rem; flex-wrap: wrap; }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      background: #c1633a; color: #fff; padding: .75rem 1.75rem;
      border-radius: 8px; font-weight: 700; font-size: 1rem;
      text-decoration: none; transition: background .15s;
      &:hover { background: #a0512e; text-decoration: none; }
    }
    .btn-secondary {
      display: inline-flex; align-items: center; justify-content: center;
      border: 2px solid rgba(255,255,255,.85); color: #fff; padding: .75rem 1.75rem;
      border-radius: 8px; font-weight: 700; font-size: 1rem;
      text-decoration: none; transition: background .15s, border-color .15s;
      &:hover { background: rgba(255,255,255,.12); border-color: #fff; text-decoration: none; }
    }
    .btn-lg { padding: .875rem 2rem; font-size: 1.1rem; }

    /* Soap stack visual — hidden on mobile when image fills the frame */
    .hero__visual { display: flex; justify-content: center; @media(max-width:767px) { display: none; } }
    .hero__soap-stack { position: relative; width: 200px; height: 200px; }
    .soap-block {
      position: absolute; border-radius: 10px;
      transition: transform .3s;
      box-shadow: 0 4px 16px rgba(0,0,0,.35);
    }
    .soap-block--1 { width: 130px; height: 70px; background: #e8d5b7; top: 60px; left: 20px; transform: rotate(-6deg); }
    .soap-block--2 { width: 120px; height: 65px; background: #d4a373; top: 30px; left: 40px; transform: rotate(3deg); }
    .soap-block--3 { width: 110px; height: 60px; background: #c1633a; top: 5px; left: 55px; transform: rotate(-2deg); }

    /* ── Features strip ─────────────────────────────────────── */
    .features {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 2rem; padding: 3rem 1rem;
    }
    .feature {
      text-align: center; padding: 2rem 1.5rem;
      background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px;
    }
    .feature__icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
    .feature h3 { font-size: 1.1rem; margin-bottom: .5rem; }
    .feature p { font-size: .9rem; color: #7a6f5e; }

    /* ── Top Rated ───────────────────────────────────────────── */
    .top-rated { padding: 3rem 0; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
    .section-header__link { color: #c1633a; font-weight: 600; font-size: .95rem; }
    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .skeleton-card {
      height: 320px; border-radius: 12px;
      background: linear-gradient(90deg, #f5ede0 25%, #fdf6ec 50%, #f5ede0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── CTA Banner ─────────────────────────────────────────── */
    .cta-banner {
      background: linear-gradient(135deg, #c1633a, #e8956d);
      color: #fff; text-align: center; padding: 4rem 0;
      .container { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
      h2 { color: #fff; }
      p { opacity: .9; font-size: 1.05rem; }
      .btn-primary { background: #fff; color: #c1633a; &:hover { background: #fdf6ec; } }
    }
  `],
})
export class HomeComponent implements OnInit {
  private title = inject(Title);
  private meta = inject(Meta);
  private authFacade = inject(AuthFacade);
  recipeFacade = inject(RecipeFacade);
  subscriptionFacade = inject(SubscriptionFacade);

  ngOnInit() {
    this.title.setTitle('The Soap Maker — Craft Beautiful Soap. Share the Art.');
    this.meta.updateTag({ name: 'description', content: 'Discover handcrafted soap recipes, connect with fellow soap makers, and take your craft to the next level.' });
    this.meta.updateTag({ property: 'og:title', content: 'The Soap Maker' });
    this.meta.updateTag({ property: 'og:description', content: 'Community-driven platform for homemade soap crafting enthusiasts.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://thesoapmaker.com' });

    this.recipeFacade.loadRecipes();

    // Only fetch subscription status for logged-in users
    if (this.authFacade.isAuthenticated()) {
      this.subscriptionFacade.loadStatus();
    }
  }
}
