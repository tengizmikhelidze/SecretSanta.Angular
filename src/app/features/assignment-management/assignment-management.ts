import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { SecretSantaService } from '../../core/services/secret-santa.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import type { PartyDetails } from '../../core/models/api.models';

interface Assignment {
  id: number;
  giver: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface MyAssignment {
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  wishlist?: string;
  wishlistDescription?: string;
}

@Component({
  selector: 'app-assignment-management',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './assignment-management.html',
  styleUrl: './assignment-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentManagement implements OnInit {
  private secretSantaService = inject(SecretSantaService);
  private errorHandler = inject(ErrorHandlerService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  protected readonly partyDetails = signal<PartyDetails | null>(null);

  protected readonly assignments = signal<Assignment[]>([]);
  protected readonly myAssignment = signal<MyAssignment | null>(null);
  protected readonly loading = signal(true);
  protected readonly generatingAssignments = signal(false);
  protected readonly deletingAssignments = signal(false);
  protected readonly assignmentsGenerated = signal(false);
  protected readonly showExclusionManager = signal(false);
  protected readonly exclusions = signal<any[]>([]);

  ngOnInit() {
    // This component receives party details via input or route
  }

  /**
   * Initialize with party details
   */
  setPartyDetails(partyDetails: PartyDetails): void {
    this.partyDetails.set(partyDetails);
    this.loadAssignments();
  }

  /**
   * Load assignments for the party
   */
  private async loadAssignments(): Promise<void> {
    const currentParty = this.partyDetails();
    if (!currentParty) return;

    this.loading.set(true);

    try {
      const data = await this.secretSantaService.getAssignments(currentParty.party.id);

      this.assignmentsGenerated.set(data.generated ?? false);

      if (data.generated) {
        // If user is host and can see all
        if (data.assignments && Array.isArray(data.assignments)) {
          this.assignments.set(data.assignments);
        }

        // If user is participant
        if (data.myAssignment) {
          this.myAssignment.set(data.myAssignment);
        }
      }

      // Load exclusions if host
      if (this.isHost()) {
        await this.loadExclusions();
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      // Don't show error if assignments haven't been generated yet
      if (this.assignmentsGenerated()) {
        this.errorHandler.showError(error, 'Failed to load assignments');
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load exclusions
   */
  private async loadExclusions(): Promise<void> {
    const currentParty = this.partyDetails();
    if (!currentParty) return;

    try {
      const data = await this.secretSantaService.getExclusions(currentParty.party.id);
      this.exclusions.set(data);
    } catch (error) {
      console.error('Error loading exclusions:', error);
    }
  }

  /**
   * Check if current user is the host
   */
  protected isHost(): boolean {
    const currentParty = this.partyDetails();
    return currentParty?.userParticipant?.is_host ?? false;
  }

  /**
   * Check if assignments are generated
   */
  protected hasAssignments(): boolean {
    return this.assignmentsGenerated();
  }

  /**
   * Check if user has their assignment
   */
  protected hasMyAssignment(): boolean {
    return !!this.myAssignment();
  }

  /**
   * Check if host can see all assignments
   */
  protected canSeeAllAssignments(): boolean {
    const currentParty = this.partyDetails();
    return (currentParty?.party.host_can_see_all ?? false) && this.isHost();
  }

  /**
   * Generate assignments
   */
  protected async generateAssignments(): Promise<void> {
    const currentParty = this.partyDetails();
    if (!currentParty) return;

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Generate Assignments?',
        message: 'This will generate Secret Santa assignments for all participants. Participants will be notified via email.',
        confirmText: 'Generate',
        cancelText: 'Cancel',
        confirmColor: 'primary'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;

    this.generatingAssignments.set(true);

    try {
      const result = await this.secretSantaService.generateAssignments(
        currentParty.party.id,
        {
          sendEmails: true,
          lockAfterGeneration: false
        }
      );

      this.errorHandler.showSuccess('Secret Santa assignments generated successfully!');
      this.assignmentsGenerated.set(true);

      // Reload assignments
      await this.loadAssignments();
    } catch (error: any) {
      this.errorHandler.showError(error);
    } finally {
      this.generatingAssignments.set(false);
    }
  }

  /**
   * Delete assignments
   */
  protected async deleteAssignments(): Promise<void> {
    const currentParty = this.partyDetails();
    if (!currentParty) return;

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Delete Assignments?',
        message: 'This will delete all Secret Santa assignments. You can generate new ones afterward.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) return;

    this.deletingAssignments.set(true);

    try {
      await this.secretSantaService.deleteAssignments(currentParty.party.id);

      this.errorHandler.showSuccess('Assignments deleted successfully');
      this.assignmentsGenerated.set(false);
      this.assignments.set([]);
      this.myAssignment.set(null);
    } catch (error) {
      this.errorHandler.showError(error, 'Failed to delete assignments');
    } finally {
      this.deletingAssignments.set(false);
    }
  }
}

