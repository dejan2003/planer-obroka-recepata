import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard';
import { RecipeListComponent } from './recipes/recipe-list/recipe-list';
import { RecipeDetailComponent } from './recipes/recipe-detail/recipe-detail';
import { RecipeFormComponent } from './recipes/recipe-form/recipe-form';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'recipes',
    component: RecipeListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'recipes/new',
    component: RecipeFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'recipes/edit/:id', 
    component: RecipeFormComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'recipes/:id',   
    component: RecipeDetailComponent,
    canActivate: [authGuard] 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];