import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { SecretSantaService } from '../../core/services/secret-santa.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

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
  private secretSantaService = inject(SecretSantaService);
  private errorHandler = inject(ErrorHandlerService);

  protected readonly user = this.authService.user;
  protected readonly isLoading = signal(false);
  protected readonly isResendingVerification = signal(false);
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
      const accountData = await this.secretSantaService.getUserParties();

      // Transform to PartyListItem format and fetch participant counts
      const hostedPartiesPromises = accountData.hostedParties.map(async party => {
        // Fetch full party details to get participant count
        const partyDetails = await this.secretSantaService.getParty(party.id);

        return {
          id: party.id,
          partyDate: party.party_date || undefined,
          location: party.location || undefined,
          participantCount: partyDetails?.participants.length || 0,
          status: party.status,
          isHost: true,
          createdAt: party.created_at
        };
      });

      const participantPartiesPromises = accountData.participantParties.map(async party => {
        // Fetch full party details to get participant count
        const partyDetails = await this.secretSantaService.getParty(party.id);

        return {
          id: party.id,
          partyDate: party.party_date || undefined,
          location: party.location || undefined,
          participantCount: partyDetails?.participants.length || 0,
          status: party.status,
          isHost: false,
          createdAt: party.created_at
        };
      });

      // Wait for all party details to be fetched
      const [hostedParties, participantParties] = await Promise.all([
        Promise.all(hostedPartiesPromises),
        Promise.all(participantPartiesPromises)
      ]);

      const allParties = [...hostedParties, ...participantParties];
      this.parties.set(allParties);
    } catch (error) {
      console.error('Error loading parties:', error);
      this.errorHandler.showError(error, 'Failed to load parties');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid || this.isLoading()) return;

    const {newPassword, confirmPassword, oldPassword} = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorHandler.showError('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.authService.changePassword(oldPassword!, newPassword!);

      this.errorHandler.showSuccess('Password changed successfully!');

      this.passwordForm.reset();
    } catch (error) {
      this.errorHandler.showError(error, 'Failed to change password');
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

  protected async resendVerificationEmail(): Promise<void> {
    if (this.isResendingVerification()) return;

    this.isResendingVerification.set(true);

    try {
      await this.authService.resendVerificationEmail();
      this.errorHandler.showSuccess('Verification email sent! Please check your inbox.');
    } catch (error) {
      this.errorHandler.showError(error, 'Failed to send verification email');
    } finally {
      this.isResendingVerification.set(false);
    }
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

