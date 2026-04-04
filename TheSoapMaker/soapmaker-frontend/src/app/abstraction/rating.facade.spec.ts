import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RatingFacade } from './rating.facade';
import { RatingStore } from '../core/store/rating.store';
import { UiStore } from '../core/store/ui.store';
import { environment } from '../../environments/environment';

describe('RatingFacade', () => {
  let facade: RatingFacade;
  let httpMock: HttpTestingController;
  let ratingStore: RatingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RatingFacade,
        RatingStore,
        UiStore,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    facade = TestBed.inject(RatingFacade);
    httpMock = TestBed.inject(HttpTestingController);
    ratingStore = TestBed.inject(RatingStore);
  });

  afterEach(() => httpMock.verify());

  // Test 4: Optimistic update — store updated before HTTP call resolves
  it('updates rating store optimistically before HTTP call resolves', () => {
    const slug = 'lavender-soap';
    expect(facade.getUserRating(slug)()).toBeNull();

    facade.submitRating(slug, 4);

    // Store updated immediately (optimistic)
    expect(ratingStore.getUserRating(slug)()).toBe(4);

    // Flush the HTTP request
    const req = httpMock.expectOne(`${environment.apiUrl}/recipes/${slug}/rate/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ stars: 4 });
    req.flush({});
  });

  // Test 5: Error reverts store to previous value
  it('reverts rating store on HTTP error', () => {
    const slug = 'lavender-soap';
    // Pre-set existing rating
    ratingStore.setUserRating(slug, 3);

    facade.submitRating(slug, 5);
    expect(ratingStore.getUserRating(slug)()).toBe(5); // optimistic

    const req = httpMock.expectOne(`${environment.apiUrl}/recipes/${slug}/rate/`);
    req.error(new ProgressEvent('error'));

    expect(ratingStore.getUserRating(slug)()).toBe(3); // reverted
  });
});
