import { Injectable, inject } from '@angular/core';
import { UserService } from '../core/services/user.service';
import { AuthStore } from '../core/store/auth.store';
import { User } from '../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private userService = inject(UserService);
  private authStore = inject(AuthStore);

  readonly currentUser = this.authStore.currentUser;

  updateProfile(data: Partial<User>): void {
    this.userService.updateProfile(data).subscribe({
      next: (user) => this.authStore.setCurrentUser(user),
    });
  }
}
