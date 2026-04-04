import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/user/`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    const payload: Record<string, unknown> = {};
    if (data.displayName !== undefined) payload['display_name'] = data.displayName;
    if (data.bio !== undefined) payload['bio'] = data.bio;
    if (data.avatarUrl !== undefined) payload['avatar_url'] = data.avatarUrl;
    return this.http.put<User>(`${this.base}/auth/user/`, payload);
  }
}
