export interface Comment {
  id: string;
  parent: string | null;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}
