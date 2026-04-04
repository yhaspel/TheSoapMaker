import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

const API = 'http://localhost:8811/api/v1';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('Test 1 — login() success: calls POST /auth/login/ and returns tokens', () => {
    const mockResponse = { access: 'acc123', refresh: 'ref456' };
    let result: unknown;

    service.login('user@test.com', 'pass123').subscribe(r => (result = r));

    const req = http.expectOne(`${API}/auth/login/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', password: 'pass123' });
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('Test 2 — login() failure: errors with HTTP 400', () => {
    let errorStatus: number | undefined;

    service.login('bad@test.com', 'wrong').subscribe({
      error: (e) => (errorStatus = e.status),
    });

    const req = http.expectOne(`${API}/auth/login/`);
    req.flush({ non_field_errors: ['Invalid credentials'] }, { status: 400, statusText: 'Bad Request' });

    expect(errorStatus).toBe(400);
  });

  it('Test 3 — refreshToken() success: calls POST /auth/token/refresh/', () => {
    const mockResponse = { access: 'newAccess' };
    let result: unknown;

    service.refreshToken('oldRefresh').subscribe(r => (result = r));

    const req = http.expectOne(`${API}/auth/token/refresh/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: 'oldRefresh' });
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
