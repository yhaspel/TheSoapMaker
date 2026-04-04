import { Injectable, signal, computed, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BookmarkStore {
  private _bookmarkedSlugs = signal<Set<string>>(new Set());

  readonly bookmarkedSlugs = this._bookmarkedSlugs.asReadonly();

  isBookmarked(slug: string): Signal<boolean> {
    return computed(() => this._bookmarkedSlugs().has(slug));
  }

  setBookmarkedSlugs(slugs: string[]): void {
    this._bookmarkedSlugs.set(new Set(slugs));
  }

  addBookmark(slug: string): void {
    this._bookmarkedSlugs.update(s => new Set([...s, slug]));
  }

  removeBookmark(slug: string): void {
    this._bookmarkedSlugs.update(s => {
      const next = new Set(s);
      next.delete(slug);
      return next;
    });
  }
}
