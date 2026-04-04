import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthStore } from '../store/auth.store';
import { AuthService } from '../services/auth.service';
import { UiStore } from '../store/ui.store';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: AuthStore;
  let uiStore: UiStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        AuthService,
        UiStore,
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    uiStore = TestBed.inject(UiStore);
    router = TestBed.inject(Router);

    // Reset module-level state between tests
    localStorage.setItem('sm_refresh', 'valid-refresh-token');
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('sm_refresh');
  });

  it('Test 6 — 401 triggers refresh and retries original request', fakeAsync(() => {
    let responseData: unknown;
    http.get('/api/protected').subscribe(r => (responseData = r));

    // First request gets a 401
    const first = httpTesting.expectOne('/api/protected');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();

    // Interceptor calls token refresh
    const refreshReq = httpTesting.expectOne(
      req => req.url.includes('/token/refresh'),
    );
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({ access: 'new-access-token' });
    tick();

    // Original request is retried with new token
    const retry = httpTesting.expectOne('/api/protected');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retry.flush({ data: 'success' });
    tick();

    expect(responseData).toEqual({ data: 'success' });
  }));

  it('Test 7 — refresh fails: user logged out and redirected to /auth/login', fakeAsync(() => {
    spyOn(router, 'navigate');
    let errored = false;

    http.get('/api/protected').subscribe({ error: () => (errored = true) });

    // First request gets a 401
    const first = httpTesting.expectOne('/api/protected');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();

    // Refresh call also fails
    const refreshReq = httpTesting.expectOne(
      req => req.url.includes('/token/refresh'),
    );
    refreshReq.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(errored).toBeTrue();
    expect(authStore.currentUser()).toBeNull();
    expect(localStorage.getItem('sm_refresh')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));
});
