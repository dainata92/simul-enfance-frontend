import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { PricingService, CalculationResult } from '../../services/pricing.service';
import { environment } from '../../../environments/environment';

interface Simulation {
  id: number;
  date: Date;
  cityName: string;
  serviceType: string;
  monthlyPrice: number;
  hourlyPrice: number;
  quotientFamilial: number;
  childrenCount: number;
  frequency?: number;  // Nombre de goûters/semaine pour périscolaire
}

interface DashboardStats {
  totalSimulations: number;
  averageMonthlyPrice: number;
  lastSimulationDate: Date | null;
  favoriteServiceType: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  simulations: Simulation[] = [];
  stats: DashboardStats = {
    totalSimulations: 0,
    averageMonthlyPrice: 0,
    lastSimulationDate: null,
    favoriteServiceType: 'N/A'
  };
  loading = false;

  private readonly API_URL = environment.apiUrl;

  constructor(
    private authService: AuthService,
    public router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur depuis le service
    this.currentUser = this.authService.getCurrentUser();

    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
      }
    });

    this.loadDashboardData();
  }

  /**
   * Charge les données du dashboard
   * Récupère les vraies simulations depuis l'API
   */
  loadDashboardData(): void {
    this.loading = true;

    this.http.get<any[]>(`${this.API_URL}/simulations`).subscribe({
      next: (data) => {
        this.simulations = data.map(sim => ({
          id: sim.id,
          date: new Date(sim.simulationDate),
          cityName: sim.cityName,
          serviceType: sim.serviceType,
          monthlyPrice: sim.monthlyPrice,
          hourlyPrice: sim.hourlyPrice,
          quotientFamilial: sim.quotientFamilial,
          childrenCount: sim.childrenCount,
          frequency: sim.frequency
        }));

        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des simulations:', error);
        this.simulations = [];
        this.loading = false;
      }
    });
  }

  /**
   * Calcule les statistiques basées sur les simulations
   */
  private calculateStats(): void {
    if (this.simulations.length === 0) {
      return;
    }

    this.stats.totalSimulations = this.simulations.length;

    // Calcul du prix moyen
    const totalPrice = this.simulations.reduce((sum, sim) => sum + sim.monthlyPrice, 0);
    this.stats.averageMonthlyPrice = totalPrice / this.simulations.length;

    // Dernière simulation
    const sortedSimulations = [...this.simulations].sort((a, b) => b.date.getTime() - a.date.getTime());
    this.stats.lastSimulationDate = sortedSimulations[0].date;

    // Type de service favori
    const serviceTypeCounts: { [key: string]: number } = {};
    this.simulations.forEach(sim => {
      serviceTypeCounts[sim.serviceType] = (serviceTypeCounts[sim.serviceType] || 0) + 1;
    });
    this.stats.favoriteServiceType = Object.keys(serviceTypeCounts).reduce((a, b) =>
      serviceTypeCounts[a] > serviceTypeCounts[b] ? a : b
    );
  }

  /**
   * Navigation vers le calculateur
   */
  navigateToCalculator(): void {
    this.router.navigate(['/calculator']);
  }

  /**
   * Navigation vers le profil personnel
   */
  navigateToProfile(): void {
    console.log('navigateToProfile - currentUser:', this.currentUser);
    if (this.currentUser) {
      console.log('Navigating to profile with ID:', this.currentUser.id);
      this.router.navigate(['/user/profile', this.currentUser.id]);
    } else {
      console.error('Cannot navigate: currentUser is null');
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Supprime une simulation
   */
  deleteSimulation(simulationId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette simulation ?')) {
      return;
    }

    this.loading = true;

    this.http.delete(`${this.API_URL}/simulations/${simulationId}`, { responseType: 'text' }).subscribe({
      next: () => {
        // Recharger les simulations après suppression
        this.loadDashboardData();
      },
      error: (error) => {
        let errorMessage = 'Erreur lors de la suppression de la simulation';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits pour supprimer cette simulation.';
        } else if (error.status === 404) {
          errorMessage = 'Simulation non trouvée.';
          // Recharger quand même pour mettre à jour la liste
          this.loadDashboardData();
        }

        alert(errorMessage);
        this.loading = false;
      }
    });
  }

  /**
   * Formate le type de service pour l'affichage
   */
  formatServiceType(type: string): string {
    switch (type) {
      case 'CRECHE':
        return 'Crèche';
      case 'PERISCOLAIRE':
        return 'Périscolaire';
      case 'MERCREDI':
        return 'Centre mercredi';
      case 'REPAS':
        return 'Restauration';
      default:
        return type;
    }
  }

  /**
   * Obtient la classe CSS pour le badge de type de service
   */
  getServiceTypeBadgeClass(type: string): string {
    switch (type) {
      case 'CRECHE':
        return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case 'MERCREDI':
        return 'bg-purple-50 text-purple-700 border border-purple-200/50';
      case 'REPAS':
        return 'bg-green-50 text-green-700 border border-green-200/50';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200/50';
    }
  }
}

