import { Component, OnInit, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { CommentFacade } from '../../../abstraction/comment.facade';
import { RatingFacade } from '../../../abstraction/rating.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { CommentThreadComponent } from '../../../shared/components/comment-thread/comment-thread.component';
import { AdBannerComponent } from '../../../shared/components/ad-banner/ad-banner.component';
import { CureTimePipe } from '../../../shared/pipes/cure-time.pipe';
import { LyeCalculatorPipe } from '../../../shared/pipes/lye-calculator.pipe';
import { LyeCalculatorComponent } from '../../../shared/components/lye-calculator/lye-calculator.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, StarRatingComponent, CommentThreadComponent, AdBannerComponent, CureTimePipe, LyeCalculatorPipe, LyeCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recipeFacade.loading()) {
      <div class="container" style="padding:4rem 0; text-align:center; color:#7a6f5e;">Loading recipe…</div>
    } @else if (recipeFacade.error()) {
      <div class="container error-state">
        <div class="error-card">
          <h2>🧼 Recipe Not Found</h2>
          <p>{{ recipeFacade.error() }}</p>
          <a routerLink="/recipes" class="btn-primary">← Back to Recipes</a>
        </div>
      </div>
    } @else if (recipeFacade.selectedRecipe(); as recipe) {
      <article class="recipe-detail">
        <!-- Hero image -->
        <div class="recipe-hero">
          <img [src]="recipe.imageUrl || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200'" [alt]="recipe.name" class="recipe-hero__img" loading="eager" />
          <div class="recipe-hero__overlay"></div>
          <div class="recipe-hero__content container">
            <div class="recipe-hero__badges">
              <span class="badge badge-method">{{ recipe.method.replace('_',' ') }}</span>
              <span class="badge badge-difficulty-{{ recipe.difficulty }}">{{ recipe.difficulty }}</span>
            </div>
            <h1 class="recipe-hero__title">{{ recipe.name }}</h1>
            <div class="recipe-hero__meta">
              <img [src]="recipe.authorAvatar || 'https://i.pravatar.cc/40'" [alt]="recipe.authorName" class="recipe-hero__avatar" loading="lazy" />
              <span>by <strong>{{ recipe.authorName }}</strong></span>
              <app-star-rating [rating]="recipe.averageRating" [ratingCount]="recipe.ratingCount" [showCount]="true" />
            </div>
          </div>
        </div>

        <div class="recipe-detail__body container">
          <div class="recipe-detail__main">
            <!-- Stats bar -->
            <div class="stats-bar">
              <div class="stat">
                <span class="stat__label">Cure Time</span>
                <span class="stat__value">{{ recipe.cureTimeDays | cureTime }}</span>
              </div>
              <div class="stat">
                <span class="stat__label">Batch Size</span>
                <span class="stat__value">{{ recipe.batchSizeGrams }}g</span>
              </div>
              <div class="stat">
                <span class="stat__label">Yield</span>
                <span class="stat__value">{{ recipe.yieldBars }} bars</span>
              </div>
              <div class="stat">
                <span class="stat__label">Difficulty</span>
                <span class="stat__value">{{ recipe.difficulty | titlecase }}</span>
              </div>
            </div>

            <p class="recipe-detail__description">{{ recipe.description }}</p>

            <!-- Tags -->
            @if (recipe.tags.length) {
              <div class="tags">
                @for (tag of recipe.tags; track tag.id) {
                  <span class="tag-chip">{{ tag.name }}</span>
                }
              </div>
            }

            <!-- Ingredients table -->
            @if (recipe.ingredients?.length) {
              <section class="section">
                <h2>Ingredients</h2>
                <table class="ingredients-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Category</th>
                      <th>Amount (g)</th>
                      <th>%</th>
                      <th>Lye (NaOH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ri of recipe.ingredients; track ri.ingredient.id) {
                      <tr>
                        <td>{{ ri.ingredient.name }}</td>
                        <td><span class="badge badge-method" style="font-size:.7rem">{{ ri.ingredient.category }}</span></td>
                        <td>{{ ri.amountGrams }}</td>
                        <td>{{ ri.percentage ?? '—' }}%</td>
                        <td>
                          @if (ri.ingredient.saponificationValue) {
                            {{ ri.amountGrams | lyeCalculator: ri.ingredient.saponificationValue : 5 }}g
                          } @else {
                            —
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </section>
            }

            <!-- Steps -->
            @if (recipe.steps?.length) {
              <section class="section">
                <h2>Method</h2>
                <ol class="steps-list">
                  @for (step of recipe.steps; track step.id) {
                    <li class="step">
                      <div class="step__number">{{ step.order }}</div>
                      <div class="step__content">
                        <p>{{ step.instruction }}</p>
                        @if (step.durationMinutes) {
                          <span class="step__duration">⏱ {{ step.durationMinutes }} min</span>
                        }
                      </div>
                    </li>
                  }
                </ol>
              </section>
            }

            <!-- Rate this recipe -->
            <section class="section rate-section">
              <h2>Rate This Recipe</h2>
              <p class="rate-section__sub">
                {{ authFacade.isAuthenticated() ? 'Share your experience with this recipe' : 'Log in to rate this recipe' }}
              </p>
              <app-star-rating
                [rating]="recipe.averageRating"
                [userRating]="ratingFacade.getUserRating(recipe.slug)()"
                [interactive]="true"
                [isAuthenticated]="authFacade.isAuthenticated()"
                [showCount]="false"
                (ratingChange)="onRate($event, recipe.slug)"
              />
            </section>

            <!-- Lye Calculator (Premium) -->
            @if (subscriptionFacade.isPremium()) {
              <section class="section">
                <h2>Lye Calculator</h2>
                <app-lye-calculator [ingredients]="recipe.ingredients" />
              </section>
            }

            <!-- Ad banner -->
            <app-ad-banner />

            <!-- Comments -->
            <section class="section">
              @defer (on viewport) {
                <app-comment-thread [slug]="recipe.slug" />
              } @placeholder {
                <div style="height:200px;display:flex;align-items:center;justify-content:center;color:#7a6f5e;">Loading comments…</div>
              }
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="recipe-detail__sidebar">
            <div class="sidebar-card">
              <h3>Quick Facts</h3>
              <dl class="quick-facts">
                <dt>Method</dt><dd>{{ recipe.method.replace('_',' ') }}</dd>
                <dt>Difficulty</dt><dd>{{ recipe.difficulty }}</dd>
                <dt>Cure Time</dt><dd>{{ recipe.cureTimeDays | cureTime }}</dd>
                <dt>Batch</dt><dd>{{ recipe.batchSizeGrams }}g → {{ recipe.yieldBars }} bars</dd>
                <dt>Rating</dt><dd>{{ recipe.averageRating }}/5 ({{ recipe.ratingCount }} ratings)</dd>
              </dl>
            </div>
            @if (authFacade.currentUser()?.id === recipe.authorId) {
              <a [routerLink]="['/recipes', recipe.slug, 'edit']" class="sidebar-edit-btn">✏️ Edit Recipe</a>
            }
            <a routerLink="/recipes" class="sidebar-back">← Back to Recipes</a>
          </aside>
        </div>
      </article>
    }
  `,
  styles: [`
    .recipe-hero { position: relative; height: 380px; overflow: hidden; }
    .recipe-hero__img { width: 100%; height: 100%; object-fit: cover; }
    .recipe-hero__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.7), rgba(0,0,0,.1)); }
    .recipe-hero__content { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); color: #fff; width: 100%; }
    .recipe-hero__badges { display: flex; gap: .5rem; margin-bottom: .75rem; }
    .recipe-hero__title { font-size: clamp(1.75rem,3vw,2.5rem); color: #fff; margin-bottom: .75rem; }
    .recipe-hero__meta { display: flex; align-items: center; gap: .75rem; }
    .recipe-hero__avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255,255,255,.5); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .75rem; font-weight: 600; text-transform: uppercase; }
    .badge-method { background: rgba(237,224,211,.9); color: #c1633a; }
    .badge-difficulty-beginner { background: rgba(212,230,211,.9); color: #2a6e3a; }
    .badge-difficulty-intermediate { background: rgba(253,240,213,.9); color: #8a5e00; }
    .badge-difficulty-advanced { background: rgba(253,232,232,.9); color: #8b1a1a; }

    .error-state { padding: 4rem 1rem; display: flex; justify-content: center; }
    .error-card { text-align: center; background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px; padding: 3rem 2rem; max-width: 400px; width: 100%; h2 { margin-bottom: 1rem; } p { color: #7a6f5e; margin-bottom: 1.5rem; } }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: #a0512e; } }

    .recipe-detail__body { display: grid; grid-template-columns: 1fr; gap: 2.5rem; padding: 2.5rem 1rem;
      @media(min-width:960px) { grid-template-columns: 1fr 260px; } }

    .stats-bar { display: flex; gap: 1.5rem; flex-wrap: wrap; padding: 1.25rem; background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 10px; margin-bottom: 1.5rem; }
    .stat { display: flex; flex-direction: column; }
    .stat__label { font-size: .75rem; font-weight: 600; text-transform: uppercase; color: #7a6f5e; letter-spacing: .04em; }
    .stat__value { font-size: 1.1rem; font-weight: 700; color: #1a1208; }

    .recipe-detail__description { font-size: 1.05rem; color: #4a4035; line-height: 1.7; margin-bottom: 1.5rem; }
    .tags { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 2rem; }
    .tag-chip { padding: .25rem .75rem; background: #f5ede0; border-radius: 20px; font-size: .8rem; color: #7a6f5e; }

    .section { margin-bottom: 2.5rem; h2 { font-size: 1.4rem; margin-bottom: 1.25rem; padding-bottom: .625rem; border-bottom: 2px solid #e5d9ca; } }

    .ingredients-table { width: 100%; border-collapse: collapse; font-size: .9rem;
      th { text-align: left; padding: .5rem .75rem; background: #f5ede0; font-size: .8rem; color: #7a6f5e; text-transform: uppercase; }
      td { padding: .625rem .75rem; border-bottom: 1px solid #e5d9ca; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fff9f3; }
    }

    .steps-list { list-style: none; display: flex; flex-direction: column; gap: 1.25rem; }
    .step { display: flex; gap: 1rem; align-items: flex-start; }
    .step__number { width: 36px; height: 36px; border-radius: 50%; background: #c1633a; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .95rem; }
    .step__content p { line-height: 1.6; }
    .step__duration { font-size: .8rem; color: #7a6f5e; margin-top: .25rem; display: block; }

    .rate-section { padding: 1.5rem; background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 10px; text-align: center; }
    .rate-section__sub { color: #7a6f5e; font-size: .9rem; margin-bottom: 1rem; }

    .sidebar-card { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; h3 { font-size: 1rem; margin-bottom: 1rem; } }
    .quick-facts { display: grid; grid-template-columns: auto 1fr; gap: .375rem .75rem; font-size: .9rem;
      dt { color: #7a6f5e; font-weight: 600; } dd { color: #2d2416; margin: 0; } }
    .sidebar-edit-btn { display: block; text-align: center; padding: .625rem 1rem; background: #fdf0d5; color: #8a5e00; border-radius: 8px; font-weight: 600; text-decoration: none; margin-bottom: .75rem; &:hover { background: #fce5b0; } }
    .sidebar-back { color: #c1633a; font-size: .9rem; font-weight: 600; }

    :host { display: block; }
  `],
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private meta = inject(Meta);
  private analytics = inject(AnalyticsService);
  recipeFacade = inject(RecipeFacade);
  commentFacade = inject(CommentFacade);
  ratingFacade = inject(RatingFacade);
  authFacade = inject(AuthFacade);
  subscriptionFacade = inject(SubscriptionFacade);

  private readonly _seoEffect = effect(() => {
    const recipe = this.recipeFacade.selectedRecipe();
    if (recipe) {
      this.title.setTitle(`${recipe.name} — The Soap Maker`);
      this.meta.updateTag({ name: 'description', content: recipe.description.slice(0, 160) });
      this.meta.updateTag({ property: 'og:title', content: recipe.name });
      this.meta.updateTag({ property: 'og:description', content: recipe.description.slice(0, 160) });
      this.meta.updateTag({ property: 'og:image', content: recipe.imageUrl || '' });
      this.meta.updateTag({ property: 'og:url', content: `https://thesoapmaker.com/recipes/${recipe.slug}` });
      this.analytics.trackRecipeView(recipe.slug, recipe.method);
    }
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'] ?? '';
      this.recipeFacade.loadRecipeBySlug(slug);
    });
  }

  onRate(stars: number, slug: string): void {
    this.ratingFacade.submitRating(slug, stars);
    this.analytics.trackRatingSubmitted(stars);
  }
}
