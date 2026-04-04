import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour vérifier si l'utilisateur a le rôle requis
 */
export const roleGuard = (allowedRoles: Array<'ADMIN' | 'USER'>): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();

    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirige vers la page appropriée selon le rôle
    authService.redirectByRole();
    return false;
  };
};
