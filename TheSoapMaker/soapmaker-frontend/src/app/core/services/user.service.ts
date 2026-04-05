import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, RawUser, mapUser } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getProfile(): Observable<User> {
    return this.http.get<RawUser>(`${this.base}/auth/user/`).pipe(map(mapUser));
  }

  updateProfile(data: Partial<User>): Observable<User> {
    const payload: Record<string, unknown> = {};
    if (data.displayName !== undefined) payload['display_name'] = data.displayName;
    if (data.bio !== undefined) payload['bio'] = data.bio;
    if (data.avatarUrl !== undefined) payload['avatar_url'] = data.avatarUrl;
    return this.http.put<RawUser>(`${this.base}/auth/user/`, payload).pipe(map(mapUser));
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ avatar_url: string }>(`${this.base}/users/avatar/`, formData);
  }
}
