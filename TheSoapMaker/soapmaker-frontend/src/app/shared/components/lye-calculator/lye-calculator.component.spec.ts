import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LyeCalculatorComponent } from './lye-calculator.component';
import { RecipeIngredient } from '../../../core/models/recipe.model';

describe('LyeCalculatorComponent', () => {
  let component: LyeCalculatorComponent;
  let fixture: ComponentFixture<LyeCalculatorComponent>;

  // 1000g coconut oil, NaOH SAP value = 0.190
  const coconutOilIngredient: RecipeIngredient = {
    ingredient: {
      id: 'ing1',
      name: 'Coconut Oil',
      category: 'oil',
      saponificationValue: 0.190,
      description: '',
    },
    amountGrams: 1000,
    percentage: null,
    notes: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LyeCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LyeCalculatorComponent);
    component = fixture.componentInstance;
  });

  // Test 9: 1000g coconut oil, SAP=0.190, 5% superfat → Lye = 180.5g
  it('calculates correct NaOH lye weight: 1000g coconut at 5% superfat = 180.5g', () => {
    component.ingredients = [coconutOilIngredient];
    // Trigger ngOnChanges
    component.ngOnChanges({ ingredients: { currentValue: [coconutOilIngredient], previousValue: [], firstChange: true, isFirstChange: () => true } });
    component.superfat.set(5);
    component.lyeType.set('NaOH');
    fixture.detectChanges();

    // 1000 * 0.190 * (1 - 0.05) = 190 * 0.95 = 180.5
    expect(component.lyeWeight()).toBeCloseTo(180.5, 1);
  });

  // Test 10: water ratio 2x → Water = 361.0g
  it('calculates correct water weight: lyeWeight * waterRatio = 361.0g', () => {
    component.ingredients = [coconutOilIngredient];
    component.ngOnChanges({ ingredients: { currentValue: [coconutOilIngredient], previousValue: [], firstChange: true, isFirstChange: () => true } });
    component.superfat.set(5);
    component.lyeType.set('NaOH');
    component.waterRatio.set(2);
    fixture.detectChanges();

    // lyeWeight = 180.5, waterWeight = 180.5 * 2 = 361.0
    expect(component.waterWeight()).toBeCloseTo(361.0, 1);
  });
});
