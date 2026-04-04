import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  currentAdmin: User | null = null;

  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentAdmin = this.authService.getCurrentUser();
    this.loadUsers();
  }

  /**
   * Charge la liste de tous les utilisateurs
   */
  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<User[]>(`${this.API_URL}/admin/users`).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Error loading users:', error);
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
   * Retour au dashboard principal
   */
  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Retourne la classe CSS pour le badge de rôle
   */
  getRoleBadgeClass(role: string): string {
    return role === 'ADMIN'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  }

  /**
   * Navigue vers le profil d'un utilisateur
   */
  viewUserProfile(userId: number): void {
    this.router.navigate(['/user/profile', userId]);
  }
}
