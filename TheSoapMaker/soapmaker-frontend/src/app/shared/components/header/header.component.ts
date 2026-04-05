import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthFacade } from '../../../abstraction/auth.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header__inner container">
        <a routerLink="/" class="header__logo">🧼 The Soap Maker</a>

        <nav class="header__nav" aria-label="Main navigation">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
          <a routerLink="/recipes" routerLinkActive="active">Recipes</a>
          @if (facade.isAuthenticated()) {
            <a routerLink="/recipes/my-recipes" routerLinkActive="active">My Recipes</a>
          }
          <a routerLink="/calculator" routerLinkActive="active">Lye Calculator</a>
          <a routerLink="/premium/pricing" routerLinkActive="active">Pricing</a>
        </nav>

        <div class="header__user">
          @if (facade.isAuthenticated()) {
            <button class="header__avatar-btn" (click)="toggleMenu()" aria-haspopup="true" [attr.aria-expanded]="menuOpen()">
              @if (facade.currentUser()?.avatarUrl) {
                <img
                  [src]="facade.currentUser()!.avatarUrl"
                  [alt]="facade.currentUser()?.displayName || 'User'"
                  class="header__avatar"
                  width="36" height="36"
                  loading="lazy"
                />
              } @else {
                <span class="header__avatar header__avatar--initials" aria-hidden="true">
                  {{ headerInitials() }}
                </span>
              }
              <span class="header__name">{{ facade.currentUser()?.displayName || 'Account' }}</span>
            </button>
            @if (menuOpen()) {
              <div class="header__dropdown" role="menu">
                <a routerLink="/auth/profile" role="menuitem" (click)="closeMenu()">Profile</a>
                <hr />
                <button role="menuitem" (click)="logout()">Sign Out</button>
              </div>
            }
          } @else {
            <a routerLink="/auth/login" class="btn-outline-sm">Sign In</a>
            <a routerLink="/auth/register" class="btn-primary-sm">Get Started</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed; top: 0; left: 0; right: 0;
      height: 64px; background: #fff9f3;
      border-bottom: 1px solid #e5d9ca;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      z-index: 1000;
    }
    .header__inner {
      height: 100%; display: flex; align-items: center; gap: 2rem;
    }
    .header__logo {
      font-size: 1.2rem; font-weight: 700;
      color: #c1633a; text-decoration: none;
      white-space: nowrap;
    }
    .header__nav {
      display: flex; gap: 1.5rem; align-items: center; flex: 1;
      a {
        color: #7a6f5e; font-size: .925rem; font-weight: 500;
        text-decoration: none; padding: .25rem 0;
        border-bottom: 2px solid transparent;
        transition: color .15s, border-color .15s;
        &:hover, &.active { color: #c1633a; border-bottom-color: #c1633a; }
      }
    }
    .header__user { position: relative; display: flex; align-items: center; gap: .75rem; }
    .header__avatar-btn {
      display: flex; align-items: center; gap: .5rem;
      background: none; border: none; cursor: pointer;
      padding: .25rem .5rem; border-radius: 20px;
      transition: background .15s;
      &:hover { background: #f5ede0; }
    }
    .header__avatar {
      border-radius: 50%; object-fit: cover;
      &--initials {
        display: inline-flex; align-items: center; justify-content: center;
        width: 36px; height: 36px;
        background: #c1633a; color: #fff;
        font-size: .75rem; font-weight: 700;
        border-radius: 50%; flex-shrink: 0;
      }
    }
    .header__name { font-size: .875rem; font-weight: 600; color: #2d2416; }
    .header__dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff9f3; border: 1px solid #e5d9ca;
      border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
      min-width: 160px; overflow: hidden; z-index: 100;
      a, button {
        display: block; width: 100%; text-align: left;
        padding: .625rem 1rem; font-size: .9rem;
        color: #2d2416; background: none; border: none;
        cursor: pointer; text-decoration: none;
        &:hover { background: #f5ede0; }
      }
      hr { border: none; border-top: 1px solid #e5d9ca; }
    }
    .btn-primary-sm {
      padding: .375rem .875rem; background: #c1633a; color: #fff;
      border-radius: 6px; font-size: .85rem; font-weight: 600;
      text-decoration: none; transition: background .15s;
      &:hover { background: #a0512e; }
    }
    .btn-outline-sm {
      padding: .375rem .875rem; border: 1.5px solid #c1633a;
      color: #c1633a; border-radius: 6px; font-size: .85rem; font-weight: 600;
      text-decoration: none; transition: background .15s;
      &:hover { background: rgba(193,99,58,.06); }
    }
  `],
})
export class HeaderComponent {
  facade = inject(AuthFacade);
  menuOpen = signal(false);

  headerInitials(): string {
    const name = this.facade.currentUser()?.displayName ?? '';
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }
  logout() { this.closeMenu(); this.facade.logout(); }
}
