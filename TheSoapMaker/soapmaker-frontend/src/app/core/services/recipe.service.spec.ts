import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RecipeService } from './recipe.service';

const API = 'http://localhost:8811/api/v1';

// Minimal snake_case recipe response that matches what the backend would return
const mockBackendRecipe = {
  id: 'abc-123',
  slug: 'lavender-dream',
  name: 'Lavender Dream',
  description: 'A lovely lavender soap.',
  method: 'cold_process',
  difficulty: 'beginner',
  cure_time_days: 28,
  batch_size_grams: 500,
  yield_bars: 8,
  image_url: '',
  is_published: true,
  tags: [{ id: '1', name: 'lavender' }],
  ingredients: [],
  steps: [],
  average_rating: '4.5',
  rating_count: 10,
  author: { id: 'u1', display_name: 'SoapMaker', avatar_url: '' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('RecipeService', () => {
  let service: RecipeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecipeService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RecipeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('Test 1 — getRecipes(): correct URL with query params passed', () => {
    let result: unknown;

    service
      .getAll({ search: 'lavender', method: 'cold_process', page: 2 })
      .subscribe((r) => (result = r));

    const req = http.expectOne((r) =>
      r.url === `${API}/recipes/` &&
      r.params.get('search') === 'lavender' &&
      r.params.get('method') === 'cold_process' &&
      r.params.get('page') === '2'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      count: 1,
      next: null,
      previous: null,
      results: [mockBackendRecipe],
    });

    // Verify camelCase mapping of response
    const res = result as {
      count: number;
      results: { slug: string; cureTimeDays: number; averageRating: number }[];
    };
    expect(res.count).toBe(1);
    expect(res.results[0].slug).toBe('lavender-dream');
    expect(res.results[0].cureTimeDays).toBe(28); // snake_case mapped
    expect(res.results[0].averageRating).toBe(4.5); // string parsed to float
  });

  it('Test 2 — createRecipe(): POST /api/v1/recipes/ called with snake_case payload', () => {
    let result: unknown;

    service
      .create({
        name: 'Lavender Dream',
        description: 'A great soap.',
        method: 'cold_process',
        difficulty: 'beginner',
        cureTimeDays: 28,
        batchSizeGrams: 500,
        yieldBars: 8,
        isPublished: true,
      })
      .subscribe((r) => (result = r));

    const req = http.expectOne(`${API}/recipes/`);
    expect(req.request.method).toBe('POST');

    // Verify payload uses snake_case for the backend
    expect(req.request.body['cure_time_days']).toBe(28);
    expect(req.request.body['batch_size_grams']).toBe(500);
    expect(req.request.body['is_published']).toBe(true);
    expect(req.request.body['name']).toBe('Lavender Dream');

    req.flush(mockBackendRecipe);

    // Result should be camelCase
    const recipe = result as { slug: string; cureTimeDays: number };
    expect(recipe.slug).toBe('lavender-dream');
    expect(recipe.cureTimeDays).toBe(28);
  });
});
