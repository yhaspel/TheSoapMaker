import { Component, Input, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RecipeIngredient } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-lye-calculator',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="lye-calc">
      <h3 class="lye-calc__title">🧪 Lye Calculator</h3>

      <div class="lye-calc__controls">
        <div class="lye-calc__control">
          <label>Lye Type</label>
          <div class="lye-toggle">
            <button
              class="lye-toggle__btn"
              [class.lye-toggle__btn--active]="lyeType() === 'NaOH'"
              (click)="lyeType.set('NaOH')"
              type="button"
            >NaOH (Bar)</button>
            <button
              class="lye-toggle__btn"
              [class.lye-toggle__btn--active]="lyeType() === 'KOH'"
              (click)="lyeType.set('KOH')"
              type="button"
            >KOH (Liquid)</button>
          </div>
        </div>

        <div class="lye-calc__control">
          <label for="superfat">Superfat: {{ superfat() }}%</label>
          <input
            id="superfat"
            type="range"
            min="0"
            max="10"
            step="0.5"
            [(ngModel)]="superfatModel"
            (ngModelChange)="superfat.set(+$event)"
          />
        </div>

        <div class="lye-calc__control">
          <label for="waterRatio">Water / Lye Ratio</label>
          <select id="waterRatio" [(ngModel)]="waterRatioModel" (ngModelChange)="waterRatio.set(+$event)">
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
            <option value="2.5">2.5×</option>
            <option value="3">3×</option>
          </select>
        </div>
      </div>

      <div class="lye-calc__oils">
        <h4>Oil Ingredients</h4>
        @if (oilIngredients().length === 0) {
          <p class="lye-calc__empty">No oil ingredients found.</p>
        } @else {
          <table class="lye-calc__table">
            <thead>
              <tr><th>Ingredient</th><th>Amount (g)</th><th>SAP Value</th></tr>
            </thead>
            <tbody>
              @for (oil of oilIngredients(); track oil.name) {
                <tr>
                  <td>{{ oil.name }}</td>
                  <td>{{ oil.amountGrams }}</td>
                  <td>{{ oil.sapValue ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="lye-calc__results">
        <div class="lye-calc__result">
          <span class="lye-calc__result-label">{{ lyeType() }} Weight</span>
          <span class="lye-calc__result-value">{{ lyeWeight() | number:'1.1-1' }}g</span>
        </div>
        <div class="lye-calc__result">
          <span class="lye-calc__result-label">Water Weight</span>
          <span class="lye-calc__result-value">{{ waterWeight() | number:'1.1-1' }}g</span>
        </div>
      </div>

      <button class="lye-calc__copy-btn" (click)="copyToClipboard()" type="button">
        {{ copied() ? '✓ Copied!' : '📋 Copy Results' }}
      </button>
    </div>
  `,
  styles: [`
    .lye-calc { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px; padding: 1.5rem; }
    .lye-calc__title { font-size: 1.1rem; margin-bottom: 1.25rem; }
    .lye-calc__controls { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 1.5rem; }
    .lye-calc__control { display: flex; flex-direction: column; gap: .375rem; label { font-size: .78rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; } }
    .lye-toggle { display: flex; border: 1px solid #e5d9ca; border-radius: 6px; overflow: hidden; }
    .lye-toggle__btn { padding: .375rem .875rem; border: none; background: #fdf6ec; color: #7a6f5e; cursor: pointer; font-size: .85rem; transition: all .1s; &--active { background: #c1633a; color: #fff; } }
    input[type="range"] { width: 140px; accent-color: #c1633a; }
    select { padding: .375rem .625rem; border: 1px solid #e5d9ca; border-radius: 6px; background: #fdf6ec; font-size: .85rem; color: #2d2416; }
    .lye-calc__oils { margin-bottom: 1.5rem; h4 { font-size: .9rem; color: #7a6f5e; text-transform: uppercase; font-weight: 600; margin-bottom: .75rem; } }
    .lye-calc__empty { color: #7a6f5e; font-size: .9rem; }
    .lye-calc__table { width: 100%; border-collapse: collapse; font-size: .875rem;
      th { text-align: left; padding: .375rem .5rem; background: #f5ede0; font-size: .75rem; color: #7a6f5e; text-transform: uppercase; }
      td { padding: .375rem .5rem; border-bottom: 1px solid #e5d9ca; }
    }
    .lye-calc__results { display: flex; gap: 2rem; margin-bottom: 1.25rem; background: #f5ede0; border-radius: 8px; padding: 1rem 1.5rem; }
    .lye-calc__result { display: flex; flex-direction: column; gap: .25rem; }
    .lye-calc__result-label { font-size: .75rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; }
    .lye-calc__result-value { font-size: 1.5rem; font-weight: 800; color: #c1633a; }
    .lye-calc__copy-btn { padding: .5rem 1.25rem; border: 1px solid #c1633a; color: #c1633a; background: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: .875rem; &:hover { background: rgba(193,99,58,.06); } }
  `],
})
export class LyeCalculatorComponent implements OnChanges {
  @Input() ingredients: RecipeIngredient[] = [];

  readonly lyeType = signal<'NaOH' | 'KOH'>('NaOH');
  readonly superfat = signal(5);
  readonly waterRatio = signal(2);
  readonly copied = signal(false);

  superfatModel = 5;
  waterRatioModel = 2;

  readonly oilIngredients = signal<{ name: string; amountGrams: number; sapValue: number | null }[]>([]);

  readonly lyeWeight = computed(() => {
    const oils = this.oilIngredients();
    const sf = this.superfat();
    const type = this.lyeType();
    let total = 0;
    for (const oil of oils) {
      if (oil.sapValue != null && oil.sapValue > 0) {
        let sap = oil.sapValue;
        if (type === 'KOH') sap = sap / 0.715;
        total += oil.amountGrams * sap;
      }
    }
    return total * (1 - sf / 100);
  });

  readonly waterWeight = computed(() => this.lyeWeight() * this.waterRatio());

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ingredients']) {
      this.oilIngredients.set(
        (this.ingredients || [])
          .filter(ri => ri.ingredient?.category?.toLowerCase() === 'oil')
          .map(ri => ({
            name: ri.ingredient.name,
            amountGrams: ri.amountGrams,
            sapValue: ri.ingredient.saponificationValue ?? null,
          })),
      );
    }
  }

  copyToClipboard(): void {
    const text = `${this.lyeType()} Weight: ${this.lyeWeight().toFixed(1)}g\nWater Weight: ${this.waterWeight().toFixed(1)}g\n(${this.superfat()}% superfat, ${this.waterRatio()}x water ratio)`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
