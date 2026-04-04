import { Routes } from '@angular/router';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Route par défaut - Login
  { path: '', component: LoginComponent },

  // Route publique - Login (alias)
  { path: 'login', component: LoginComponent },

  // Route publique - Signup
  { path: 'signup', component: SignupComponent },

  // Route protégée - Dashboard utilisateur (accessible après connexion)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Route protégée - Calculator (accessible après connexion)
  { path: 'calculator', component: CalculatorComponent, canActivate: [authGuard] },

  // Routes protégées - ADMIN
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent }
    ]
  },

  // Routes protégées - USER
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      { path: 'profile/:id', component: UserProfileComponent }
    ]
  },

  // Redirection par défaut
  { path: '**', redirectTo: '' }
];
