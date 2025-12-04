import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

type VerificationState = 'verifying' | 'success' | 'error' | 'invalid';

@Component({
  selector: 'app-verify-email',
  imports: [
    Header,
    Footer,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  protected readonly state = signal<VerificationState>('verifying');
  protected readonly errorMessage = signal<string>('');

  async ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.state.set('invalid');
      this.errorMessage.set('No verification token provided');
      return;
    }

    await this.verifyEmail(token);
  }

  private async verifyEmail(token: string): Promise<void> {
    this.state.set('verifying');

    try {
      await this.authService.verifyEmail(token);

      this.state.set('success');
      this.errorHandler.showSuccess('Email verified successfully!');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/account']);
        } else {
          this.router.navigate(['/']);
        }
      }, 3000);

    } catch (error: any) {
      this.state.set('error');

      // Extract error message
      const message = error?.message || 'Email verification failed';
      this.errorMessage.set(message);

      console.error('Email verification error:', error);
    }
  }

  protected goToLogin(): void {
    this.router.navigate(['/']);
  }

  protected goToAccount(): void {
    this.router.navigate(['/account']);
  }

  protected goHome(): void {
    this.router.navigate(['/']);
  }
}

