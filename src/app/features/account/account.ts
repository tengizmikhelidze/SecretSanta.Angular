import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { AuthService } from '../../core/services/auth.service';

interface PartyListItem {
  id: string;
  partyDate?: string;
  location?: string;
  participantCount: number;
  status: string;
  isHost: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-account',
  imports: [
    Header,
    Footer,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './account.html',
  styleUrl: './account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Account implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  protected readonly user = this.authService.user;
  protected readonly isLoading = signal(false);
  protected readonly parties = signal<PartyListItem[]>([]);
  protected readonly showOldPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Redirect if not authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadUserParties();
  }

  private async loadUserParties(): Promise<void> {
    this.isLoading.set(true);

    try {
      // TODO: Replace with actual HTTP call
      await this.delay(1000);

      // Mock data
      const mockParties: PartyListItem[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          partyDate: '2025-12-25',
          location: 'Office',
          participantCount: 10,
          status: 'active',
          isHost: true,
          createdAt: '2025-12-01T10:00:00Z'
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          partyDate: '2025-12-20',
          location: 'Home',
          participantCount: 5,
          status: 'created',
          isHost: false,
          createdAt: '2025-11-15T14:30:00Z'
        }
      ];

      this.parties.set(mockParties);
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid || this.isLoading()) return;

    const { newPassword, confirmPassword, oldPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.snackBar.open('❌ Passwords do not match', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.changePassword(oldPassword!, newPassword!);

      this.snackBar.open('✅ Password changed successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });

      this.passwordForm.reset();
    } catch (error) {
      this.snackBar.open('❌ Failed to change password. Please check your old password.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  protected viewParty(partyId: string): void {
    this.router.navigate(['/party', partyId]);
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

