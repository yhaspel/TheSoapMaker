export type RecipeMethod = 'cold_process' | 'hot_process' | 'melt_and_pour' | 'liquid';
export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  method: RecipeMethod;
  difficulty: RecipeDifficulty;
  cureTimeDays: number;
  batchSizeGrams: number;
  yieldBars: number;
  imageUrl: string;
  isPublished: boolean;
  tags: Tag[];
  averageRating: number;
  ratingCount: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
}
