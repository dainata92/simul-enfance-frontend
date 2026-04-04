import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  currentUser: User | null = null;
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  userId!: number;
  isOwnProfile: boolean = false;
  editMode: boolean = false;
  saving: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  formData = {
    firstName: '',
    lastName: '',
    email: ''
  };

  private readonly API_URL = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    // Vérification que l'utilisateur est connecté et a un ID valide
    if (!this.currentUser || !this.currentUser.id) {
      console.error('Current user or user ID is missing:', this.currentUser);
      this.router.navigate(['/login']);
      return;
    }

    // Récupère l'ID de l'utilisateur depuis l'URL
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      this.userId = +idParam;

      // Vérification que l'ID est un nombre valide
      if (isNaN(this.userId) || this.userId <= 0) {
        console.error('Invalid user ID from route:', idParam);
        this.router.navigate(['/user/profile', this.currentUser?.id]);
        return;
      }

      this.isOwnProfile = this.userId === this.currentUser?.id;

      // Vérifie si l'utilisateur a le droit d'accéder à ce profil
      if (!this.isOwnProfile && this.currentUser?.role !== 'ADMIN') {
        this.router.navigate(['/user/profile', this.currentUser?.id]);
        return;
      }

      this.loadUserProfile();
    });
  }

  /**
   * Charge le profil de l'utilisateur
   */
  loadUserProfile(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.get<User>(`${this.API_URL}/users/${this.userId}`).subscribe({
      next: (data) => {
        this.user = this.normalizeUser(data);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Erreur lors du chargement du profil';
        this.loading = false;
        console.error('Error loading user profile:', error);
      }
    });
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Retourne au dashboard principal
   */
  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Active le mode édition
   */
  startEdit(): void {
    if (!this.user) {
      return;
    }
    this.formData = {
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      email: this.user.email || ''
    };
    this.editMode = true;
    this.successMessage = '';
  }

  /**
   * Annule l'édition
   */
  cancelEdit(): void {
    this.editMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.imagePreview = null;
    this.selectedFile = null;
  }

  /**
   * Sauvegarde les modifications du profil
   */
  saveProfile(): void {
    if (!this.user) {
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      firstName: this.formData.firstName?.trim() || '',
      lastName: this.formData.lastName?.trim() || '',
      email: this.formData.email?.trim(),
      profilePicture: this.imagePreview || this.user.profilePicture || undefined
    };

    this.http.put<User>(`${this.API_URL}/users/${this.user.id}`, payload).subscribe({
      next: (updated) => {
        const normalized = this.normalizeUser(updated);
        this.user = normalized;
        if (this.isOwnProfile) {
          this.authService.updateCurrentUser({
            email: normalized.email,
            name: normalized.name,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            role: normalized.role,
            profilePicture: normalized.profilePicture
          });
        }
        this.successMessage = 'Profil mis à jour avec succès.';
        this.editMode = false;
        this.saving = false;
        this.imagePreview = null;
        this.selectedFile = null;

        // Recharger le profil pour obtenir les données à jour depuis le serveur
        this.loadUserProfile();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Erreur lors de la mise à jour du profil';
        this.saving = false;
        console.error('Error updating user profile:', error);
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
   * Normalise le rôle pour le frontend
   */
  private normalizeRole(role: string | undefined): 'ADMIN' | 'USER' {
    if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
      return 'ADMIN';
    }
    return 'USER';
  }

  /**
   * Normalise les données utilisateur
   */
  private normalizeUser(user: User): User {
    return {
      ...user,
      role: this.normalizeRole((user as any).role)
    };
  }

  /**
   * Retourne la classe CSS pour le badge de rôle
   */
  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  }
}
