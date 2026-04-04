import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Rating } from '../models/rating.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  submitRating(slug: string, stars: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/recipes/${slug}/rate/`, { stars });
  }

  getRatings(slug: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(`${this.base}/recipes/${slug}/ratings/`);
  }
}
