import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getComments(slug: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/recipes/${slug}/comments/`);
  }

  postComment(slug: string, body: string, parent?: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/recipes/${slug}/comments/`, { body, parent });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comments/${id}/`);
  }
}
