import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MatButtonModule } from '@angular/material/button'; 
import { MatCardModule } from '@angular/material/card';     
import { MatIconModule } from '@angular/material/icon';     
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  recipes: Recipe[] = []; 

  constructor(
    private authService: AuthService,
    private router: Router,
    private recipeService: RecipeService 
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.recipeService.getRecipes().subscribe({
      next: (data) => {
        this.recipes = data;
        console.log('Recepti učitani:', this.recipes);
      },
      error: (err) => {
        console.error('Greška pri učitavanju recepata:', err);
        if (err.status === 401 || err.status === 403) {
            console.warn('Sesija istekla ili nema autorizacije. Preusmeravanje na login.');
            this.authService.logout(); 
            this.router.navigate(['/login']);
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  addRecipe(): void {
    this.router.navigate(['/recipes'])
  }

  editRecipe(recipe: Recipe): void {
    console.log('Uredi recept:', recipe);

  }

  deleteRecipe(recipeId: number): void {
    if (!recipeId) {
      console.error('Nema ID-a recepta za brisanje.');
      return;
    }

    if (confirm('Da li ste sigurni da želite da obrišete ovaj recept?')) {
      this.recipeService.deleteRecipe(recipeId).subscribe({
        next: () => {
          console.log('Recept obrisan:', recipeId);
          this.loadRecipes();
        },
        error: (err) => console.error('Greška pri brisanju recepta:', err)
      });
    }
  }
}