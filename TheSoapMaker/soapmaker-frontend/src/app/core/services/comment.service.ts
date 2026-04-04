import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment } from '../models/comment.model';
import { environment } from '../../../environments/environment';

export interface PaginatedCommentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Comment[];
}

function mapComment(c: Record<string, unknown>): Comment {
  const authorData = c['author'] as Record<string, unknown> | null;
  return {
    id: c['id'] as string,
    parent: c['parent'] as string | null ?? null,
    body: c['body'] as string,
    authorId: authorData?.['id'] as string ?? c['author_id'] as string ?? '',
    authorName: authorData?.['display_name'] as string ?? c['author_name'] as string ?? 'Anonymous',
    authorAvatar: authorData?.['avatar_url'] as string ?? c['author_avatar'] as string ?? '',
    isFlagged: c['is_flagged'] as boolean ?? false,
    createdAt: c['created_at'] as string,
    updatedAt: c['updated_at'] as string,
    replies: ((c['replies'] ?? []) as Record<string, unknown>[]).map(mapComment),
  };
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getComments(slug: string, page = 1): Observable<PaginatedCommentsResponse> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<Record<string, unknown>>(`${this.base}/recipes/${slug}/comments/`, { params }).pipe(
      map(res => ({
        count: res['count'] as number ?? 0,
        next: res['next'] as string | null,
        previous: res['previous'] as string | null,
        results: ((res['results'] ?? []) as Record<string, unknown>[]).map(mapComment),
      })),
    );
  }

  postComment(slug: string, body: string, parentId?: string): Observable<Comment> {
    const payload: Record<string, unknown> = { body };
    if (parentId) payload['parent'] = parentId;
    return this.http.post<Record<string, unknown>>(`${this.base}/recipes/${slug}/comments/`, payload).pipe(
      map(mapComment),
    );
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comments/${id}/`);
  }

  flagComment(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/comments/${id}/flag/`, {});
  }
}
