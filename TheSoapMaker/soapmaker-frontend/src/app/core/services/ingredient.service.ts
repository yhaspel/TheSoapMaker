import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Ingredient } from '../models/ingredient.model';
import { environment } from '../../../environments/environment';

type IngredientRaw = Record<string, unknown>;
/** DRF may return either a plain array or a paginated envelope. */
type IngredientResponse = IngredientRaw[] | { results: IngredientRaw[] };

function mapIngredient(r: IngredientRaw): Ingredient {
  return {
    id: r['id'] as string,
    name: r['name'] as string,
    category: r['category'] as Ingredient['category'],
    saponificationValue: r['saponification_value'] as number | null ?? null,
    description: r['description'] as string ?? '',
  };
}

function extractItems(response: IngredientResponse): IngredientRaw[] {
  return Array.isArray(response) ? response : (response.results ?? []);
}

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAll(search?: string): Observable<Ingredient[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<IngredientResponse>(`${this.base}/ingredients/`, { params }).pipe(
      map(response => extractItems(response).map(mapIngredient)),
    );
  }

  getById(id: string): Observable<Ingredient> {
    return this.http.get<Record<string, unknown>>(`${this.base}/ingredients/${id}/`).pipe(
      map(mapIngredient),
    );
  }
}
