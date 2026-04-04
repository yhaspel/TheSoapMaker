import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UiStore } from '../store/ui.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const uiStore = inject(UiStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.error?.detail ?? error.message ?? 'An unexpected error occurred';
      uiStore.addToast(message, 'error');
      return throwError(() => error);
    })
  );
};
