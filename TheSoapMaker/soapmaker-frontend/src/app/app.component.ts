import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main>
      <router-outlet />
    </main>
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);

  ngOnInit(): void {
    // Connectivity check — verifies backend is reachable on startup
    this.http.get(`${environment.apiUrl}/health/`).subscribe({
      next: (res) => console.log('[SoapMaker] Backend health:', res),
      error: (err) => console.warn('[SoapMaker] Backend health check failed:', err.message),
    });
  }
}
