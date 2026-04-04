import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UiStore } from './ui.store';

describe('UiStore', () => {
  let store: UiStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UiStore],
    });
    store = TestBed.inject(UiStore);
  });

  describe('globalLoading', () => {
    it('should start as false', () => {
      expect(store.globalLoading()).toBe(false);
    });

    it('should update via setGlobalLoading', () => {
      store.setGlobalLoading(true);
      expect(store.globalLoading()).toBe(true);
      store.setGlobalLoading(false);
      expect(store.globalLoading()).toBe(false);
    });
  });

  describe('toasts', () => {
    it('should start as empty array', () => {
      expect(store.toasts().length).toBe(0);
    });

    describe('addToast', () => {
      it('should add a toast with correct message and type', () => {
        store.addToast('Test message', 'success');
        const toasts = store.toasts();
        expect(toasts.length).toBe(1);
        expect(toasts[0].message).toBe('Test message');
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].id).toBeDefined();
      });

      it('should auto-remove after 4000ms', fakeAsync(() => {
        store.addToast('Auto remove test', 'info');
        expect(store.toasts().length).toBe(1);
        tick(4000);
        expect(store.toasts().length).toBe(0);
      }));

      it('should allow multiple toasts to stack', () => {
        store.addToast('Toast 1', 'success');
        store.addToast('Toast 2', 'error');
        store.addToast('Toast 3', 'info');
        expect(store.toasts().length).toBe(3);
        expect(store.toasts()[0].message).toBe('Toast 1');
        expect(store.toasts()[1].message).toBe('Toast 2');
        expect(store.toasts()[2].message).toBe('Toast 3');
      });

      it('should create unique ids for each toast', () => {
        store.addToast('Toast A', 'success');
        store.addToast('Toast B', 'error');
        const toasts = store.toasts();
        expect(toasts[0].id).not.toBe(toasts[1].id);
      });
    });

    describe('removeToast', () => {
      it('should remove a specific toast by id', () => {
        store.addToast('Toast 1', 'success');
        store.addToast('Toast 2', 'error');
        store.addToast('Toast 3', 'info');
        const toastId = store.toasts()[1].id;
        store.removeToast(toastId);
        const remaining = store.toasts();
        expect(remaining.length).toBe(2);
        expect(remaining.find(t => t.id === toastId)).toBeUndefined();
        expect(remaining[0].message).toBe('Toast 1');
        expect(remaining[1].message).toBe('Toast 3');
      });

      it('should not affect other toasts when removing one', () => {
        store.addToast('Keep 1', 'success');
        store.addToast('Remove me', 'error');
        store.addToast('Keep 2', 'info');
        const removeId = store.toasts()[1].id;
        const keep1Id = store.toasts()[0].id;
        const keep2Id = store.toasts()[2].id;
        store.removeToast(removeId);
        const remaining = store.toasts();
        expect(remaining.length).toBe(2);
        expect(remaining[0].id).toBe(keep1Id);
        expect(remaining[1].id).toBe(keep2Id);
      });
    });

    describe('auto-removal with multiple toasts', () => {
      it('should auto-remove only the specified toast after 4000ms', fakeAsync(() => {
        store.addToast('Toast 1', 'success');
        store.addToast('Toast 2', 'error');
        expect(store.toasts().length).toBe(2);
        tick(4000);
        expect(store.toasts().length).toBe(1);
        expect(store.toasts()[0].message).toBe('Toast 2');
        tick(4000);
        expect(store.toasts().length).toBe(0);
      }));
    });
  });

  describe('setModalOpen', () => {
    it('should update the modal open state', () => {
      store.setModalOpen(true);
      expect(store.modalOpen()).toBe(true);
      store.setModalOpen(false);
      expect(store.modalOpen()).toBe(false);
    });
  });
});
