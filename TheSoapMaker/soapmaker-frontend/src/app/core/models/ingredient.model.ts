export type IngredientCategory = 'oil' | 'lye' | 'liquid' | 'additive' | 'fragrance' | 'colorant';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  saponificationValue: number | null;
  description: string;
}

export interface RecipeIngredient {
  ingredient: Ingredient;
  amountGrams: number;
  percentage: number | null;
  notes: string;
}
