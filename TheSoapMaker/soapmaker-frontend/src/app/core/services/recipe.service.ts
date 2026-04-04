import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Recipe } from '../models/recipe.model';
import { environment } from '../../../environments/environment';

export interface RecipeFilters {
  search?: string;
  method?: string;
  difficulty?: string;
  tag?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  authorId?: string;
  cureTimeMin?: number;
  cureTimeMax?: number;
  batchSizeMin?: number;
  batchSizeMax?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RecipePayload {
  name: string;
  description: string;
  method: string;
  difficulty: string;
  cureTimeDays: number;
  batchSizeGrams: number;
  yieldBars: number;
  imageUrl?: string;
  isPublished: boolean;
  tagNames?: string[];
  ingredients?: {
    ingredientId: string;
    amountGrams: number;
    percentage?: number | null;
    notes?: string;
  }[];
  steps?: {
    order: number;
    instruction: string;
    durationMinutes?: number | null;
  }[];
}

export interface CloudinaryUploadConfig {
  uploadUrl: string;
  apiKey: string;
  timestamp: string;
  signature: string;
  cloudName: string;
}

// Map a raw backend recipe object (snake_case) to our Recipe model (camelCase)
function mapRecipe(r: Record<string, unknown>): Recipe {
  const mapIngredient = (ri: Record<string, unknown>) => ({
    ingredient: {
      id: ri['ingredient_id'] as string ?? (ri['ingredient'] as Record<string, unknown>)?.['id'] as string,
      name: (ri['ingredient'] as Record<string, unknown>)?.['name'] as string ?? ri['ingredient_name'] as string ?? '',
      category: (ri['ingredient'] as Record<string, unknown>)?.['category'] as string ?? '',
      saponificationValue: (ri['ingredient'] as Record<string, unknown>)?.['saponification_value'] as number | null ?? null,
      description: (ri['ingredient'] as Record<string, unknown>)?.['description'] as string ?? '',
    },
    amountGrams: ri['amount_grams'] as number ?? 0,
    percentage: ri['percentage'] as number | null ?? null,
    notes: ri['notes'] as string ?? '',
  });

  const mapStep = (s: Record<string, unknown>) => ({
    id: s['id'] as string ?? '',
    order: s['order'] as number ?? 0,
    instruction: s['instruction'] as string ?? '',
    durationMinutes: s['duration_minutes'] as number | null ?? null,
  });

  const mapTag = (t: Record<string, unknown>) => ({
    id: t['id'] as string ?? String(t['id']),
    name: t['name'] as string ?? '',
  });

  const authorData = r['author'] as Record<string, unknown> | null;

  return {
    id: r['id'] as string,
    slug: r['slug'] as string,
    name: r['name'] as string,
    description: r['description'] as string,
    method: r['method'] as Recipe['method'],
    difficulty: r['difficulty'] as Recipe['difficulty'],
    cureTimeDays: r['cure_time_days'] as number,
    batchSizeGrams: r['batch_size_grams'] as number,
    yieldBars: r['yield_bars'] as number,
    imageUrl: r['image_url'] as string ?? '',
    isPublished: r['is_published'] as boolean ?? false,
    tags: ((r['tags'] ?? []) as Record<string, unknown>[]).map(mapTag),
    ingredients: ((r['ingredients'] ?? []) as Record<string, unknown>[]).map(mapIngredient),
    steps: ((r['steps'] ?? []) as Record<string, unknown>[]).map(mapStep),
    averageRating: parseFloat(String(r['average_rating'] ?? '0')),
    ratingCount: r['rating_count'] as number ?? 0,
    authorId: authorData?.['id'] as string ?? r['author_id'] as string ?? '',
    authorName: authorData?.['display_name'] as string ?? r['author_name'] as string ?? '',
    authorAvatar: authorData?.['avatar_url'] as string ?? r['author_avatar'] as string ?? '',
    createdAt: r['created_at'] as string ?? '',
    updatedAt: r['updated_at'] as string ?? '',
  };
}

// Convert RecipePayload to snake_case for the backend
function toSnakeCase(data: RecipePayload): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    method: data.method,
    difficulty: data.difficulty,
    cure_time_days: data.cureTimeDays,
    batch_size_grams: data.batchSizeGrams,
    yield_bars: data.yieldBars,
    image_url: data.imageUrl ?? '',
    is_published: data.isPublished,
    tag_names: data.tagNames ?? [],
    ingredients: (data.ingredients ?? []).map(i => ({
      ingredient_id: i.ingredientId,
      amount_grams: i.amountGrams,
      percentage: i.percentage ?? null,
      notes: i.notes ?? '',
    })),
    steps: (data.steps ?? []).map(s => ({
      order: s.order,
      instruction: s.instruction,
      duration_minutes: s.durationMinutes ?? null,
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAll(filters: RecipeFilters = {}): Observable<PaginatedResponse<Recipe>> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.method) params = params.set('method', filters.method);
    if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
    if (filters.tag) params = params.set('tag', filters.tag);
    if (filters.ordering) params = params.set('ordering', filters.ordering);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.page_size) params = params.set('page_size', String(filters.page_size));
    if (filters.authorId) params = params.set('author_id', filters.authorId);
    if (filters.cureTimeMin !== undefined) params = params.set('cure_time_min', String(filters.cureTimeMin));
    if (filters.cureTimeMax !== undefined) params = params.set('cure_time_max', String(filters.cureTimeMax));
    if (filters.batchSizeMin !== undefined) params = params.set('batch_size_min', String(filters.batchSizeMin));
    if (filters.batchSizeMax !== undefined) params = params.set('batch_size_max', String(filters.batchSizeMax));

    return this.http.get<Record<string, unknown>>(`${this.base}/recipes/`, { params }).pipe(
      map(res => ({
        count: res['count'] as number,
        next: res['next'] as string | null,
        previous: res['previous'] as string | null,
        results: ((res['results'] ?? []) as Record<string, unknown>[]).map(mapRecipe),
      })),
    );
  }

  getBySlug(slug: string): Observable<Recipe> {
    return this.http.get<Record<string, unknown>>(`${this.base}/recipes/${slug}/`).pipe(
      map(mapRecipe),
    );
  }

  getTopRated(): Observable<Recipe[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/recipes/top-rated/`).pipe(
      map(results => results.map(mapRecipe)),
    );
  }

  getMyRecipes(): Observable<Recipe[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/recipes/my/`).pipe(
      map(results => results.map(mapRecipe)),
    );
  }

  create(data: RecipePayload): Observable<Recipe> {
    return this.http.post<Record<string, unknown>>(`${this.base}/recipes/`, toSnakeCase(data)).pipe(
      map(mapRecipe),
    );
  }

  update(slug: string, data: RecipePayload): Observable<Recipe> {
    return this.http.put<Record<string, unknown>>(`${this.base}/recipes/${slug}/`, toSnakeCase(data)).pipe(
      map(mapRecipe),
    );
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/recipes/${slug}/`);
  }

  getUploadUrl(): Observable<CloudinaryUploadConfig> {
    return this.http.post<Record<string, unknown>>(`${this.base}/recipes/upload-url/`, {}).pipe(
      map(r => ({
        uploadUrl: r['upload_url'] as string,
        apiKey: r['api_key'] as string,
        timestamp: r['timestamp'] as string,
        signature: r['signature'] as string,
        cloudName: r['cloud_name'] as string,
      })),
    );
  }

  getBookmarked(): Observable<Recipe[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/recipes/bookmarked/`).pipe(
      map(results => results.map(r => mapRecipe(r))),
    );
  }

  toggleBookmark(slug: string): Observable<void> {
    return this.http.post<void>(`${this.base}/recipes/${slug}/bookmark/`, {});
  }
}
