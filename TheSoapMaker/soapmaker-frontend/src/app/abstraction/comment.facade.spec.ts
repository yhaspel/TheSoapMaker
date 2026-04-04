import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CommentFacade } from './comment.facade';
import { CommentStore } from '../core/store/comment.store';
import { AuthStore } from '../core/store/auth.store';
import { UiStore } from '../core/store/ui.store';
import { Comment } from '../core/models/comment.model';
import { environment } from '../../environments/environment';

describe('CommentFacade', () => {
  let facade: CommentFacade;
  let httpMock: HttpTestingController;
  let commentStore: CommentStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommentFacade,
        CommentStore,
        AuthStore,
        UiStore,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    facade = TestBed.inject(CommentFacade);
    httpMock = TestBed.inject(HttpTestingController);
    commentStore = TestBed.inject(CommentStore);
  });

  afterEach(() => httpMock.verify());

  const mockComment: Comment = {
    id: 'c1',
    parent: null,
    body: 'Great recipe!',
    authorId: 'u1',
    authorName: 'Alice',
    authorAvatar: '',
    isFlagged: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    replies: [],
  };

  // Test 6: postComment adds comment to store on success
  it('adds comment to store after successful postComment', () => {
    const slug = 'lavender-soap';

    facade.postComment(slug, 'Great recipe!');

    const req = httpMock.expectOne(`${environment.apiUrl}/recipes/${slug}/comments/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ body: 'Great recipe!' });
    req.flush(mockComment);

    const comments = commentStore.getComments(slug)();
    expect(comments.length).toBe(1);
    expect(comments[0].body).toBe('Great recipe!');
    expect(comments[0].authorName).toBe('Alice');
  });

  // Test 7: deleteComment removes comment from store on success
  it('removes comment from store after successful deleteComment', () => {
    const slug = 'lavender-soap';
    // Pre-populate store
    commentStore.setComments(slug, [{
      id: 'c1',
      parent: null,
      body: 'Great!',
      authorId: 'u1',
      authorName: 'Alice',
      authorAvatar: '',
      isFlagged: false,
      createdAt: '',
      updatedAt: '',
      replies: [],
    }], 1);

    facade.deleteComment(slug, 'c1');

    const req = httpMock.expectOne(`${environment.apiUrl}/comments/c1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    const comments = commentStore.getComments(slug)();
    expect(comments.length).toBe(0);
  });
});
