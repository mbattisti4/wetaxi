import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Trip {
  id: number;
  meanOfTransport: number;
  timeStart: string;
  timeEnd: string;
  people: number;
  coordOrigin: { lat: number; lng: number };
  coordDestination: { lat: number; lng: number };
  distance: number;
}

@Injectable({
  providedIn: 'root'
})
export class TripsService {
  private apiUrl = 'http://localhost:3000/api/trips';
  private tripsSubject = new BehaviorSubject<Trip[]>([]);
  public trips$ = this.tripsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl).pipe(
      tap(trips => this.tripsSubject.next(trips))
    );
  }

  getTrips(): Trip[] {
    return this.tripsSubject.value;
  }
}