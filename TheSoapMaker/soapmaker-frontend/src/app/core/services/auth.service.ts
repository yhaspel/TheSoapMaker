import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

interface AuthTokens {
  access: string;
  refresh: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password1: string;
  password2: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/login/`, payload);
  }

  register(payload: RegisterPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/registration/`, payload);
  }

  logout(refresh: string): Observable<void> {
    return this.http.post<void>(`${this.base}/logout/`, { refresh });
  }

  refreshToken(refresh: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/token/refresh/`, { refresh });
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/user/`);
  }
}
