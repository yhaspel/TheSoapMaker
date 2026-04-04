import { TestBed } from '@angular/core/testing';
import { RatingStore } from './rating.store';

describe('RatingStore', () => {
  let store: RatingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(RatingStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('getUserRating returns null for unknown slug', () => {
    expect(store.getUserRating('unknown-slug')()).toBeNull();
  });

  it('setUserRating stores rating for slug', () => {
    store.setUserRating('lavender-soap', 4);
    expect(store.getUserRating('lavender-soap')()).toBe(4);
  });

  it('setUserRating can update an existing rating', () => {
    store.setUserRating('lavender-soap', 3);
    store.setUserRating('lavender-soap', 5);
    expect(store.getUserRating('lavender-soap')()).toBe(5);
  });

  it('removeUserRating clears the rating', () => {
    store.setUserRating('lavender-soap', 4);
    store.removeUserRating('lavender-soap');
    expect(store.getUserRating('lavender-soap')()).toBeNull();
  });

  it('ratings are isolated per slug', () => {
    store.setUserRating('soap-a', 5);
    store.setUserRating('soap-b', 2);
    expect(store.getUserRating('soap-a')()).toBe(5);
    expect(store.getUserRating('soap-b')()).toBe(2);
  });

  it('setUserRating works with all valid star ratings (1-5)', () => {
    for (let stars = 1; stars <= 5; stars++) {
      const slug = `soap-${stars}-stars`;
      store.setUserRating(slug, stars);
      expect(store.getUserRating(slug)()).toBe(stars);
    }
  });

  it('removing one rating does not affect others', () => {
    store.setUserRating('soap-a', 5);
    store.setUserRating('soap-b', 3);
    store.setUserRating('soap-c', 4);
    store.removeUserRating('soap-b');

    expect(store.getUserRating('soap-a')()).toBe(5);
    expect(store.getUserRating('soap-b')()).toBeNull();
    expect(store.getUserRating('soap-c')()).toBe(4);
  });

  it('handles duplicate setUserRating calls for same slug', () => {
    store.setUserRating('soap', 1);
    store.setUserRating('soap', 2);
    store.setUserRating('soap', 3);
    expect(store.getUserRating('soap')()).toBe(3);
  });

  it('removeUserRating on unknown slug does not error', () => {
    expect(() => store.removeUserRating('unknown-slug')).not.toThrow();
    expect(store.getUserRating('unknown-slug')()).toBeNull();
  });
});
