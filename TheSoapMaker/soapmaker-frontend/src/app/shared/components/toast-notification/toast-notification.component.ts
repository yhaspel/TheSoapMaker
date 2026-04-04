import { Component, inject } from '@angular/core';
import { UiStore } from '../../../core/store/ui.store';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of uiStore.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="alert">
          <span>{{ toast.message }}</span>
          <button class="toast__close" (click)="uiStore.removeToast(toast.id)" aria-label="Dismiss">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      display: flex; flex-direction: column; gap: .75rem;
      z-index: 10000; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; justify-content: space-between; gap: .75rem;
      padding: .875rem 1rem;
      border-radius: 8px;
      font-size: .9rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      animation: slideIn .25s ease;
      color: #fff;
    }
    .toast--success { background: #2d6e4a; }
    .toast--error   { background: #b83232; }
    .toast--info    { background: #2a6a9e; }
    .toast__close {
      background: none; border: none; color: rgba(255,255,255,.8);
      cursor: pointer; font-size: 1rem; padding: 0; line-height: 1;
      &:hover { color: #fff; }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
  `],
})
export class ToastNotificationComponent {
  uiStore = inject(UiStore);
}
