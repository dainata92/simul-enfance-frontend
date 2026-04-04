import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour vérifier si l'utilisateur est authentifié
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirige vers la page de login en conservant l'URL demandée
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
