import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, RawUser, mapUser } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface LoginResponse { access: string; refresh: string; }
interface RegisterResponse { access: string; refresh: string; }
interface RefreshResponse { access: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login/`, { email, password });
  }

  register(email: string, password1: string, password2: string, displayName: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/auth/registration/`, {
      email,
      password1,
      password2,
      display_name: displayName,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/logout/`, {});
  }

  refreshToken(refresh: string): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.base}/auth/token/refresh/`, { refresh });
  }

  getProfile(): Observable<User> {
    return this.http.get<RawUser>(`${this.base}/auth/user/`).pipe(map(mapUser));
  }

  updateProfile(data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>): Observable<User> {
    const payload: Record<string, unknown> = {};
    if (data.displayName !== undefined) payload['display_name'] = data.displayName;
    if (data.bio !== undefined) payload['bio'] = data.bio;
    if (data.avatarUrl !== undefined) payload['avatar_url'] = data.avatarUrl;
    return this.http.put<RawUser>(`${this.base}/auth/user/`, payload).pipe(map(mapUser));
  }
}
