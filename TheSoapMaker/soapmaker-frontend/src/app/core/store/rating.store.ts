import { Injectable, signal, computed, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RatingStore {
  private _userRatings = signal<Record<string, number>>({});

  getUserRating(slug: string): Signal<number | null> {
    return computed(() => this._userRatings()[slug] ?? null);
  }

  setUserRating(slug: string, stars: number): void {
    this._userRatings.update(m => ({ ...m, [slug]: stars }));
  }

  removeUserRating(slug: string): void {
    this._userRatings.update(m => {
      const copy = { ...m };
      delete copy[slug];
      return copy;
    });
  }
}
