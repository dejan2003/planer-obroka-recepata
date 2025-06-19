import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 

import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../models/recipe.interface';
import { Subject } from 'rxjs'; 
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; 

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  searchTerm: string = '';
  cuisineFilter: string = '';
  maxPrepTimeFilter: number | null = null; 
  maxCookTimeFilter: number | null = null;
  minServingsFilter: number | null = null;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private searchTerms = new Subject<string>();

  constructor(
    private recipeService: RecipeService,
    private router: Router 
  ) { }

  ngOnInit(): void {
    this.loadRecipes(); 
    this.searchTerms.pipe(
      debounceTime(300), 
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilters();
    });
  }

  loadRecipes(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.successMessage = null;
    this.errorMessage = null;

    const filters: any = {};
    if (this.searchTerm) filters.searchTerm = this.searchTerm;
    if (this.cuisineFilter) filters.cuisine = this.cuisineFilter;
    if (this.maxPrepTimeFilter !== null) filters.maxPrepTime = Number(this.maxPrepTimeFilter);
    if (this.maxCookTimeFilter !== null) filters.maxCookTime = Number(this.maxCookTimeFilter);
    if (this.minServingsFilter !== null) filters.minServings = Number(this.minServingsFilter);

    this.recipeService.getRecipes(filters).subscribe({
      next: (data) => {
        this.recipes = data;
        console.log('Recipes loaded with filters:', this.recipes);
      },
      error: (err) => {
        this.errorMessage = 'Greška pri učitavanju recepata: ' + (err.error?.message || err.message || 'Nepoznata greška.');
        console.error('Failed to load recipes with filters:', err);
      }
    });
  }

  onSearchTermChange(term: string): void {
    this.searchTerms.next(term);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.cuisineFilter = '';
    this.maxPrepTimeFilter = null;
    this.maxCookTimeFilter = null;
    this.minServingsFilter = null;
    this.searchTerms.next('');
    this.applyFilters();
    this.successMessage = 'Filteri resetovani!';
    this.errorMessage = null;
  }

  deleteRecipe(id: number): void {
    if (confirm('Da li ste sigurni da želite da obrišete ovaj recept?')) {
      this.successMessage = null; 
      this.errorMessage = null;
      this.recipeService.deleteRecipe(id).subscribe({
        next: () => {
          console.log('Recipe deleted successfully');
          this.applyFilters(); 
          this.successMessage = 'Recept uspešno obrisan!';
        },
        error: (err) => {
          this.errorMessage = 'Greška pri brisanju recepta: ' + (err.error?.message || err.message || 'Nepoznata greška.');
          console.error('Failed to delete recipe:', err);
        }
      });
    }
  }

  editRecipe(id: number): void {
    this.successMessage = null; 
    this.errorMessage = null;
    this.router.navigate(['/recipes/edit', id]); 
  }
}