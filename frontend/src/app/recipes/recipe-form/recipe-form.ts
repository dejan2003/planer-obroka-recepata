import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe.interface';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.css'
})
export class RecipeFormComponent implements OnInit {
  recipeForm: FormGroup;
  isEditMode: boolean = false;
  recipeId: number | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private authService: AuthService
  ) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      ingredients: ['', Validators.required],
      instructions: ['', Validators.required],
      preparation_time: [null],
      cooking_time: [null],
      servings: [null],
      cuisine: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEditMode = true;
        this.recipeId = +idParam;
        this.loadRecipeForEdit(this.recipeId);
      } else {
        this.isEditMode = false;
        this.recipeId = null;
      }
    });
  }

  loadRecipeForEdit(id: number): void {
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipeForm.patchValue(recipe);
      },
      error: (err) => {
        this.errorMessage = 'Greška pri učitavanju recepta za izmenu: ' + (err.error?.message || err.message || 'Nepoznata greška.');
        console.error('Failed to load recipe for edit:', err);
      }
    });
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.recipeForm.invalid) {
      this.errorMessage = 'Molimo popunite sva obavezna polja.';
      console.error('Form is invalid. Please fill all required fields.');
      this.markFormGroupTouched(this.recipeForm);
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Niste prijavljeni. Molimo prijavite se ponovo.';
      console.error('User is not logged in. Cannot save recipe.');
      this.authService.logout();
      return;
    }

    const recipeData: Recipe = {
      ...this.recipeForm.value,
      user_id: userId
    };

    if (this.isEditMode && this.recipeId !== null) {
      this.recipeService.updateRecipe(this.recipeId, recipeData).subscribe({
        next: (response) => {
          this.successMessage = 'Recept uspešno ažuriran!';
          console.log('Recipe updated successfully:', response);
        },
        error: (err) => {
          this.errorMessage = 'Greška pri ažuriranju recepta: ' + (err.error?.message || err.message || 'Nepoznata greška.');
          console.error('Failed to update recipe:', err);
        }
      });
    } else {
      this.recipeService.createRecipe(recipeData).subscribe({
        next: (response) => {
          this.successMessage = 'Recept uspešno dodan!';
          console.log('Recipe created successfully:', response);
          this.recipeForm.reset({
            title: '', description: '', ingredients: '', instructions: '',
            preparation_time: null, cooking_time: null, servings: null, cuisine: ''
          });
        },
        error: (err) => {
          this.errorMessage = 'Greška pri dodavanju recepta: ' + (err.error?.message || err.message || 'Nepoznata greška.');
          console.error('Failed to create recipe:', err);
        }
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}