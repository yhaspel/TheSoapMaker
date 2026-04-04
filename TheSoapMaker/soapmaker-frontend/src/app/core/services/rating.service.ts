import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rating } from '../models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  submitRating(slug: string, stars: number): Observable<Rating> {
    return this.http.post<Rating>(`${this.base}/recipes/${slug}/rate/`, { stars });
  }
}
