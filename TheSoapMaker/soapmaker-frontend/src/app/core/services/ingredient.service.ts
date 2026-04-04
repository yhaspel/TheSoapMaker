import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ingredient } from '../models/ingredient.model';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ingredients`;

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(`${this.base}/`);
  }

  getById(id: string): Observable<Ingredient> {
    return this.http.get<Ingredient>(`${this.base}/${id}/`);
  }
}
