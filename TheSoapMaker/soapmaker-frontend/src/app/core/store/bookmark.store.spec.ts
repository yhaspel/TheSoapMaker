import { TestBed } from '@angular/core/testing';
import { BookmarkStore } from './bookmark.store';

describe('BookmarkStore', () => {
  let store: BookmarkStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(BookmarkStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('isBookmarked returns false for unknown slug', () => {
    expect(store.isBookmarked('some-slug')()).toBeFalse();
  });

  it('addBookmark makes isBookmarked return true', () => {
    store.addBookmark('lavender-soap');
    expect(store.isBookmarked('lavender-soap')()).toBeTrue();
  });

  it('removeBookmark makes isBookmarked return false', () => {
    store.addBookmark('lavender-soap');
    store.removeBookmark('lavender-soap');
    expect(store.isBookmarked('lavender-soap')()).toBeFalse();
  });

  it('setBookmarkedSlugs initialises multiple slugs', () => {
    store.setBookmarkedSlugs(['soap-a', 'soap-b', 'soap-c']);
    expect(store.isBookmarked('soap-a')()).toBeTrue();
    expect(store.isBookmarked('soap-b')()).toBeTrue();
    expect(store.isBookmarked('soap-d')()).toBeFalse();
  });

  it('setBookmarkedSlugs replaces previous state', () => {
    store.setBookmarkedSlugs(['soap-a']);
    store.setBookmarkedSlugs(['soap-b']);
    expect(store.isBookmarked('soap-a')()).toBeFalse();
    expect(store.isBookmarked('soap-b')()).toBeTrue();
  });

  it('bookmarkedSlugs signal reflects current state', () => {
    store.addBookmark('soap-1');
    store.addBookmark('soap-2');
    const slugs = store.bookmarkedSlugs();
    expect(slugs.has('soap-1')).toBeTrue();
    expect(slugs.has('soap-2')).toBeTrue();
    expect(slugs.size).toBe(2);
  });

  it('multiple bookmarks can coexist', () => {
    store.addBookmark('soap-a');
    store.addBookmark('soap-b');
    store.addBookmark('soap-c');
    expect(store.isBookmarked('soap-a')()).toBeTrue();
    expect(store.isBookmarked('soap-b')()).toBeTrue();
    expect(store.isBookmarked('soap-c')()).toBeTrue();
  });

  it('removing one bookmark does not affect others', () => {
    store.setBookmarkedSlugs(['soap-a', 'soap-b', 'soap-c']);
    store.removeBookmark('soap-b');
    expect(store.isBookmarked('soap-a')()).toBeTrue();
    expect(store.isBookmarked('soap-b')()).toBeFalse();
    expect(store.isBookmarked('soap-c')()).toBeTrue();
  });
});
