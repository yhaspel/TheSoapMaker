import { Component, inject } from '@angular/core';
import { UiStore } from '../../../core/store/ui.store';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (uiStore.globalLoading()) {
      <div class="spinner-overlay" aria-label="Loading…" role="status">
        <div class="spinner"></div>
      </div>
    }
  `,
  styles: [`
    .spinner-overlay {
      position: fixed; inset: 0;
      background: rgba(253,246,236,.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid #e5d9ca;
      border-top-color: #c1633a;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoadingSpinnerComponent {
  uiStore = inject(UiStore);
}
