import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserFacade } from '../../../abstraction/user.facade';
import { SubscriptionFacade } from '../../../abstraction/subscription.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { RecipeCardComponent } from '../../../shared/components/recipe-card/recipe-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, RecipeCardComponent],
  template: `
    <div class="profile-page container">
      <h1>My Profile</h1>

      @if (authFacade.currentUser(); as user) {
        <div class="profile-layout">
          <!-- Left: Avatar + name -->
          <aside class="profile-sidebar">
            <div class="avatar-wrap">
              <img [src]="user.avatarUrl || 'https://i.pravatar.cc/120'" [alt]="user.displayName" class="avatar" />
              <button class="avatar-change-btn" title="Change avatar">📷</button>
            </div>
            <h2 class="profile-name">{{ user.displayName }}</h2>
            <p class="profile-email">{{ user.email }}</p>
            @if (user.isInTrial) {
              <div class="trial-status">
                <span class="trial-badge">Trial</span>
                <span>{{ user.trialDaysRemaining }} days remaining</span>
                <a routerLink="/premium/pricing" class="upgrade-link">Upgrade Now →</a>
              </div>
            } @else if (user.isPremium) {
              <div class="premium-status">
                <span class="premium-badge">⭐ Premium</span>
              </div>
            }
          </aside>

          <!-- Right: Edit form + subscription -->
          <main class="profile-main">
            <section class="profile-card">
              <h3>Edit Profile</h3>
              <div class="form-group">
                <label for="displayName">Display Name</label>
                <input id="displayName" type="text" [(ngModel)]="editName" [placeholder]="user.displayName" />
              </div>
              <div class="form-group">
                <label for="bio">Bio</label>
                <textarea id="bio" [(ngModel)]="editBio" rows="4" [placeholder]="user.bio || 'Tell the community about yourself…'"></textarea>
              </div>
              <button class="btn-primary" (click)="saveProfile()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save Changes' }}
              </button>
            </section>

            <section class="profile-card subscription-card">
              <h3>Subscription</h3>
              @if (subscriptionFacade.isPremium()) {
                <div class="sub-info sub-info--premium">
                  <span class="sub-badge sub-badge--premium">⭐ Premium Active</span>
                  @if (subscriptionFacade.trialActive()) {
                    <p>Trial ends: {{ subscriptionFacade.trialEndsAt() | date:'mediumDate' }}</p>
                  }
                  <button class="btn-secondary btn-sm" (click)="cancelSub()">Cancel Subscription</button>
                </div>
              } @else {
                <div class="sub-info sub-info--free">
                  <p>You're on the <strong>Free plan</strong>. Upgrade to unlock all features.</p>
                  <a routerLink="/premium/pricing" class="btn-primary btn-sm">View Premium Plans →</a>
                </div>
              }
            </section>
          </main>
        </div>

        <!-- My Recipes section -->
        <section class="my-recipes-section">
          <h2>My Recipes</h2>
          @if (userFacade.userRecipes().length === 0) {
            <div class="my-recipes-empty">
              <p>You haven't created any recipes yet.</p>
              <a routerLink="/recipes/new" class="btn-primary">Create Your First Recipe →</a>
            </div>
          } @else {
            <div class="my-recipes-grid">
              @for (recipe of userFacade.userRecipes(); track recipe.id) {
                <app-recipe-card [recipe]="recipe" />
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .profile-page { padding: 2.5rem 0 4rem; }
    h1 { font-size: 2rem; margin-bottom: 2rem; }
    .profile-layout { display: grid; grid-template-columns: 1fr; gap: 2rem; @media(min-width:768px) { grid-template-columns: 260px 1fr; } }
    .profile-sidebar { text-align: center; }
    .avatar-wrap { position: relative; display: inline-block; margin-bottom: 1rem; }
    .avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #e5d9ca; }
    .avatar-change-btn { position: absolute; bottom: 4px; right: 4px; width: 28px; height: 28px; border-radius: 50%; background: #c1633a; color: #fff; border: none; cursor: pointer; font-size: .875rem; display: flex; align-items: center; justify-content: center; }
    .profile-name { font-size: 1.3rem; margin-bottom: .25rem; }
    .profile-email { font-size: .875rem; color: #7a6f5e; margin-bottom: 1rem; }
    .trial-status { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; font-size: .875rem; color: #7a6f5e; }
    .trial-badge { display: inline-block; background: #fdf0d5; color: #8a5e00; border-radius: 20px; padding: 2px 10px; font-size: .75rem; font-weight: 700; }
    .upgrade-link { color: #c1633a; font-weight: 600; font-size: .875rem; }
    .premium-status { display: flex; justify-content: center; }
    .premium-badge { background: linear-gradient(135deg, #c1633a, #e8956d); color: #fff; padding: .375rem 1rem; border-radius: 20px; font-size: .875rem; font-weight: 700; }

    .profile-card { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; h3 { font-size: 1.2rem; margin-bottom: 1.5rem; } }
    .form-group { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: .375rem; }
    label { font-size: .78rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; }
    input, textarea { padding: .625rem .875rem; border: 1px solid #e5d9ca; border-radius: 8px; font-size: .95rem; background: #fdf6ec; color: #2d2416; resize: vertical; &:focus { outline: none; border-color: #c1633a; } }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; &:hover:not(:disabled) { background: #a0512e; } &:disabled { opacity: .6; cursor: not-allowed; } }
    .btn-secondary { padding: .5rem 1.25rem; border: 2px solid #c1633a; color: #c1633a; border-radius: 8px; font-weight: 600; cursor: pointer; background: none; &:hover { background: rgba(193,99,58,.06); } }
    .btn-sm { padding: .375rem .875rem; font-size: .85rem; }
    .sub-info { display: flex; flex-direction: column; gap: .875rem; }
    .sub-badge { display: inline-block; &--premium { background: linear-gradient(135deg, #c1633a, #e8956d); color: #fff; padding: .375rem 1rem; border-radius: 20px; font-weight: 700; font-size: .9rem; } }
    .sub-info--free p { color: #7a6f5e; }

    .my-recipes-section { margin-top: 3rem; h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: .75rem; border-bottom: 2px solid #e5d9ca; } }
    .my-recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .my-recipes-empty { text-align: center; padding: 3rem; background: #fff9f3; border: 1px dashed #e5d9ca; border-radius: 12px; p { color: #7a6f5e; margin-bottom: 1.25rem; } }
  `],
})
export class ProfileComponent implements OnInit {
  authFacade = inject(AuthFacade);
  userFacade = inject(UserFacade);
  subscriptionFacade = inject(SubscriptionFacade);

  editName = '';
  editBio = '';
  saving = signal(false);

  ngOnInit() {
    this.userFacade.loadProfile();
    this.userFacade.loadUserRecipes();
    this.subscriptionFacade.loadStatus();
    const user = this.authFacade.currentUser();
    if (user) { this.editName = user.displayName; this.editBio = user.bio; }
  }

  saveProfile() {
    this.saving.set(true);
    this.userFacade.updateProfile({ displayName: this.editName, bio: this.editBio });
    setTimeout(() => this.saving.set(false), 500);
  }

  cancelSub() {
    if (confirm('Cancel your subscription?')) {
      this.subscriptionFacade.cancelSubscription();
    }
  }
}
