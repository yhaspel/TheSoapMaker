import { Injectable, inject } from '@angular/core';
import { UserService } from '../core/services/user.service';
import { RecipeService } from '../core/services/recipe.service';
import { AuthStore } from '../core/store/auth.store';
import { RecipeStore } from '../core/store/recipe.store';
import { UiStore } from '../core/store/ui.store';
import { User } from '../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private userService = inject(UserService);
  private recipeService = inject(RecipeService);
  private authStore = inject(AuthStore);
  private recipeStore = inject(RecipeStore);
  private uiStore = inject(UiStore);

  readonly currentUser = this.authStore.currentUser;
  readonly userRecipes = this.recipeStore.myRecipes;

  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (user) => this.authStore.setCurrentUser(user),
    });
  }

  updateProfile(data: Partial<User>): void {
    this.userService.updateProfile(data).subscribe({
      next: (user) => {
        this.authStore.setCurrentUser(user);
        this.uiStore.addToast('Profile updated successfully.', 'success');
      },
      error: () => {
        this.uiStore.addToast('Failed to update profile. Please try again.', 'error');
      },
    });
  }

  loadUserRecipes(): void {
    this.recipeService.getMyRecipes().subscribe({
      next: (recipes) => this.recipeStore.setMyRecipes(recipes),
      error: () => this.uiStore.addToast('Failed to load recipes', 'error'),
    });
  }
}
