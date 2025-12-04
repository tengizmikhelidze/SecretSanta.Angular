import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SecretSantaService } from '../../core/services/secret-santa.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AuthService } from '../../core/services/auth.service';
import type { PartyDetails } from '../../core/models/api.models';

@Component({
  selector: 'app-party',
  imports: [
    Header,
    Footer,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './party.html',
  styleUrl: './party.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Party implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private secretSantaService = inject(SecretSantaService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);

  protected readonly partyDetails = signal<PartyDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly currentUser = this.authService.user;

  async ngOnInit() {
    const partyId = this.route.snapshot.params['id'];
    const token = this.route.snapshot.queryParams['token'];

    if (!partyId) {
      this.router.navigate(['/']);
      return;
    }

    try {
      let partyData: PartyDetails | null = null;

      // Try to get party by access token if provided
      if (token) {
        partyData = await this.secretSantaService.getPartyByToken(token);
      } else {
        // Otherwise get party by ID (requires authentication)
        partyData = await this.secretSantaService.getParty(partyId);
      }

      if (partyData) {
        this.partyDetails.set(partyData);
      } else {
        this.errorHandler.showError('Party not found');
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error loading party:', error);
      this.errorHandler.showError(error, 'Failed to load party details');
      this.router.navigate(['/']);
    } finally {
      this.loading.set(false);
    }
  }

  protected getAssignedParticipant() {
    const party = this.partyDetails();
    if (!party || !party.userParticipant || !party.assignments) return null;

    const assignment = party.assignments.find(
      a => a.giver_id === party.userParticipant?.id
    );

    if (!assignment) return null;

    return party.participants.find(p => p.id === assignment.receiver_id);
  }

  protected isHost(): boolean {
    const party = this.partyDetails();
    if (!party || !party.userParticipant) return false;
    return party.userParticipant.is_host;
  }

  protected formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected goBack(): void {
    this.router.navigate(['/account']);
  }
}

