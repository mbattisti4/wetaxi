import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MobilityHeatmapComponent } from './mobility-heatmap/mobility-heatmap.component';

interface Transport {
  id: number;
  name: string;
  carbonFootprint: number;
  kmCost: number;
}

interface Trip {
  id: number;
  meanOfTransport: number;
  timeStart: string;
  timeEnd: string;
  people: number;
  coordOrigin: { lat: number; lng: number };
  coordDestination: { lat: number; lng: number };
  distance: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    MobilityHeatmapComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  transports: Transport[] = [];
  selectedTransport: Transport | null = null;
  loading = false;
  error = '';
  selectedTransportId: number | null = null;
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];

  // Statistiche calcolate
  avgDistance = 0;
  avgTimeMinutes = 0;
  avgCost = 0;
  totalFootprint = 0;

  // Percentuali mezzi di trasporto
  transportPercentages: Map<number, number> = new Map();

  private apiUrl = 'http://localhost:3000/api/transports';
  private tripsApiUrl = 'http://localhost:3000/api/trips';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTransports();
    this.loadTrips();
  }

  loadTransports() {
    this.loading = true;
    this.error = '';

    this.http.get<Transport[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.transports = data;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          'Failed to load transports. Make sure the API is running on port 3000.';
        this.loading = false;
        console.error('Error loading transports:', err);
      },
    });
  }

  loadTrips() {
    this.http.get<Trip[]>(this.tripsApiUrl).subscribe({
      next: (data) => {
        this.trips = data;
        this.calculateStats();
        this.calculateTransportPercentages();
      },
      error: (err) => {
        console.error('Error loading trips:', err);
      },
    });
  }

  calculateTransportPercentages() {
    if (this.trips.length === 0) return;

    // Conta i viaggi per ogni mezzo di trasporto
    const transportCounts = new Map<number, number>();

    this.trips.forEach((trip) => {
      const count = transportCounts.get(trip.meanOfTransport) || 0;
      transportCounts.set(trip.meanOfTransport, count + 1);
    });

    // Calcola le percentuali
    this.transportPercentages.clear();
    transportCounts.forEach((count, transportId) => {
      const percentage = (count / this.trips.length) * 100;
      this.transportPercentages.set(transportId, percentage);
    });
  }

  getTransportPercentage(transportId: number): number {
    return this.transportPercentages.get(transportId) || 0;
  }

  getTransportCount(transportId: number): number {
    return this.trips.filter((trip) => trip.meanOfTransport === transportId)
      .length;
  }

  selectTransportFromList(transport: Transport) {
    this.selectedTransport = transport;
    this.onTransportChange();
  }

  onTransportChange() {
    // Aggiorna l'ID del trasporto selezionato per il filtro
    this.selectedTransportId = this.selectedTransport
      ? this.selectedTransport.id
      : null;
    this.calculateStats();
  }

  calculateStats() {
    // Se non c'è un trasporto selezionato, calcola su tutti i viaggi
    if (!this.selectedTransportId) {
      this.filteredTrips = [...this.trips];
    } else {
      // Filtra i viaggi per il mezzo di trasporto selezionato
      this.filteredTrips = this.trips.filter(
        (trip) => trip.meanOfTransport === this.selectedTransportId
      );
    }

    if (this.filteredTrips.length === 0) {
      this.avgDistance = 0;
      this.avgTimeMinutes = 0;
      this.avgCost = 0;
      this.totalFootprint = 0;
      return;
    }

    // Calcola distanza media
    this.avgDistance =
      this.filteredTrips.reduce((sum, trip) => sum + trip.distance, 0) /
      this.filteredTrips.length;

    // Calcola tempo medio in minuti
    const totalMinutes = this.filteredTrips.reduce((sum, trip) => {
      const start = new Date(trip.timeStart);
      const end = new Date(trip.timeEnd);
      const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return sum + minutes;
    }, 0);
    this.avgTimeMinutes = totalMinutes / this.filteredTrips.length;

    // Calcola costo medio
    if (this.selectedTransport) {
      // Se c'è un trasporto selezionato, usa il suo costo
      this.avgCost = this.avgDistance * this.selectedTransport.kmCost;

      // Calcola footprint totale con il carbon footprint del trasporto selezionato
      const totalDistance = this.filteredTrips.reduce(
        (sum, trip) => sum + trip.distance,
        0
      );
      this.totalFootprint =
        totalDistance * this.selectedTransport.carbonFootprint;
    } else {
      // Se non c'è un trasporto selezionato, calcola la media pesata
      let totalCost = 0;
      let totalFootprint = 0;

      this.filteredTrips.forEach((trip) => {
        const transport = this.transports.find(
          (t) => t.id === trip.meanOfTransport
        );
        if (transport) {
          totalCost += trip.distance * transport.kmCost;
          totalFootprint += trip.distance * transport.carbonFootprint;
        }
      });

      this.avgCost = totalCost / this.filteredTrips.length;
      this.totalFootprint = totalFootprint;
    }
  }

  formatName(name: string): string {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // getTransportIcon(name: string): string {
  //   const icons: { [key: string]: string } = {
  //     bike: '🚲',
  //     electric_scooter: '🛴',
  //     bus: '🚌',
  //     metro: '🚇',
  //     electric_car: '🚗',
  //     car_petrol: '🚙',
  //     motorcycle: '🏍️',
  //     walk: '🚶',
  //     train: '🚆',
  //     car_sharing: '🚕',
  //   };
  //   return icons[name] || '🚗';
  // }

  getComparisonText(): string {
    if (!this.selectedTransport) return '';
    const cf = this.selectedTransport.carbonFootprint;
    if (cf === 0) return 'Zero emissions - Excellent environmental choice!';
    if (cf < 1) return 'Low carbon footprint - Good environmental choice';
    if (cf < 2) return 'Moderate carbon footprint - Consider alternatives';
    return 'High carbon footprint - Consider eco-friendly alternatives';
  }
}
