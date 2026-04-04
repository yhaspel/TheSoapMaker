import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { RecipeFacade } from '../../../abstraction/recipe.facade';
import { IngredientService } from '../../../core/services/ingredient.service';
import { Ingredient } from '../../../core/models/ingredient.model';

const DRAFT_KEY = 'sm_recipe_draft';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="recipe-form-page container">
      <div class="form-header">
        <h1>{{ isEditMode ? 'Edit Recipe' : 'Create New Recipe' }}</h1>
        <p class="form-header__sub">Fill in the details across the four steps below.</p>
      </div>

      <!-- Stepper -->
      <div class="stepper" role="tablist">
        @for (s of steps; track s.index) {
          <div class="step-item" [class.step-item--active]="currentStep() === s.index" [class.step-item--done]="currentStep() > s.index">
            <div class="step-item__circle">{{ currentStep() > s.index ? '✓' : s.index }}</div>
            <span class="step-item__label">{{ s.label }}</span>
            @if (s.index < steps.length) { <div class="step-item__line"></div> }
          </div>
        }
      </div>

      <!-- Validation error banner -->
      @if (validationError()) {
        <div class="validation-error" role="alert">{{ validationError() }}</div>
      }

      <!-- Step 1: Basic Info -->
      @if (currentStep() === 1) {
        <div class="form-panel" [formGroup]="basicForm">
          <h2>Basic Information</h2>
          <div class="form-grid">
            <div class="form-group full">
              <label for="name">Recipe Name *</label>
              <input id="name" type="text" formControlName="name" placeholder="e.g. Lavender Dream Bar" />
              @if (basicForm.get('name')?.invalid && basicForm.get('name')?.touched) {
                <span class="field-error">Name must be at least 3 characters</span>
              }
            </div>
            <div class="form-group full">
              <label for="desc">Description *</label>
              <textarea id="desc" formControlName="description" rows="4" placeholder="Describe your soap recipe…"></textarea>
              @if (basicForm.get('description')?.invalid && basicForm.get('description')?.touched) {
                <span class="field-error">Description must be at least 20 characters</span>
              }
            </div>
            <div class="form-group">
              <label for="method">Method *</label>
              <select id="method" formControlName="method">
                <option value="">Select method…</option>
                <option value="cold_process">Cold Process</option>
                <option value="hot_process">Hot Process</option>
                <option value="melt_and_pour">Melt & Pour</option>
                <option value="liquid">Liquid</option>
              </select>
            </div>
            <div class="form-group">
              <label for="difficulty">Difficulty *</label>
              <select id="difficulty" formControlName="difficulty">
                <option value="">Select difficulty…</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div class="form-group">
              <label for="cure">Cure Time (days) *</label>
              <input id="cure" type="number" formControlName="cureTimeDays" min="1" placeholder="28" />
            </div>
            <div class="form-group">
              <label for="batch">Batch Size (g) *</label>
              <input id="batch" type="number" formControlName="batchSizeGrams" min="1" placeholder="500" />
            </div>
            <div class="form-group">
              <label for="yield">Yield (bars)</label>
              <input id="yield" type="number" formControlName="yieldBars" min="1" placeholder="8" />
            </div>
            <div class="form-group full">
              <label for="tags">Tags (comma-separated)</label>
              <input id="tags" type="text" formControlName="tagNames" placeholder="lavender, moisturising, vegan" />
            </div>
          </div>
        </div>
      }

      <!-- Step 2: Ingredients -->
      @if (currentStep() === 2) {
        <div class="form-panel">
          <h2>Ingredients</h2>
          <p class="form-panel__hint">Search and add your oils, lye, liquids and additives.</p>

          <!-- Autocomplete search -->
          <div class="autocomplete-wrap">
            <input type="text" [value]="ingredientSearch()" (input)="onIngredientSearch($event)"
              placeholder="Search ingredients…" class="autocomplete-input" />
            @if (ingredientResults().length > 0) {
              <ul class="autocomplete-list">
                @for (ing of ingredientResults(); track ing.id) {
                  <li class="autocomplete-item" (click)="addIngredientFromSearch(ing)">
                    <strong>{{ ing.name }}</strong>
                    <span class="autocomplete-cat">{{ ing.category }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Ingredient rows -->
          <div class="ingredient-list" [formArray]="ingredientsArray">
            @for (ctrl of ingredientsArray.controls; track $index; let i = $index) {
              <div class="ingredient-row" [formGroupName]="i">
                <span class="ing-name">{{ ctrl.get('name')?.value }}</span>
                <input type="number" formControlName="amountGrams" placeholder="Grams" min="1" class="ing-amount" />
                <input type="number" formControlName="percentage" placeholder="%" min="0" max="100" class="ing-pct" />
                <input type="text" formControlName="notes" placeholder="Notes" class="ing-notes" />
                <button type="button" class="remove-btn" (click)="removeIngredient(i)" aria-label="Remove">✕</button>
              </div>
            }
          </div>
          @if (ingredientsArray.length === 0) {
            <p class="empty-hint">No ingredients added yet. Search above to add some.</p>
          }
        </div>
      }

      <!-- Step 3: Steps -->
      @if (currentStep() === 3) {
        <div class="form-panel">
          <h2>Method Steps</h2>
          <p class="form-panel__hint">Describe each step in order.</p>
          <div class="steps-list" [formArray]="stepsArray">
            @for (ctrl of stepsArray.controls; track $index; let i = $index) {
              <div class="step-row" [formGroupName]="i">
                <div class="step-num">{{ i + 1 }}</div>
                <textarea formControlName="instruction" rows="2" [placeholder]="'Step ' + (i+1) + ' instructions…'"></textarea>
                <input type="number" formControlName="durationMinutes" placeholder="Min" min="1" class="duration-input" />
                <button type="button" class="remove-btn" (click)="removeStep(i)" aria-label="Remove step">✕</button>
              </div>
            }
          </div>
          <button type="button" class="add-btn" (click)="addStep()">+ Add Step</button>
        </div>
      }

      <!-- Step 4: Preview & Image -->
      @if (currentStep() === 4) {
        <div class="form-panel">
          <h2>Preview & Publish</h2>
          <div class="preview-card">
            <h3>{{ basicForm.value.name || 'Untitled Recipe' }}</h3>
            <p>{{ basicForm.value.description || 'No description yet.' }}</p>
            <div class="preview-meta">
              <span class="badge badge-method">{{ basicForm.value.method || 'method TBD' }}</span>
              <span class="badge badge-difficulty-{{ basicForm.value.difficulty }}">{{ basicForm.value.difficulty || 'difficulty TBD' }}</span>
              <span>{{ basicForm.value.cureTimeDays || '?' }} days cure</span>
              <span>{{ basicForm.value.batchSizeGrams || '?' }}g → {{ basicForm.value.yieldBars || '?' }} bars</span>
            </div>
            <p><strong>Ingredients:</strong> {{ ingredientsArray.length }} added</p>
            <p><strong>Steps:</strong> {{ stepsArray.length }} added</p>
          </div>

          <!-- Image upload -->
          <div class="image-section">
            <label class="image-label">Recipe Photo</label>
            @if (imagePreview()) {
              <img [src]="imagePreview()" alt="Recipe preview" class="image-preview" />
            }
            <label class="upload-btn">
              📷 {{ imageUploading() ? 'Uploading…' : 'Choose Image' }}
              <input type="file" accept="image/*" (change)="onImageChange($event)" [disabled]="imageUploading()" hidden />
            </label>
          </div>

          <div class="publish-options" [formGroup]="basicForm">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="isPublished" />
              Publish immediately (visible to everyone)
            </label>
          </div>

          @if (draftSavedAt()) {
            <p class="draft-notice">✅ Draft auto-saved at {{ draftSavedAt() }}</p>
          }
        </div>
      }

      <!-- Navigation -->
      <div class="form-nav">
        <a routerLink="/recipes" class="btn-ghost">Cancel</a>
        <div class="form-nav__right">
          @if (currentStep() > 1) { <button type="button" class="btn-secondary" (click)="prev()">← Back</button> }
          @if (currentStep() < 4) { <button type="button" class="btn-primary" (click)="next()">Next →</button> }
          @if (currentStep() === 4) {
            <button type="button" class="btn-primary" (click)="submit()" [disabled]="recipeFacade.loading()">
              {{ recipeFacade.loading() ? 'Saving…' : (basicForm.value.isPublished ? 'Publish Recipe' : 'Save Draft') }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recipe-form-page { max-width: 800px; margin: 0 auto; padding: 2.5rem 1rem 4rem; }
    .form-header { margin-bottom: 2rem; }
    .form-header__sub { color: #7a6f5e; margin-top: .25rem; }
    h1 { font-size: 2rem; }

    .stepper { display: flex; align-items: center; margin-bottom: 2.5rem; overflow-x: auto; }
    .step-item { display: flex; align-items: center; flex: 1; min-width: 0; }
    .step-item__circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #e5d9ca; background: #fdf6ec; color: #7a6f5e; font-size: .85rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
    .step-item__label { font-size: .8rem; color: #7a6f5e; margin-left: .5rem; white-space: nowrap; }
    .step-item__line { flex: 1; height: 2px; background: #e5d9ca; margin: 0 .5rem; }
    .step-item--active .step-item__circle { border-color: #c1633a; background: #c1633a; color: #fff; }
    .step-item--active .step-item__label { color: #c1633a; font-weight: 600; }
    .step-item--done .step-item__circle { border-color: #3a8c5c; background: #3a8c5c; color: #fff; }
    .step-item--done .step-item__line { background: #3a8c5c; }

    .validation-error { background: #fde8e8; border: 1px solid #f5c0c0; border-radius: 8px; padding: .75rem 1rem; color: #8b1a1a; margin-bottom: 1rem; }
    .field-error { font-size: .78rem; color: #c0392b; margin-top: .25rem; }

    .form-panel { background: #fff9f3; border: 1px solid #e5d9ca; border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; h2 { font-size: 1.4rem; margin-bottom: 1.25rem; } }
    .form-panel__hint { color: #7a6f5e; font-size: .9rem; margin-bottom: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: .375rem; &.full { grid-column: 1 / -1; } }
    label { font-size: .8rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; }
    input, textarea, select { padding: .5rem .75rem; border: 1px solid #e5d9ca; border-radius: 6px; font-size: .925rem; background: #fdf6ec; color: #2d2416; &:focus { outline: none; border-color: #c1633a; } }

    .autocomplete-wrap { position: relative; margin-bottom: 1.25rem; }
    .autocomplete-input { width: 100%; }
    .autocomplete-list { position: absolute; z-index: 10; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e5d9ca; border-radius: 0 0 8px 8px; max-height: 240px; overflow-y: auto; list-style: none; margin: 0; padding: 0; box-shadow: 0 4px 16px rgba(0,0,0,.1); }
    .autocomplete-item { padding: .625rem .875rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; &:hover { background: #f5ede0; } }
    .autocomplete-cat { font-size: .78rem; color: #7a6f5e; background: #f5ede0; padding: 2px 6px; border-radius: 4px; }

    .ingredient-list { display: flex; flex-direction: column; gap: .75rem; margin: 1rem 0; }
    .ingredient-row { display: grid; grid-template-columns: 2fr 80px 60px 1fr auto; gap: .5rem; align-items: center; padding: .5rem; background: #fdf6ec; border-radius: 6px; }
    .ing-name { font-weight: 600; font-size: .9rem; }
    .empty-hint { color: #7a6f5e; font-size: .9rem; text-align: center; padding: 1.5rem; }

    .steps-list { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1rem; }
    .step-row { display: grid; grid-template-columns: 36px 1fr 80px auto; gap: .5rem; align-items: flex-start; }
    .step-num { width: 36px; height: 36px; border-radius: 50%; background: #c1633a; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .duration-input { width: 80px; }
    .remove-btn { background: none; border: 1px solid #e5d9ca; border-radius: 4px; color: #c0392b; cursor: pointer; padding: .25rem .5rem; &:hover { background: #fde8e8; } }
    .add-btn { background: none; border: 2px dashed #e5d9ca; border-radius: 6px; color: #c1633a; font-weight: 600; padding: .625rem 1.25rem; cursor: pointer; width: 100%; &:hover { border-color: #c1633a; background: rgba(193,99,58,.04); } }

    .preview-card { padding: 1.5rem; background: #fdf6ec; border-radius: 8px; margin-bottom: 1.5rem; h3 { margin-bottom: .5rem; } }
    .preview-meta { display: flex; gap: .75rem; flex-wrap: wrap; margin: 1rem 0; align-items: center; font-size: .875rem; color: #7a6f5e; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: .75rem; font-weight: 600; text-transform: uppercase; }
    .badge-method { background: #ede0d3; color: #c1633a; }
    .badge-difficulty-beginner { background: #d4e6d3; color: #2a6e3a; }
    .badge-difficulty-intermediate { background: #fdf0d5; color: #8a5e00; }
    .badge-difficulty-advanced { background: #fde8e8; color: #8b1a1a; }

    .image-section { margin-bottom: 1.5rem; }
    .image-label { display: block; font-size: .8rem; font-weight: 600; color: #7a6f5e; text-transform: uppercase; letter-spacing: .04em; margin-bottom: .5rem; }
    .image-preview { width: 100%; max-height: 240px; object-fit: cover; border-radius: 8px; margin-bottom: .75rem; }
    .upload-btn { display: inline-block; padding: .625rem 1.25rem; background: #f5ede0; border: 2px dashed #c1633a; border-radius: 8px; color: #c1633a; font-weight: 600; font-size: .9rem; cursor: pointer; &:hover { background: rgba(193,99,58,.1); } }

    .publish-options .checkbox-label { display: flex; align-items: center; gap: .5rem; cursor: pointer; font-size: .95rem; input[type=checkbox] { width: auto; } }
    .draft-notice { font-size: .8rem; color: #3a8c5c; margin-top: .75rem; }

    .form-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
    .form-nav__right { display: flex; gap: .75rem; }
    .btn-primary { padding: .625rem 1.5rem; background: #c1633a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; &:hover:not(:disabled) { background: #a0512e; } &:disabled { opacity: .6; cursor: not-allowed; } }
    .btn-secondary { padding: .625rem 1.25rem; border: 2px solid #c1633a; color: #c1633a; border-radius: 8px; font-weight: 600; cursor: pointer; background: none; &:hover { background: rgba(193,99,58,.06); } }
    .btn-ghost { padding: .625rem 1.25rem; color: #7a6f5e; text-decoration: none; border-radius: 8px; font-weight: 500; &:hover { background: #f5ede0; color: #2d2416; } }
  `],
})
export class RecipeFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  recipeFacade = inject(RecipeFacade);
  private ingredientService = inject(IngredientService);

  isEditMode = false;
  private editSlug = '';
  currentStep = signal(1);
  steps = [
    { index: 1, label: 'Basic Info' },
    { index: 2, label: 'Ingredients' },
    { index: 3, label: 'Steps' },
    { index: 4, label: 'Preview' },
  ];

  // Signals for UI state
  validationError = signal<string | null>(null);
  ingredientSearch = signal('');
  ingredientResults = signal<Ingredient[]>([]);
  imagePreview = signal<string | null>(null);
  imageUploading = signal(false);
  imageUrl = signal('');
  draftSavedAt = signal<string | null>(null);

  private ingredientSearch$ = new Subject<string>();
  private subs = new Subscription();
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  basicForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    method: ['', Validators.required],
    difficulty: ['', Validators.required],
    cureTimeDays: [28, [Validators.required, Validators.min(1)]],
    batchSizeGrams: [500, [Validators.required, Validators.min(1)]],
    yieldBars: [8, Validators.min(1)],
    tagNames: [''],
    isPublished: [true],
  });

  ingredientsForm = this.fb.group({
    ingredients: this.fb.array([]),
  });

  stepsForm = this.fb.group({
    steps: this.fb.array([]),
  });

  get ingredientsArray(): FormArray { return this.ingredientsForm.get('ingredients') as FormArray; }
  get stepsArray(): FormArray { return this.stepsForm.get('steps') as FormArray; }

  ngOnInit(): void {
    // Detect edit mode
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.isEditMode = true;
      this.editSlug = slug;
      this._populateFromStore();
    } else {
      this._checkDraft();
    }

    // Ingredient autocomplete
    this.subs.add(
      this.ingredientSearch$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(q => this.ingredientService.getAll(q)),
      ).subscribe(results => this.ingredientResults.set(results)),
    );

    // Auto-save draft every 30 seconds
    this.autoSaveTimer = setInterval(() => this._saveDraft(), 30_000);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }

  private _populateFromStore(): void {
    const recipe = this.recipeFacade.selectedRecipe();
    if (!recipe) return;

    this.basicForm.patchValue({
      name: recipe.name,
      description: recipe.description,
      method: recipe.method,
      difficulty: recipe.difficulty,
      cureTimeDays: recipe.cureTimeDays,
      batchSizeGrams: recipe.batchSizeGrams,
      yieldBars: recipe.yieldBars,
      tagNames: recipe.tags.map(t => t.name).join(', '),
      isPublished: recipe.isPublished,
    });

    if (recipe.imageUrl) {
      this.imagePreview.set(recipe.imageUrl);
      this.imageUrl.set(recipe.imageUrl);
    }

    recipe.ingredients.forEach(ri => {
      this.ingredientsArray.push(this.fb.group({
        ingredientId: [ri.ingredient.id],
        name: [ri.ingredient.name],
        amountGrams: [ri.amountGrams, [Validators.required, Validators.min(1)]],
        percentage: [ri.percentage],
        notes: [ri.notes],
      }));
    });

    recipe.steps.forEach(s => {
      this.stepsArray.push(this.fb.group({
        order: [s.order],
        instruction: [s.instruction, Validators.required],
        durationMinutes: [s.durationMinutes],
      }));
    });
  }

  private _checkDraft(): void {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && confirm('Resume your saved draft?')) {
      try {
        const d = JSON.parse(draft);
        this.basicForm.patchValue(d.basicForm ?? {});
        if (d.imagePreview) this.imagePreview.set(d.imagePreview);
        if (d.imageUrl) this.imageUrl.set(d.imageUrl);
      } catch { /* ignore invalid JSON */ }
    }
  }

  private _saveDraft(): void {
    if (!this.basicForm.dirty) return;
    const draft = {
      basicForm: this.basicForm.value,
      imagePreview: this.imagePreview(),
      imageUrl: this.imageUrl(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    const now = new Date().toLocaleTimeString();
    this.draftSavedAt.set(now);
  }

  onIngredientSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.ingredientSearch.set(q);
    if (q.length >= 2) this.ingredientSearch$.next(q);
    else this.ingredientResults.set([]);
  }

  addIngredientFromSearch(ing: Ingredient): void {
    this.ingredientsArray.push(this.fb.group({
      ingredientId: [ing.id],
      name: [ing.name],
      amountGrams: [null, [Validators.required, Validators.min(1)]],
      percentage: [null],
      notes: [''],
    }));
    this.ingredientSearch.set('');
    this.ingredientResults.set([]);
  }

  removeIngredient(i: number): void { this.ingredientsArray.removeAt(i); }

  addStep(): void {
    this.stepsArray.push(this.fb.group({
      order: [this.stepsArray.length + 1],
      instruction: ['', Validators.required],
      durationMinutes: [null],
    }));
  }

  removeStep(i: number): void { this.stepsArray.removeAt(i); }

  next(): void {
    this.validationError.set(null);
    if (this.currentStep() === 1) {
      this.basicForm.markAllAsTouched();
      if (this.basicForm.invalid) {
        this.validationError.set('Please fill in all required fields before continuing.');
        return;
      }
    }
    if (this.currentStep() === 2 && this.ingredientsArray.length === 0) {
      this.validationError.set('Please add at least one ingredient.');
      return;
    }
    if (this.currentStep() === 3 && this.stepsArray.length === 0) {
      this.validationError.set('Please add at least one step.');
      return;
    }
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  prev(): void {
    this.validationError.set(null);
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageUploading.set(true);
    this.recipeFacade.uploadImage(file).subscribe({
      next: (url) => {
        this.imageUrl.set(url);
        this.imagePreview.set(url);
        this.imageUploading.set(false);
      },
      error: () => this.imageUploading.set(false),
    });
  }

  submit(): void {
    const v = this.basicForm.value;
    const tagNames = (v.tagNames ?? '').split(',').map((t: string) => t.trim()).filter(Boolean);

    const payload = {
      name: v.name ?? '',
      description: v.description ?? '',
      method: v.method ?? '',
      difficulty: v.difficulty ?? '',
      cureTimeDays: Number(v.cureTimeDays ?? 28),
      batchSizeGrams: Number(v.batchSizeGrams ?? 500),
      yieldBars: Number(v.yieldBars ?? 1),
      imageUrl: this.imageUrl() || undefined,
      isPublished: v.isPublished ?? true,
      tagNames,
      ingredients: this.ingredientsArray.controls.map(ctrl => ({
        ingredientId: ctrl.get('ingredientId')?.value as string,
        amountGrams: Number(ctrl.get('amountGrams')?.value),
        percentage: ctrl.get('percentage')?.value as number | undefined,
        notes: ctrl.get('notes')?.value as string | undefined,
      })),
      steps: this.stepsArray.controls.map((ctrl, idx) => ({
        order: idx + 1,
        instruction: ctrl.get('instruction')?.value as string,
        durationMinutes: ctrl.get('durationMinutes')?.value as number | undefined,
      })),
    };

    // Clear draft on successful submit
    localStorage.removeItem(DRAFT_KEY);

    if (this.isEditMode) {
      this.recipeFacade.updateRecipe(this.editSlug, payload);
    } else {
      this.recipeFacade.submitRecipe(payload);
    }
  }
}
