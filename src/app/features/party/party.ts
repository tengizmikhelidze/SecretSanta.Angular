import { Component, signal, inject, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { AssignmentManagement } from '../assignment-management/assignment-management';
import { SecretSantaService } from '../../core/services/secret-santa.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
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
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    AssignmentManagement
  ],
  templateUrl: './party.html',
  styleUrl: './party.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Party implements OnInit {
  @ViewChild(AssignmentManagement) assignmentComponent!: AssignmentManagement;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private secretSantaService = inject(SecretSantaService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);

  protected readonly partyDetails = signal<PartyDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
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

        // Initialize assignment component with party details
        setTimeout(() => {
          if (this.assignmentComponent) {
            this.assignmentComponent.setPartyDetails(partyData);
          }
        }, 0);
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

  protected canDelete(): boolean {
    const party = this.partyDetails();
    const user = this.currentUser();

    // Must be logged in
    if (!user) return false;

    // Must be the host
    if (!party || !party.userParticipant || !party.userParticipant.is_host) return false;

    // Host's email must match current user's email
    return party.party.host_email === user.email;
  }

  protected async deleteParty(): Promise<void> {
    if (this.deleting()) return;

    const party = this.partyDetails();
    if (!party) return;

    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete Party?',
        message: `Are you sure you want to delete "${party.party.location || 'this party'}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();

    if (!confirmed) return;

    this.deleting.set(true);

    try {
      await this.secretSantaService.deleteParty(party.party.id);

      this.errorHandler.showSuccess('Party deleted successfully');

      // Navigate back to account page
      this.router.navigate(['/account']);
    } catch (error) {
      this.errorHandler.showError(error, 'Failed to delete party');
    } finally {
      this.deleting.set(false);
    }
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

