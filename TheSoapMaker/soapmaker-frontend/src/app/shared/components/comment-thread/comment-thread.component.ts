import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommentFacade } from '../../../abstraction/comment.facade';
import { AuthFacade } from '../../../abstraction/auth.facade';
import { Comment } from '../../../core/models/comment.model';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="comment-thread">
      <h3 class="comment-thread__title">
        Comments
        @if (commentFacade.loadingComments()) {
          <span class="comment-thread__loading">Loading…</span>
        }
      </h3>

      @if (authFacade.isAuthenticated()) {
        <div class="comment-form">
          <textarea
            [(ngModel)]="newBody"
            placeholder="Share your thoughts…"
            rows="3"
            class="comment-form__input"
            aria-label="Write a comment"
          ></textarea>
          <button class="btn-primary" (click)="submitComment()" [disabled]="!newBody().trim()">
            Post Comment
          </button>
        </div>
      } @else {
        <p class="comment-login-hint"><a routerLink="/auth/login">Log in</a> to leave a comment.</p>
      }

      <div class="comment-list">
        @for (comment of commentFacade.activeComments(); track comment.id) {
          <div class="comment">
            <img
              [src]="comment.authorAvatar || 'https://i.pravatar.cc/40'"
              [alt]="comment.authorName"
              class="comment__avatar"
            />
            <div class="comment__content">
              <div class="comment__header">
                <strong class="comment__author">{{ comment.authorName }}</strong>
                <span class="comment__date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="comment__body">{{ comment.body }}</p>
              <div class="comment__actions">
                @if (authFacade.isAuthenticated()) {
                  <button class="comment__reply-btn" (click)="toggleReply(comment.id)">
                    {{ replyingTo() === comment.id ? 'Cancel' : 'Reply' }}
                  </button>
                }
                @if (canDelete(comment)) {
                  <button class="comment__delete-btn" (click)="onDelete(comment)">Delete</button>
                }
                @if (authFacade.isAuthenticated() && !canDelete(comment)) {
                  <button class="comment__flag-btn" (click)="onFlag(comment.id)">Flag</button>
                }
              </div>

              @if (replyingTo() === comment.id) {
                <div class="comment-reply-form">
                  <textarea
                    [(ngModel)]="replyBody"
                    placeholder="Write a reply…"
                    rows="2"
                    class="comment-form__input"
                  ></textarea>
                  <button
                    class="btn-primary btn-sm"
                    (click)="submitReply(comment.id)"
                    [disabled]="!replyBody().trim()"
                  >Reply</button>
                </div>
              }

              @if (comment.replies?.length) {
                <div class="comment-replies">
                  @for (reply of comment.replies; track reply.id) {
                    <div class="comment comment--reply">
                      <img
                        [src]="reply.authorAvatar || 'https://i.pravatar.cc/40'"
                        [alt]="reply.authorName"
                        class="comment__avatar comment__avatar--sm"
                      />
                      <div class="comment__content">
                        <div class="comment__header">
                          <strong class="comment__author">{{ reply.authorName }}</strong>
                          <span class="comment__date">{{ formatDate(reply.createdAt) }}</span>
                        </div>
                        <p class="comment__body">{{ reply.body }}</p>
                        <div class="comment__actions">
                          @if (canDelete(reply)) {
                            <button class="comment__delete-btn" (click)="onDelete(reply)">Delete</button>
                          }
                          @if (authFacade.isAuthenticated() && !canDelete(reply)) {
                            <button class="comment__flag-btn" (click)="onFlag(reply.id)">Flag</button>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (commentFacade.activeHasNextPage()) {
        <button class="load-more-btn" (click)="loadMore()" [disabled]="commentFacade.loadingComments()">
          Load more comments
        </button>
      }
    </section>
  `,
  styles: [`
    .comment-thread__title { font-size: 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: .75rem; }
    .comment-thread__loading { font-size: .8rem; color: #7a6f5e; font-weight: 400; }
    .comment-form { margin-bottom: 2rem; display: flex; flex-direction: column; gap: .75rem; }
    .comment-login-hint { margin-bottom: 1.5rem; color: #7a6f5e; font-size: .9rem; a { color: #c1633a; font-weight: 600; } }
    .comment-form__input {
      width: 100%; padding: .75rem 1rem;
      border: 1px solid #e5d9ca; border-radius: 8px;
      font-size: .925rem; resize: vertical;
      &:focus { outline: none; border-color: #c1633a; box-shadow: 0 0 0 3px rgba(193,99,58,.12); }
    }
    .btn-primary {
      align-self: flex-start; padding: .5rem 1.25rem;
      background: #c1633a; color: #fff; border: none;
      border-radius: 6px; font-weight: 600; cursor: pointer;
      &:disabled { opacity: .5; cursor: not-allowed; }
      &:hover:not(:disabled) { background: #a0512e; }
    }
    .btn-sm { padding: .35rem .875rem; font-size: .85rem; }
    .comment-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .comment { display: flex; gap: .875rem; align-items: flex-start; }
    .comment--reply { margin-top: .875rem; }
    .comment__avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .comment__avatar--sm { width: 28px; height: 28px; }
    .comment__content { flex: 1; }
    .comment__header { display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
    .comment__author { font-size: .9rem; color: #1a1208; }
    .comment__date { font-size: .78rem; color: #7a6f5e; }
    .comment__body { font-size: .9rem; line-height: 1.5; color: #2d2416; }
    .comment__actions { display: flex; gap: .75rem; margin-top: .375rem; }
    .comment__reply-btn, .comment__flag-btn, .comment__delete-btn {
      background: none; border: none; font-size: .8rem; font-weight: 600; cursor: pointer; padding: 0;
      &:hover { text-decoration: underline; }
    }
    .comment__reply-btn { color: #c1633a; }
    .comment__flag-btn { color: #7a6f5e; }
    .comment__delete-btn { color: #c44040; }
    .comment-replies { margin-top: .5rem; border-left: 2px solid #e5d9ca; padding-left: 1rem; }
    .comment-reply-form { margin-top: .75rem; display: flex; flex-direction: column; gap: .5rem; }
    .load-more-btn {
      display: block; width: 100%; margin-top: 1.5rem;
      padding: .625rem; background: #f5ede0; color: #c1633a;
      border: 1px solid #e5d9ca; border-radius: 8px;
      font-weight: 600; cursor: pointer;
      &:hover:not(:disabled) { background: #ede0d0; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
  `],
})
export class CommentThreadComponent implements OnChanges {
  @Input({ required: true }) slug!: string;

  commentFacade = inject(CommentFacade);
  authFacade = inject(AuthFacade);

  newBody = signal('');
  replyBody = signal('');
  replyingTo = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slug'] && this.slug) {
      this.commentFacade.loadComments(this.slug);
    }
  }

  canDelete(comment: Comment): boolean {
    const user = this.authFacade.currentUser();
    return !!user && (comment.authorId === user.id || (user as any).isStaff === true);
  }

  toggleReply(id: string): void {
    this.replyingTo.set(this.replyingTo() === id ? null : id);
    this.replyBody.set('');
  }

  submitComment(): void {
    const body = this.newBody().trim();
    if (!body) return;
    this.commentFacade.postComment(this.slug, body);
    this.newBody.set('');
  }

  submitReply(parentId: string): void {
    const body = this.replyBody().trim();
    if (!body) return;
    this.commentFacade.postComment(this.slug, body, parentId);
    this.replyBody.set('');
    this.replyingTo.set(null);
  }

  onDelete(comment: Comment): void {
    if (confirm('Delete this comment?')) {
      this.commentFacade.deleteComment(this.slug, comment.id);
    }
  }

  onFlag(commentId: string): void {
    this.commentFacade.flagComment(commentId);
  }

  loadMore(): void {
    this.commentFacade.loadMoreComments(this.slug);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}
