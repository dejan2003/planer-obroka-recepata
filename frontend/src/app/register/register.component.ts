import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service'; 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.html', 
  styleUrl: './register.css' 
})
export class RegisterComponent { 
  email = '';
  password = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  onRegister(): void {
    this.authService.register(this.email, this.password).subscribe({ 
      next: (response) => {
        console.log('Registracija uspešna:', response.message);
        this.snackBar.open(response.message, 'Zatvori', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Greška pri registraciji:', error);
        this.snackBar.open(error.message || 'Greška pri registraciji. Pokušajte ponovo.', 'Zatvori', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}