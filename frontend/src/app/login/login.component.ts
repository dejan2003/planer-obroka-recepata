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
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink, 
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.html', 
  styleUrl: './login.css' 
})
export class LoginComponent { 
  email = '';
  password = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  onLogin(): void {
    this.authService.login(this.email, this.password).subscribe({ 
      next: (response) => {
        console.log('Prijava uspešna:', response.message);
        this.snackBar.open(response.message, 'Zatvori', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Greška pri prijavi:', error);
        this.snackBar.open(error.message || 'Greška pri prijavi. Pokušajte ponovo.', 'Zatvori', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}