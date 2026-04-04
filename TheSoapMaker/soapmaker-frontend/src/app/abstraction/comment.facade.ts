import { Injectable, inject, signal } from '@angular/core';
import { CommentService } from '../core/services/comment.service';
import { UiStore } from '../core/store/ui.store';
import { Comment } from '../core/models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentFacade {
  private commentService = inject(CommentService);
  private uiStore = inject(UiStore);

  private _comments = signal<Comment[]>([]);
  readonly comments = this._comments.asReadonly();

  loadComments(slug: string): void {
    this.commentService.getComments(slug).subscribe({
      next: (comments) => this._comments.set(comments),
    });
  }

  postComment(slug: string, body: string, parent?: string): void {
    this.commentService.postComment(slug, body, parent).subscribe({
      next: (comment) => {
        this._comments.update(cs => [...cs, comment]);
        this.uiStore.addToast('Comment posted', 'success');
      },
    });
  }

  deleteComment(id: string): void {
    this.commentService.deleteComment(id).subscribe({
      next: () => {
        this._comments.update(cs => cs.filter(c => c.id !== id));
        this.uiStore.addToast('Comment deleted', 'success');
      },
    });
  }
}
