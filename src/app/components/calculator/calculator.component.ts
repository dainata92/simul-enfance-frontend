import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PricingService, CalculationResult, City } from '../../services/pricing.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent implements OnInit {
  calculatorForm: FormGroup;
  cities: City[] = [];
  result: CalculationResult | null = null;
  loading = false;
  error: string | null = null;
  saveSuccess = false;

  private readonly API_URL = environment.apiUrl;

  // Expose Math to template
  Math = Math;

  // Sélection en deux étapes
  mainCategory: string | null = null;

  // Mode de calcul du QF
  qfMode: 'direct' | 'calculate' = 'direct'; // 'direct' ou 'calculate'

  mainCategories = [
    { value: 'CRECHE', label: 'Crèche' },
    { value: 'PERISCOLAIRE', label: 'Périscolaire Maternelle' },
    { value: 'RESTAURATION', label: 'Restauration Maternelle' }
  ];

  periscolaireOptions = [
    { value: 'ACCUEIL_MATIN', label: 'Accueil du matin', serviceType: 'ACCUEIL_MATIN' },
    { value: 'ACCUEIL_SOIR_PARIS', label: 'Accueil du soir', serviceType: 'PERISCOLAIRE' },  // Pour Paris
    { value: 'ACCUEIL_SOIR', label: 'Accueil du soir', serviceType: 'ACCUEIL_SOIR' },  // Pour Le Perreux
    { value: 'ACCUEIL_SOIR_SPECIFIQUE', label: 'Exception Lattre (16h30-17h15)', serviceType: 'ACCUEIL_SOIR_SPECIFIQUE' },
    { value: 'MERCREDI', label: 'Centre de loisirs du mercredi', serviceType: 'MERCREDI' }
  ];

  restaurationOptions = [
    { value: 'SANS_PAI', label: 'Sans PAI', serviceType: 'REPAS' },
    { value: 'AVEC_PAI', label: 'Avec PAI', serviceType: 'REPAS' }
  ];

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private http: HttpClient,
    private authService: AuthService,
    public router: Router
  ) {
    this.calculatorForm = this.fb.group({
      cityId: [null, Validators.required],
      mainCategory: [null, Validators.required],
      subCategory: [null],  // Requis seulement pour PERISCOLAIRE et RESTAURATION
      serviceType: [null, Validators.required],
      quotientFamilial: [null],
      // Champs pour le calcul automatique du QF
      revenuFiscal: [null, [Validators.min(0)]],
      nombreParts: [null, [Validators.min(0.5)]],
      // Nombre d'enfants : uniquement pour crèche (taux d'effort CNAF)
      childrenCount: [null],
      // Fréquence/forfait : pour périscolaire (nombre de goûters/semaine)
      frequency: [null]
    });
  }

  ngOnInit(): void {
    this.pricingService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des villes:', error);
        this.error = 'Impossible de charger la liste des villes';
      }
    });
  }

  onSubmit(): void {
    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.result = null;

    this.pricingService.calculatePrice(this.calculatorForm.value).subscribe({
      next: (result: CalculationResult) => {
        this.result = result;
        this.loading = false;

        // Sauvegarder la simulation si l'utilisateur est connecté
        if (this.authService.isLoggedIn()) {
          this.saveSimulation(result);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Une erreur est survenue lors du calcul';
        this.loading = false;
      }
    });
  }

  /**
   * Sauvegarde la simulation en base de données
   */
  private saveSimulation(result: CalculationResult): void {
    const cityName = this.cities.find(c => c.id === this.calculatorForm.value.cityId)?.name || '';

    const simulationData = {
      cityName: cityName,
      serviceType: this.calculatorForm.value.serviceType,
      monthlyPrice: result.servicePrice || result.monthlyPrice,  // Pour périscolaire, utiliser servicePrice
      hourlyPrice: result.hourlyPrice,
      quotientFamilial: this.calculatorForm.value.quotientFamilial || 0,
      childrenCount: this.calculatorForm.value.childrenCount || 0,
      frequency: this.calculatorForm.value.frequency || null  // Fréquence pour périscolaire
    };

    this.http.post(`${this.API_URL}/simulations`, simulationData).subscribe({
      next: () => {
        this.saveSuccess = true;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de la simulation:', error);
      }
    });
  }

  resetForm(): void {
    this.calculatorForm.reset({
      childrenCount: 1
    });
    this.mainCategory = null;
    this.qfMode = 'direct';
    this.result = null;
    this.error = null;
    this.saveSuccess = false;
  }

  toggleQfMode(mode: 'direct' | 'calculate'): void {
    this.qfMode = mode;

    if (mode === 'direct') {
      // Réinitialiser les champs de calcul
      this.calculatorForm.patchValue({
        revenuFiscal: null,
        nombreParts: null
      });
      // En mode direct : QF requis pour tous les services (y compris crèche)
      this.calculatorForm.get('quotientFamilial')?.setValidators([Validators.required, Validators.min(0), Validators.max(999999)]);
      this.calculatorForm.get('revenuFiscal')?.clearValidators();
      this.calculatorForm.get('nombreParts')?.clearValidators();
    } else {
      // Mode calcul automatique
      this.calculatorForm.patchValue({
        quotientFamilial: null
      });
      // Rendre revenuFiscal requis
      this.calculatorForm.get('quotientFamilial')?.clearValidators();
      this.calculatorForm.get('revenuFiscal')?.setValidators([Validators.required, Validators.min(0)]);

      // Pour crèche PSU : nombre de parts est optionnel (on utilise ressources mensuelles)
      // Pour autres services : nombre de parts requis (QF classique CAF)
      if (this.mainCategory === 'CRECHE') {
        this.calculatorForm.get('nombreParts')?.clearValidators();
      } else {
        this.calculatorForm.get('nombreParts')?.setValidators([Validators.required, Validators.min(0.5)]);
      }
    }

    // Mettre à jour la validation
    this.calculatorForm.get('quotientFamilial')?.updateValueAndValidity();
    this.calculatorForm.get('revenuFiscal')?.updateValueAndValidity();
    this.calculatorForm.get('nombreParts')?.updateValueAndValidity();
  }

  calculateQF(): void {
    const revenuFiscal = this.calculatorForm.get('revenuFiscal')?.value;
    const nombreParts = this.calculatorForm.get('nombreParts')?.value;

    if (revenuFiscal) {
      let qf: number;

      if (this.mainCategory === 'CRECHE') {
        // Pour les crèches PSU Paris : utiliser directement les ressources mensuelles
        // Formule : Ressources mensuelles = Revenu annuel / 12 (PAS de division par parts)
        qf = Math.round(revenuFiscal / 12);
      } else {
        // Pour périscolaire/restauration : QF classique CAF
        // Formule : QF = (Revenu fiscal annuel / 12) / nombre de parts
        if (nombreParts) {
          qf = Math.round((revenuFiscal / 12) / nombreParts);
        } else {
          return; // Besoin du nombre de parts pour les autres services
        }
      }

      this.calculatorForm.patchValue({
        quotientFamilial: qf
      });
    }
  }

  onRevenuOrPartsChange(): void {
    if (this.qfMode === 'calculate') {
      this.calculateQF();
    }
  }

  suggestPartsFromChildren(): void {
    const childrenCount = this.calculatorForm.get('childrenCount')?.value;
    if (childrenCount && childrenCount > 0) {
      // Formule simplifiée : 2 parts de base + 0.5 par enfant supplémentaire (à partir du 3e)
      // 1 enfant = 2 parts, 2 enfants = 2.5 parts, 3 enfants = 3 parts, etc.
      let parts = 2;
      if (childrenCount >= 2) {
        parts = 2 + (childrenCount - 1) * 0.5;
      }
      this.calculatorForm.patchValue({ nombreParts: parts });
      this.calculateQF();
    }
  }

  onCityChange(): void {
    // Réinitialiser la sous-catégorie périscolaire si changement de ville
    // car les options disponibles changent (ex: Paris n'a pas "Accueil du matin")
    if (this.mainCategory === 'PERISCOLAIRE') {
      this.calculatorForm.patchValue({
        subCategory: null,
        serviceType: null
      });
    }
  }

  selectMainCategory(category: string): void {
    this.mainCategory = category;
    this.calculatorForm.patchValue({
      mainCategory: category,
      subCategory: null,
      serviceType: category === 'CRECHE' ? 'CRECHE' : null
    });

    // Pour la crèche : childrenCount requis (taux d'effort CNAF), subCategory non requis
    if (category === 'CRECHE') {
      this.calculatorForm.get('childrenCount')?.setValidators([Validators.required, Validators.min(1), Validators.max(10)]);
      this.calculatorForm.patchValue({ childrenCount: 1 });

      // Crèche n'utilise pas frequency ni subCategory
      this.calculatorForm.get('frequency')?.clearValidators();
      this.calculatorForm.patchValue({ frequency: null });
      this.calculatorForm.get('subCategory')?.clearValidators();

      // Pour crèche : QF requis en mode direct, revenu fiscal requis en mode calcul
      if (this.qfMode === 'direct') {
        this.calculatorForm.get('quotientFamilial')?.setValidators([Validators.required, Validators.min(0), Validators.max(999999)]);
      }
    } else if (category === 'PERISCOLAIRE') {
      // Pour périscolaire : QF requis + frequency (dépend de la sous-catégorie) + subCategory requis
      this.calculatorForm.get('childrenCount')?.clearValidators();
      this.calculatorForm.patchValue({ childrenCount: null });
      this.calculatorForm.get('subCategory')?.setValidators([Validators.required]);

      // Frequency : sera défini dans onSubCategoryChange selon le type d'accueil
      // (requis pour Accueil du soir, non requis pour Centre de loisirs mercredi)
      this.calculatorForm.get('frequency')?.clearValidators();
      this.calculatorForm.patchValue({ frequency: null });

      if (this.qfMode === 'direct') {
        this.calculatorForm.get('quotientFamilial')?.setValidators([Validators.required, Validators.min(0), Validators.max(999999)]);
      }
    } else {
      // Pour restauration : QF requis, pas d'enfants, pas de frequency
      this.calculatorForm.get('childrenCount')?.clearValidators();
      this.calculatorForm.patchValue({ childrenCount: null });

      this.calculatorForm.get('frequency')?.clearValidators();
      this.calculatorForm.patchValue({ frequency: null });

      // À Paris (cityId=2) et Le Perreux (cityId=3) : un seul tarif de restauration, pas de sous-catégorie
      const cityId = this.calculatorForm.get('cityId')?.value;
      if (cityId === 2 || cityId === 3) {
        // Paris et Le Perreux : définir automatiquement REPAS sans sous-catégorie
        this.calculatorForm.patchValue({
          serviceType: 'REPAS',
          subCategory: null
        });
        this.calculatorForm.get('subCategory')?.clearValidators();
      } else {
        // Autres villes : subCategory requis (SANS_PAI / AVEC_PAI)
        this.calculatorForm.get('subCategory')?.setValidators([Validators.required]);
      }

      if (this.qfMode === 'direct') {
        this.calculatorForm.get('quotientFamilial')?.setValidators([Validators.required, Validators.min(0), Validators.max(999999)]);
      }
    }

    this.calculatorForm.get('childrenCount')?.updateValueAndValidity();
    this.calculatorForm.get('quotientFamilial')?.updateValueAndValidity();
    this.calculatorForm.get('frequency')?.updateValueAndValidity();
    this.calculatorForm.get('subCategory')?.updateValueAndValidity();
    this.calculatorForm.get('serviceType')?.updateValueAndValidity();
  }

  onSubCategoryChange(event: any): void {
    const selectedValue = event.target.value;
    let serviceType = null;

    if (this.mainCategory === 'PERISCOLAIRE') {
      const option = this.periscolaireOptions.find(o => o.value === selectedValue);
      serviceType = option?.serviceType;

      // Gestion spéciale pour le forfait goûter
      const cityId = this.calculatorForm.get('cityId')?.value;
      if (cityId === 2) { // Paris
        if (selectedValue === 'MERCREDI') {
          // Centre de loisirs du mercredi : PAS de forfait goûter
          this.calculatorForm.get('frequency')?.clearValidators();
          this.calculatorForm.patchValue({ frequency: null });
        } else {
          // Accueil du soir : forfait goûter requis
          this.calculatorForm.get('frequency')?.setValidators([Validators.required, Validators.min(1), Validators.max(4)]);
          if (!this.calculatorForm.get('frequency')?.value) {
            this.calculatorForm.patchValue({ frequency: 2 }); // Défaut: 2 goûters
          }
        }
        this.calculatorForm.get('frequency')?.updateValueAndValidity();
      }
    } else if (this.mainCategory === 'RESTAURATION') {
      const option = this.restaurationOptions.find(o => o.value === selectedValue);
      serviceType = option?.serviceType;
    }

    this.calculatorForm.patchValue({
      subCategory: selectedValue,
      serviceType: serviceType
    });

    // Mettre à jour la validation du serviceType
    this.calculatorForm.get('serviceType')?.updateValueAndValidity();
  }

  get filteredPeriscolaireOptions() {
    const cityId = this.calculatorForm.get('cityId')?.value;

    // Paris (cityId = 2) : seulement Accueil du soir (Paris) et Centre de loisirs du mercredi
    if (cityId === 2) {
      return this.periscolaireOptions.filter(o =>
        o.value === 'ACCUEIL_SOIR_PARIS' || o.value === 'MERCREDI'
      );
    }

    // Le Perreux-sur-Marne (cityId = 3) : Accueil matin, soir (Le Perreux), mercredi, Exception Lattre
    if (cityId === 3) {
      return this.periscolaireOptions.filter(o =>
        o.value !== 'ACCUEIL_SOIR_PARIS'  // Exclure la version Paris
      );
    }

    // Autres villes : toutes les options sauf l'exception Lattre et la version Paris
    return this.periscolaireOptions.filter(o =>
      o.value !== 'ACCUEIL_SOIR_SPECIFIQUE' && o.value !== 'ACCUEIL_SOIR_PARIS'
    );
  }

  getServiceTypeLabel(serviceType: string): string {
    switch (serviceType) {
      case 'CRECHE':
        return 'Crèche';
      case 'PERISCOLAIRE':
        return 'Accueil périscolaire';
      case 'MERCREDI':
        return 'Centre de loisirs du mercredi';
      case 'REPAS':
        return 'Restauration scolaire';
      default:
        return serviceType;
    }
  }

  get f() {
    return this.calculatorForm.controls;
  }
}
