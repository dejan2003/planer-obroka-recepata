import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.interface';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | undefined; 

  constructor(
    private route: ActivatedRoute, 
    private router: Router,       
    private recipeService: RecipeService 
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id'); 
      if (idParam) {
        const recipeId = +idParam;
        this.loadRecipe(recipeId);
      } else {
        console.warn('Recipe ID not found in route parameters.');
        this.router.navigate(['/recipes']); 
      }
    });
  }

  loadRecipe(id: number): void {
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        console.log('Recipe details loaded:', this.recipe);
      },
      error: (err) => {
        console.error('Failed to load recipe details:', err);
        this.router.navigate(['/recipes']);
      }
    });
  }

  editRecipe(): void {
    if (this.recipe && this.recipe.id) {
      this.router.navigate(['/recipes/edit', this.recipe.id]);
    }
  }

  deleteRecipe(): void {
    if (this.recipe && this.recipe.id) {
      if (confirm('Are you sure you want to delete this recipe?')) {
        this.recipeService.deleteRecipe(this.recipe.id).subscribe({
          next: () => {
            console.log('Recipe deleted successfully');
            this.router.navigate(['/recipes']);
          },
          error: (err) => {
            console.error('Failed to delete recipe:', err);
          }
        });
      }
    }
  }
}