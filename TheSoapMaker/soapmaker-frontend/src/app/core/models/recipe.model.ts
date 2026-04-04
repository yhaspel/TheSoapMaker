import { Ingredient } from './ingredient.model';

export type RecipeMethod = 'cold_process' | 'hot_process' | 'melt_and_pour' | 'liquid';
export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Tag {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  ingredient: Ingredient;
  amountGrams: number;
  percentage: number | null;
  notes: string;
}

export interface Step {
  id: string;
  order: number;
  instruction: string;
  durationMinutes: number | null;
}

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
  ingredients: RecipeIngredient[];
  steps: Step[];
  averageRating: number;
  ratingCount: number;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
}
