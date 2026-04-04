import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class UiStore {
  private _globalLoading = signal(false);
  private _toasts = signal<Toast[]>([]);
  private _modalOpen = signal(false);

  readonly globalLoading = this._globalLoading.asReadonly();
  readonly toasts = this._toasts.asReadonly();
  readonly modalOpen = this._modalOpen.asReadonly();

  setGlobalLoading(v: boolean): void { this._globalLoading.set(v); }
  setModalOpen(v: boolean): void { this._modalOpen.set(v); }

  addToast(message: string, type: Toast['type'] = 'info'): void {
    const id = crypto.randomUUID();
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.removeToast(id), 4000);
  }

  removeToast(id: string): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
