import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

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

declare const google: any;

@Component({
  selector: 'app-mobility-heatmap',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    FormsModule
  ],
  templateUrl: './mobility-heatmap.component.html',
  styleUrls: ['./mobility-heatmap.component.css']
})
export class MobilityHeatmapComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Input() filterTransportId: number | null = null;
  
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  loading = false;
  error = '';
  viewType: 'origin' | 'destination' | 'both' = 'both';
  totalDistance = 0;

  private map: any;
  private heatmap: any;
  private apiUrl = 'http://localhost:3000/api/trips';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTrips();
    this.loadGoogleMapsScript();
  }

  ngAfterViewInit() {
    // Map will be initialized after Google Maps loads
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterTransportId']) {
      this.filterTrips();
      this.updateHeatmap();
    }
  }

  filterTrips() {
    if (this.filterTransportId === null) {
      this.filteredTrips = [...this.trips];
    } else {
      this.filteredTrips = this.trips.filter(
        trip => trip.meanOfTransport === this.filterTransportId
      );
    }
    this.totalDistance = this.filteredTrips.reduce((sum, trip) => sum + trip.distance, 0);
  }

  loadGoogleMapsScript() {
    if (typeof google !== 'undefined' && google.maps) {
      this.initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCdCyQQyZC74gri7rqCbYNZgzIvL8uI-G4&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initMap();
    };
    document.head.appendChild(script);
  }

  loadTrips() {
    this.loading = true;
    this.error = '';

    this.http.get<Trip[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.trips = data;
        this.filterTrips();
        this.loading = false;
        this.updateHeatmap();
      },
      error: (err) => {
        this.error = 'Failed to load trips. Make sure the API is running.';
        this.loading = false;
        console.error('Error loading trips:', err);
      }
    });
  }

  initMap() {
    if (!this.mapContainer || this.map) return;

    // Center on Turin
    const turinCenter = { lat: 45.0703, lng: 7.6869 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: turinCenter,
      zoom: 12,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.updateHeatmap();
  }

  updateHeatmap() {
    console.log("updateHeatmap");
    if (!this.map || this.filteredTrips.length === 0) return;

    // Remove existing heatmap
    if (this.heatmap) {
      this.heatmap.setMap(null);
    }

    // Prepare heatmap data based on view type
    const heatmapData: any[] = [];

    this.filteredTrips.forEach(trip => {
      if (this.viewType === 'origin' || this.viewType === 'both') {
        heatmapData.push({
          location: new google.maps.LatLng(
            trip.coordOrigin.lat,
            trip.coordOrigin.lng
          ),
          weight: trip.people
        });
      }

      if (this.viewType === 'destination' || this.viewType === 'both') {
        heatmapData.push({
          location: new google.maps.LatLng(
            trip.coordDestination.lat,
            trip.coordDestination.lng
          ),
          weight: trip.people
        });
      }
    });

    // Create heatmap layer
    this.heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: this.map,
      radius: 20,
      opacity: 0.6,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });
  }
}