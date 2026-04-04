import { TestBed } from '@angular/core/testing';
import { CommentStore } from './comment.store';
import { Comment } from '../models/comment.model';

describe('CommentStore', () => {
  let store: CommentStore;

  const makeComment = (id: string): Comment => ({
    id,
    parent: null,
    body: `Comment ${id}`,
    authorId: 'u1',
    authorName: 'User',
    authorAvatar: '',
    isFlagged: false,
    createdAt: '',
    updatedAt: '',
    replies: [],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CommentStore);
  });

  // Test 8: getComments returns only comments for the specified slug
  it('getComments returns only comments for the specified slug', () => {
    store.setComments('recipe-a', [makeComment('c1'), makeComment('c2')], 2);
    store.setComments('recipe-b', [makeComment('c3')], 1);

    expect(store.getComments('recipe-a')().length).toBe(2);
    expect(store.getComments('recipe-b')().length).toBe(1);
    expect(store.getComments('recipe-c')().length).toBe(0);
  });
});
