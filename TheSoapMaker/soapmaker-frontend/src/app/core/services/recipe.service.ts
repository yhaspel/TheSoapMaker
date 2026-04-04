import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models/recipe.model';

export interface RecipeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Recipe[];
}

export interface RecipeFilters {
  search?: string;
  method?: string;
  difficulty?: string;
  tag?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/recipes`;

  getAll(filters: RecipeFilters = {}): Observable<RecipeListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params = params.set(k, String(v));
    });
    return this.http.get<RecipeListResponse>(`${this.base}/`, { params });
  }

  getBySlug(slug: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.base}/${slug}/`);
  }

  create(data: Partial<Recipe>): Observable<Recipe> {
    return this.http.post<Recipe>(`${this.base}/`, data);
  }

  update(slug: string, data: Partial<Recipe>): Observable<Recipe> {
    return this.http.patch<Recipe>(`${this.base}/${slug}/`, data);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${slug}/`);
  }
}
