import { Injectable, signal, computed, Signal } from '@angular/core';
import { Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentStore {
  private _commentsByRecipe = signal<Record<string, Comment[]>>({});
  private _loadingComments = signal(false);
  private _totalByRecipe = signal<Record<string, number>>({});

  readonly loadingComments = this._loadingComments.asReadonly();
  readonly commentsByRecipe = this._commentsByRecipe.asReadonly();

  getComments(slug: string): Signal<Comment[]> {
    return computed(() => this._commentsByRecipe()[slug] ?? []);
  }

  getTotal(slug: string): Signal<number> {
    return computed(() => this._totalByRecipe()[slug] ?? 0);
  }

  setComments(slug: string, comments: Comment[], total: number): void {
    this._commentsByRecipe.update(m => ({ ...m, [slug]: comments }));
    this._totalByRecipe.update(m => ({ ...m, [slug]: total }));
  }

  appendComments(slug: string, comments: Comment[]): void {
    this._commentsByRecipe.update(m => ({
      ...m,
      [slug]: [...(m[slug] ?? []), ...comments],
    }));
  }

  addComment(slug: string, comment: Comment): void {
    this._commentsByRecipe.update(m => ({
      ...m,
      [slug]: [comment, ...(m[slug] ?? [])],
    }));
  }

  removeComment(slug: string, commentId: string): void {
    this._commentsByRecipe.update(m => ({
      ...m,
      [slug]: (m[slug] ?? []).filter(c => c.id !== commentId),
    }));
  }

  setLoadingComments(v: boolean): void {
    this._loadingComments.set(v);
  }
}
