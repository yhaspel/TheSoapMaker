import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { RecipeCardComponent } from '../../../shared/components/recipe-card/recipe-card.component';
import { AdBannerComponent } from '../../../shared/components/ad-banner/ad-banner.component';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [FormsModule, RouterLink, RecipeCardComponent, AdBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="recipe-list-page">
      <div class="container">
        <!-- Page header -->
        <div class="page-header">
          <div>
            <h1>Recipes</h1>
            <p class="page-header__sub">Discover {{ recipeFacade.totalCount() || recipeFacade.filteredRecipes().length }} handcrafted soap recipes</p>
          </div>
          @if (authFacade.isAuthenticated()) {
            <a routerLink="/recipes/new" class="btn-primary">+ New Recipe</a>
          }
        </div>

        <div class="recipe-list-layout">
          <!-- Sidebar filters -->
          <aside class="filters" aria-label="Filter recipes">
            <h2 class="filters__title">Filter</h2>

            <div class="filter-group">
              <label for="search">Search</label>
              <input id="search" type="search" [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
                placeholder="Search recipes…" aria-label="Search recipes" />
            </div>

            <div class="filter-group">
              <label for="method">Method</label>
              <select id="method" [(ngModel)]="selectedMethod" (ngModelChange)="onMethodChange($event)">
                <option value="">All Methods</option>
                <option value="cold_process">Cold Process</option>
                <option value="hot_process">Hot Process</option>
                <option value="melt_and_pour">Melt & Pour</option>
                <option value="liquid">Liquid</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="difficulty">Difficulty</label>
              <select id="difficulty" [(ngModel)]="selectedDifficulty" (ngModelChange)="onDifficultyChange($event)">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Popular Tags</label>
              <div class="tag-cloud">
                @for (tag of popularTags; track tag) {
                  <button class="tag-btn" [class.tag-btn--active]="activeTag() === tag"
                    (click)="toggleTag(tag)">{{ tag }}</button>
                }
              </div>
            </div>

            <button class="clear-btn" (click)="clearFilters()">Clear Filters</button>

            <!-- Advanced Filters (Premium) -->
            <div class="filter-group advanced-filters" [class.advanced-filters--locked]="!subscriptionFacade.isPremium()">
              <div class="advanced-filters__header">
                <label>Advanced Filters</label>
                @if (!subscriptionFacade.isPremium()) {
                  <span class="premium-lock" title="Upgrade to Premium to use advanced filters">🔒 Premium</span>
                }
              </div>
              <div class="filter-pair">
                <input type="number" [(ngModel)]="cureTimeMin" placeholder="Min cure days"
                  [disabled]="!subscriptionFacade.isPremium()" (change)="onAdvancedFilter()" />
                <input type="number" [(ngModel)]="cureTimeMax" placeholder="Max cure days"
                  [disabled]="!subscriptionFacade.isPremium()" (change)="onAdvancedFilter()" />
              </div>
              <div class="filter-pair">
                <input type="number" [(ngModel)]="batchSizeMin" placeholder="Min batch (g)"
                  [disabled]="!subscriptionFacade.isPremium()" (change)="onAdvancedFilter()" />
                <input type="number" [(ngModel)]="batchSizeMax" placeholder="Max batch (g)"
                  [disabled]="!subscriptionFacade.isPremium()" (change)="onAdvancedFilter()" />
              </div>
            </div>
          </aside>

          <!-- Recipe grid -->
          <main class="recipe-grid-area">
            <div class="sort-bar">
              <span class="sort-bar__count">{{ recipeFacade.totalCount() || recipeFacade.filteredRecipes().length }} recipes</span>
              <select [(ngModel)]="sortOrder" (ngModelChange)="onSortChange($event)" aria-label="Sort by">
                <option value="-average_rating">Top Rated</option>
                <option value="-created_at">Newest</option>
                <option value="cure_time_days">Shortest Cure</option>
              </select>
            </div>

            @if (recipeFacade.loading()) {
              <div class="recipes-grid">
                @for (n of [1,2,3,4,5,6]; track n) {
                  <div class="skeleton-card"></div>
                }
              </div>
            } @else if (recipeFacade.filteredRecipes().length === 0) {
              <div class="empty-state">
                <p>🧼 No recipes found. Be the first to contribute!</p>
                @if (authFacade.isAuthenticated()) {
                  <a routerLink="/recipes/new" class="btn-primary">Create a Recipe</a>
                } @else {
                  <button class="btn-secondary" (click)="clearFilters()">Clear Filters</button>
                }
              </div>
            } @else {
              <div class="recipes-grid">
                @for (recipe of recipeFacade.filteredRecipes(); track recipe.id) {
                  <app-recipe-card [recipe]="recipe" />
                }
              </div>

              <!-- Ad Banner between results and pagination -->
              <div style="margin: 2rem 0;"><app-ad-banner /></div>

              <!-- Pagination -->
              <div class="pagination">
                <button class="pagination__btn" [disabled]="!recipeFacade.hasPrevPage()" (click)="recipeFacade.loadPrevPage()">‹ Prev</button>
                <span class="pagination__info">Page {{ recipeFacade.currentPage() }} of {{ recipeFacade.totalPages() }}</span>
                <button class="pagination__btn" [disabled]="!recipeFacade.hasNextPage()" (click)="recipeFacade.loadNextPage()">Next ›</button>
              </div>
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recipe-list-page { padding: 2rem 0 4rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header__sub { color: #7a6f5e; margin-top: .25rem; }
    h1 { font-size: 2rem; }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; &:hover { background: #a0512e; text-decoration: none; } }
    .btn-secondary { padding: .5rem 1.25rem; border: 2px solid #c1633a; color: #c1633a; border-radius: 8px; font-weight: 600; cursor: pointer; background: none; &:hover { background: rgba(193,99,58,.06); } }

    .recipe-list-layout {
      display: grid; grid-template-columns: 1fr;
      gap: 2rem;
      @media(min-width: 768px) { grid-template-columns: 240px 1fr; }
    }

    .filters {
      background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px;
      padding: 1.5rem; height: fit-content; position: sticky; top: 80px;
    }
    .filters__title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: .05em; color: #7a6f5e; }
    .filter-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: .375rem; }
    label { font-size: .8rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; }
    input, select {
      padding: .5rem .75rem; border: 1px solid #e5d9ca; border-radius: 6px;
      font-size: .9rem; background: #fdf6ec; color: #2d2416;
      &:focus { outline: none; border-color: #c1633a; }
    }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: .375rem; }
    .tag-btn {
      padding: .25rem .625rem; border: 1px solid #e5d9ca; border-radius: 20px;
      font-size: .78rem; background: #fdf6ec; color: #7a6f5e; cursor: pointer;
      transition: all .15s;
      &--active, &:hover { background: #c1633a; color: #fff; border-color: #c1633a; }
    }
    .clear-btn {
      width: 100%; padding: .5rem; border: none; background: none;
      color: #c1633a; font-size: .875rem; font-weight: 600; cursor: pointer;
      &:hover { text-decoration: underline; }
    }
    .advanced-filters { margin-top: .5rem; }
    .advanced-filters__header { display: flex; align-items: center; justify-content: space-between; }
    .advanced-filters--locked { opacity: .7; }
    .premium-lock { font-size: .7rem; background: #fdf0d5; color: #8a5e00; padding: 2px 6px; border-radius: 10px; font-weight: 700; }
    .filter-pair { display: flex; gap: .5rem; input { flex: 1; padding: .375rem .5rem; min-width: 0; font-size: .8rem; } }

    .recipe-grid-area {}
    .sort-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .sort-bar__count { font-size: .9rem; color: #7a6f5e; }
    .sort-bar select { width: auto; padding: .375rem .625rem; font-size: .875rem; }
    .recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .skeleton-card { height: 300px; border-radius: 12px; background: linear-gradient(90deg, #f5ede0 25%, #fdf6ec 50%, #f5ede0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 4rem 2rem; color: #7a6f5e; p { font-size: 1.1rem; margin-bottom: 1rem; } display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
    .pagination__btn { padding: .5rem 1rem; border: 1px solid #e5d9ca; border-radius: 6px; background: #fff9f3; cursor: pointer; &:disabled { opacity: .4; cursor: not-allowed; } }
    .pagination__info { font-size: .9rem; color: #7a6f5e; }
  `],
})
export class RecipeListComponent implements OnInit, OnDestroy {
  private title = inject(Title);
  private meta = inject(Meta);
  recipeFacade = inject(RecipeFacade);
  authFacade = inject(AuthFacade);
  subscriptionFacade = inject(SubscriptionFacade);

  searchQuery = '';
  selectedMethod = '';
  selectedDifficulty = '';
  sortOrder = '-created_at';
  activeTag = signal<string | null>(null);

  cureTimeMin = '';
  cureTimeMax = '';
  batchSizeMin = '';
  batchSizeMax = '';

  popularTags = ['lavender', 'citrus', 'charcoal', 'moisturising', 'exfoliating', 'sensitive', 'floral'];

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  ngOnInit(): void {
    this.title.setTitle('Recipes — The Soap Maker');
    this.meta.updateTag({ name: 'description', content: 'Browse hundreds of handcrafted soap recipes. Filter by method, difficulty, ingredients and more.' });
    this.meta.updateTag({ property: 'og:title', content: 'Soap Recipes — The Soap Maker' });
    this.meta.updateTag({ property: 'og:url', content: 'https://thesoapmaker.com/recipes' });

    this.recipeFacade.loadRecipes({ ordering: this.sortOrder });

    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe(q => this.recipeFacade.setSearchQuery(q)),
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  onSearch(q: string): void { this.searchSubject.next(q); }
  onMethodChange(m: string): void { this.recipeFacade.setMethod(m || null); }
  onDifficultyChange(d: string): void { this.recipeFacade.setDifficulty(d || null); }
  onSortChange(o: string): void { this.recipeFacade.setOrdering(o); }

  toggleTag(tag: string): void {
    const next = this.activeTag() === tag ? null : tag;
    this.activeTag.set(next);
    this.recipeFacade.setActiveTag(next);
  }

  onAdvancedFilter(): void {
    if (!this.subscriptionFacade.isPremium()) return;
    const filters: any = { ordering: this.sortOrder };
    if (this.cureTimeMin) filters.cureTimeMin = +this.cureTimeMin;
    if (this.cureTimeMax) filters.cureTimeMax = +this.cureTimeMax;
    if (this.batchSizeMin) filters.batchSizeMin = +this.batchSizeMin;
    if (this.batchSizeMax) filters.batchSizeMax = +this.batchSizeMax;
    this.recipeFacade.loadRecipes(filters);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedMethod = '';
    this.selectedDifficulty = '';
    this.sortOrder = '-created_at';
    this.activeTag.set(null);
    this.cureTimeMin = '';
    this.cureTimeMax = '';
    this.batchSizeMin = '';
    this.batchSizeMax = '';
    this.recipeFacade.loadRecipes({ ordering: '-created_at' });
  }
}
