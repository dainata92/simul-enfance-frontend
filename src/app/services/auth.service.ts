import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  name?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  id?: number;
  name?: string;
  user?: User;
  profilePicture?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(registerData: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, registerData)
      .pipe(
        tap(response => {
          console.log('Raw register response:', response);

          // Créer l'objet user à partir de la réponse
          const user: User = {
            id: response.id || 1,
            email: response.email,
            role: this.normalizeRole(response.role),
            name: response.name || response.email.split('@')[0],
            profilePicture: response.profilePicture
          };

          const normalizedResponse = {
            token: response.token,
            user: user
          };

          console.log('Normalized register response:', normalizedResponse);
          this.setSession(normalizedResponse as any);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Connexion de l'utilisateur
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          console.log('Raw login response:', response);
          console.log('response.id:', response.id);
          console.log('response.name:', response.name);

          // Créer l'objet user à partir de la réponse
          const user: User = {
            id: response.id || 1, // Utiliser 1 comme fallback au lieu de 0
            email: response.email,
            role: this.normalizeRole(response.role),
            name: response.name || response.email.split('@')[0],
            profilePicture: response.profilePicture
          };

          const normalizedResponse = {
            token: response.token,
            user: user
          };

          console.log('Normalized response with user:', normalizedResponse);
          console.log('User ID being saved:', user.id);
          this.setSession(normalizedResponse as any);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Normalise le rôle (enlève le préfixe ROLE_ si présent)
   */
  private normalizeRole(role: string): 'ADMIN' | 'USER' {
    if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
      return 'ADMIN';
    }
    return 'USER';
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Récupère le token JWT stocké
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Met à jour l'utilisateur courant (profil local)
   */
  updateCurrentUser(updated: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (!current) {
      return;
    }
    const merged = { ...current, ...updated } as User;
    localStorage.setItem('user', JSON.stringify(merged));
    this.currentUserSubject.next(merged);
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'ADMIN' | 'USER'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Stocke les informations de session
   */
  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
  }

  /**
   * Récupère l'utilisateur depuis le stockage local
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  /**
   * Redirige l'utilisateur vers le dashboard
   */
  redirectByRole(): void {
    const user = this.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Tous les utilisateurs (USER et ADMIN) vont vers le dashboard principal
    this.router.navigate(['/dashboard']);
  }
}
