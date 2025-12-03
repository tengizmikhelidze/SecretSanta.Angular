import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-landing',
  imports: [
    Header,
    Footer
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  private router = inject(Router);

  protected navigateToGenerator(): void {
    this.router.navigate(['/generator']);
  }
}
