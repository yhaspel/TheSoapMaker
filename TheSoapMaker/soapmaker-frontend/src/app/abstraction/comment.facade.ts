import { Injectable, inject, Signal, computed, signal } from '@angular/core';
import { CommentService } from '../core/services/comment.service';
import { CommentStore } from '../core/store/comment.store';
import { AuthStore } from '../core/store/auth.store';
import { UiStore } from '../core/store/ui.store';
import { Comment } from '../core/models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentFacade {
  private commentService = inject(CommentService);
  private commentStore = inject(CommentStore);
  private authStore = inject(AuthStore);
  private uiStore = inject(UiStore);

  private _activeSlug = signal('');
  private _hasNextBySlug: Record<string, boolean> = {};
  private _currentPageBySlug: Record<string, number> = {};

  readonly loadingComments = this.commentStore.loadingComments;

  readonly activeComments: Signal<Comment[]> = computed(() =>
    (this.commentStore.commentsByRecipe()[this._activeSlug()] ?? []) as Comment[]
  );

  readonly activeHasNextPage: Signal<boolean> = computed(() =>
    this._activeSlug() ? (this._hasNextBySlug[this._activeSlug()] ?? false) : false
  );

  getComments(slug: string): Signal<Comment[]> {
    return this.commentStore.getComments(slug);
  }

  loadComments(slug: string, page = 1): void {
    this._activeSlug.set(slug);
    this.commentStore.setLoadingComments(true);
    this.commentService.getComments(slug, page).subscribe({
      next: (res) => {
        if (page === 1) {
          this.commentStore.setComments(slug, res.results, res.count);
        } else {
          this.commentStore.appendComments(slug, res.results);
        }
        this._currentPageBySlug[slug] = page;
        this._hasNextBySlug[slug] = !!res.next;
        this.commentStore.setLoadingComments(false);
      },
      error: () => {
        this.commentStore.setLoadingComments(false);
      },
    });
  }

  loadMoreComments(slug: string): void {
    const currentPage = this._currentPageBySlug[slug] ?? 1;
    this.loadComments(slug, currentPage + 1);
  }

  postComment(slug: string, body: string, parentId?: string): void {
    this.commentService.postComment(slug, body, parentId).subscribe({
      next: (comment) => {
        this.commentStore.addComment(slug, comment);
        this.uiStore.addToast('Comment posted', 'success');
      },
      error: () => {
        this.uiStore.addToast('Failed to post comment', 'error');
      },
    });
  }

  deleteComment(slug: string, commentId: string): void {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.commentStore.removeComment(slug, commentId);
        this.uiStore.addToast('Comment deleted', 'success');
      },
      error: () => {
        this.uiStore.addToast('Failed to delete comment', 'error');
      },
    });
  }

  flagComment(commentId: string): void {
    this.commentService.flagComment(commentId).subscribe({
      next: () => {
        this.uiStore.addToast('Thanks for flagging!', 'success');
      },
      error: () => {
        this.uiStore.addToast('Failed to flag comment', 'error');
      },
    });
  }
}
