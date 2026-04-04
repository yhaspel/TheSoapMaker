import { TestBed } from '@angular/core/testing';
import { RecipeStore } from './recipe.store';

describe('RecipeStore', () => {
  let store: RecipeStore;

  const mockRecipe = (overrides = {}) => ({
    id: '1',
    name: 'Test Recipe',
    slug: 'test-recipe',
    tags: [{ id: 'tag1', name: 'Natural' }],
    averageRating: 4.5,
    ratingCount: 10,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeStore],
    });
    store = TestBed.inject(RecipeStore);
  });

  describe('setRecipes', () => {
    it('should update the recipes signal', () => {
      const recipes = [mockRecipe({ id: '1' }), mockRecipe({ id: '2' })];
      store.setRecipes(recipes);
      expect(store.recipes().length).toBe(2);
      expect(store.recipes()[0].id).toBe('1');
      expect(store.recipes()[1].id).toBe('2');
    });
  });

  describe('filteredRecipes', () => {
    beforeEach(() => {
      const recipes = [
        mockRecipe({ id: '1', name: 'Lavender Soap', tags: [{ id: 'tag1', name: 'Natural' }] }),
        mockRecipe({ id: '2', name: 'Charcoal Soap', tags: [{ id: 'tag2', name: 'Detox' }] }),
        mockRecipe({ id: '3', name: 'Honey Soap', tags: [{ id: 'tag1', name: 'Natural' }] }),
      ];
      store.setRecipes(recipes);
    });

    it('should return all recipes when no query or tag is set', () => {
      expect(store.filteredRecipes().length).toBe(3);
    });

    it('should filter by name case-insensitive', () => {
      store.setSearchQuery('lavender');
      const filtered = store.filteredRecipes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Lavender Soap');
    });

    it('should filter by tag name', () => {
      store.setActiveTag('Natural');
      const filtered = store.filteredRecipes();
      expect(filtered.length).toBe(2);
      expect(filtered.every(r => r.tags.some(t => t.name === 'Natural'))).toBe(true);
    });
  });

  describe('topRated', () => {
    it('should return recipes sorted by averageRating descending, max 6', () => {
      const recipes = [
        mockRecipe({ id: '1', averageRating: 3.0 }),
        mockRecipe({ id: '2', averageRating: 5.0 }),
        mockRecipe({ id: '3', averageRating: 4.0 }),
        mockRecipe({ id: '4', averageRating: 2.0 }),
        mockRecipe({ id: '5', averageRating: 4.5 }),
        mockRecipe({ id: '6', averageRating: 3.5 }),
        mockRecipe({ id: '7', averageRating: 4.8 }),
      ];
      store.setRecipes(recipes);
      const top = store.topRated();
      expect(top.length).toBe(6);
      expect(top[0].averageRating).toBe(5.0);
      expect(top[1].averageRating).toBe(4.8);
      expect(top[2].averageRating).toBe(4.5);
      expect(top[3].averageRating).toBe(4.0);
      expect(top[4].averageRating).toBe(3.5);
      expect(top[5].averageRating).toBe(3.0);
    });
  });

  describe('addRecipe', () => {
    it('should prepend a recipe', () => {
      const recipe1 = mockRecipe({ id: '1', name: 'Recipe 1' });
      const recipe2 = mockRecipe({ id: '2', name: 'Recipe 2' });
      store.setRecipes([recipe1]);
      store.addRecipe(recipe2);
      const recipes = store.recipes();
      expect(recipes.length).toBe(2);
      expect(recipes[0].id).toBe('2');
      expect(recipes[1].id).toBe('1');
    });
  });

  describe('removeRecipe', () => {
    it('should remove a recipe by id', () => {
      const recipes = [mockRecipe({ id: '1' }), mockRecipe({ id: '2' }), mockRecipe({ id: '3' })];
      store.setRecipes(recipes);
      store.removeRecipe('2');
      const remaining = store.recipes();
      expect(remaining.length).toBe(2);
      expect(remaining.find(r => r.id === '2')).toBeUndefined();
      expect(remaining[0].id).toBe('1');
      expect(remaining[1].id).toBe('3');
    });
  });

  describe('updateRecipe', () => {
    it('should replace the matching recipe', () => {
      const original = mockRecipe({ id: '1', name: 'Original' });
      const updated = mockRecipe({ id: '1', name: 'Updated' });
      store.setRecipes([original]);
      store.updateRecipe(updated);
      const recipes = store.recipes();
      expect(recipes.length).toBe(1);
      expect(recipes[0].name).toBe('Updated');
    });
  });
});
