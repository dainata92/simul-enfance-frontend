import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CalculationRequest {
  cityId: number;
  serviceType: string;
  quotientFamilial: number;
  childrenCount: number;
  frequency?: number;          // Fréquence/forfait pour périscolaire (1-4 goûters)
}

export interface CalculationResult {
  hourlyPrice: number;
  monthlyPrice: number;
  servicePrice?: number;      // Prix par prestation (journée, matin, soir, etc.)
  unitType?: string;           // HOURLY ou PER_SERVICE
  calculationType: string;
  cityName: string;
  serviceType: string;
  quotientFamilial: number;
  childrenCount: number;
  frequency?: number;          // Fréquence/forfait (ex: nombre de goûters/semaine)
  bracketCategory?: string;  // Catégorie (A, B, C, D, E, F, G)
  bracketDescription?: string; // Description de la tranche
}

export interface City {
  id: number;
  name: string;
  postalCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  calculatePrice(request: CalculationRequest): Observable<CalculationResult> {
    return this.http.post<CalculationResult>(`${this.apiUrl}/calculate`, request);
  }

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}/cities`);
  }
}
