import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Initialisation du composant
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Soumet le formulaire d'inscription
   */
  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.markFormGroupTouched(this.signupForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.signupForm.value;
    const registerData = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      profilePicture: this.imagePreview || undefined
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.successMessage = 'Inscription réussie ! Redirection...';

        // Redirige après 1 seconde
        setTimeout(() => {
          this.authService.redirectByRole();
        }, 1000);
      },
      error: (error) => {
        console.error('Erreur lors de l\'inscription:', error);
        this.loading = false;

        if (error.status === 400 || error.status === 409) {
          this.errorMessage = error.error?.message || 'Cet email est déjà utilisé';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription';
        }
      }
    });
  }

  /**
   * Gère la sélection d'une image
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image valide';
        return;
      }

      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'L\'image doit faire moins de 2MB';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';

      // Convertir en base64 pour l'aperçu et l'envoi
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Supprime l'image sélectionnée
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  /**
   * Vérifie si un champ a une erreur spécifique
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Vérifie si les mots de passe ne correspondent pas
   */
  hasPasswordMismatch(): boolean {
    const confirmPassword = this.signupForm.get('confirmPassword');
    return !!(this.signupForm.hasError('passwordMismatch') &&
              confirmPassword &&
              (confirmPassword.dirty || confirmPassword.touched));
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}

