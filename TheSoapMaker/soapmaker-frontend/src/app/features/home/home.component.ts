import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home">
      <h1>Welcome to SoapMaker</h1>
      <p>Discover and share homemade soap recipes with a community of crafting enthusiasts.</p>
    </div>
  `,
  styles: [`
    .home { padding: 2rem; text-align: center; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
  `],
})
export class HomeComponent {}
