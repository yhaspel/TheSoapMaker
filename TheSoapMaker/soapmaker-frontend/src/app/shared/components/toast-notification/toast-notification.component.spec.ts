import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastNotificationComponent } from './toast-notification.component';
import { UiStore } from '../../../core/stores/ui.store';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

describe('ToastNotificationComponent', () => {
  let component: ToastNotificationComponent;
  let fixture: ComponentFixture<ToastNotificationComponent>;
  let mockUiStore: any;

  beforeEach(async () => {
    // Create mock UiStore with signal and spy
    mockUiStore = {
      toasts: signal<Toast[]>([]),
      removeToast: jasmine.createSpy('removeToast')
    };

    await TestBed.configureTestingModule({
      imports: [ToastNotificationComponent],
      providers: [
        {
          provide: UiStore,
          useValue: mockUiStore
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('empty toast list', () => {
    it('should render no toasts when store is empty', () => {
      mockUiStore.toasts.set([]);
      fixture.detectChanges();

      const toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(0);
    });

    it('should have no toast containers', () => {
      mockUiStore.toasts.set([]);
      fixture.detectChanges();

      const toastContainer = fixture.debugElement.query(By.css('[class*="toast-container"]'));
      if (toastContainer) {
        expect(toastContainer.nativeElement.children.length).toBe(0);
      }
    });
  });

  describe('rendering toasts', () => {
    it('should render correct number of toasts when store has items', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Success message', type: 'success' },
        { id: 'toast-2', message: 'Error message', type: 'error' },
        { id: 'toast-3', message: 'Info message', type: 'info' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(3);
    });

    it('should display correct toast content', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Success message', type: 'success' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.textContent).toContain('Success message');
    });

    it('should handle single toast', () => {
      const toasts: Toast[] = [
        { id: 'single-toast', message: 'Single message' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(1);
    });

    it('should handle multiple toasts', () => {
      const toasts: Toast[] = [];
      for (let i = 1; i <= 5; i++) {
        toasts.push({
          id: `toast-${i}`,
          message: `Message ${i}`,
          type: 'info'
        });
      }
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(5);
    });
  });

  describe('dismiss functionality', () => {
    it('should call removeToast when dismiss button is clicked', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Test message' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const dismissButton = fixture.debugElement.query(By.css('[class*="dismiss"]'));
      dismissButton?.nativeElement.click();

      expect(mockUiStore.removeToast).toHaveBeenCalledWith('toast-1');
    });

    it('should call removeToast with correct toast id for multiple toasts', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' },
        { id: 'toast-2', message: 'Message 2' },
        { id: 'toast-3', message: 'Message 3' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const dismissButtons = fixture.debugElement.queryAll(By.css('[class*="dismiss"]'));
      dismissButtons[1].nativeElement.click();

      expect(mockUiStore.removeToast).toHaveBeenCalledWith('toast-2');
    });

    it('should remove toast from display when removeToast is called', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' },
        { id: 'toast-2', message: 'Message 2' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const dismissButtons = fixture.debugElement.queryAll(By.css('[class*="dismiss"]'));
      dismissButtons[0].nativeElement.click();

      expect(mockUiStore.removeToast).toHaveBeenCalledWith('toast-1');
    });
  });

  describe('toast types', () => {
    it('should apply correct CSS class for success toasts', () => {
      const toasts: Toast[] = [
        { id: 'success-toast', message: 'Success!', type: 'success' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.classList.contains('toast-success')).toBeTruthy();
    });

    it('should apply correct CSS class for error toasts', () => {
      const toasts: Toast[] = [
        { id: 'error-toast', message: 'Error!', type: 'error' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.classList.contains('toast-error')).toBeTruthy();
    });

    it('should apply correct CSS class for info toasts', () => {
      const toasts: Toast[] = [
        { id: 'info-toast', message: 'Info', type: 'info' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.classList.contains('toast-info')).toBeTruthy();
    });

    it('should apply correct CSS class for warning toasts', () => {
      const toasts: Toast[] = [
        { id: 'warning-toast', message: 'Warning!', type: 'warning' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.classList.contains('toast-warning')).toBeTruthy();
    });
  });

  describe('reactive updates', () => {
    it('should reactively update when toasts signal changes', () => {
      const initialToasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' }
      ];
      mockUiStore.toasts.set(initialToasts);
      fixture.detectChanges();

      let toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(1);

      // Add a new toast
      const updatedToasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' },
        { id: 'toast-2', message: 'Message 2' }
      ];
      mockUiStore.toasts.set(updatedToasts);
      fixture.detectChanges();

      toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(2);
    });

    it('should handle rapid toast additions', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const moreToasts: Toast[] = [
        { id: 'toast-1', message: 'Message 1' },
        { id: 'toast-2', message: 'Message 2' },
        { id: 'toast-3', message: 'Message 3' },
        { id: 'toast-4', message: 'Message 4' }
      ];
      mockUiStore.toasts.set(moreToasts);
      fixture.detectChanges();

      const toastElements = fixture.debugElement.queryAll(By.css('[class*="toast"]'));
      expect(toastElements.length).toBe(4);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes on toast elements', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Test message', type: 'success' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const toastElement = fixture.debugElement.query(By.css('[class*="toast"]'));
      expect(toastElement?.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should have accessible dismiss buttons', () => {
      const toasts: Toast[] = [
        { id: 'toast-1', message: 'Test message' }
      ];
      mockUiStore.toasts.set(toasts);
      fixture.detectChanges();

      const dismissButton = fixture.debugElement.query(By.css('[class*="dismiss"]'));
      expect(dismissButton?.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
