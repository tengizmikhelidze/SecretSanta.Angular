import { Component, signal, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { SecretSantaService } from '../../core/services/secret-santa.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AuthService } from '../../core/services/auth.service';
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
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './assignment-management.html',
  styleUrl: './assignment-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentManagement implements OnInit {
  private secretSantaService = inject(SecretSantaService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  protected readonly partyDetails = signal<PartyDetails | null>(null);
  protected readonly accessToken = signal<string | null>(null);
  protected readonly isAuthenticated = computed(() => !!this.authService.user());

  protected readonly assignments = signal<Assignment[]>([]);
  protected readonly myAssignment = signal<MyAssignment | null>(null);
  protected readonly loading = signal(true);
  protected readonly generatingAssignments = signal(false);
  protected readonly deletingAssignments = signal(false);
  protected readonly assignmentsGenerated = signal(false);
  protected readonly showExclusionManager = signal(false);
  protected readonly exclusions = signal<any[]>([]);

  // Track which assignment rows are visible (for host with host_can_see_all)
  protected readonly visibleAssignments = signal<Set<number>>(new Set());

  ngOnInit() {
    // This component receives party details via input or route
  }

  /**
   * Initialize with party details and optional access token
   */
  setPartyDetails(partyDetails: PartyDetails, accessToken: string | null = null): void {
    this.partyDetails.set(partyDetails);
    this.accessToken.set(accessToken);
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
      let data: any = null;
      const token = this.accessToken();

      // If we have an access token and user is not authenticated, use public endpoint
      if (token && !this.isAuthenticated()) {
        try {
          data = await this.secretSantaService.getAssignmentsByToken(currentParty.party.id, token);
        } catch (publicError: any) {
          // If public endpoint fails, we'll try to derive from party details below
          console.warn('Public assignments endpoint not available:', publicError);
        }
      } else if (this.isAuthenticated()) {
        // Use authenticated endpoint
        try {
          data = await this.secretSantaService.getAssignments(currentParty.party.id);
        } catch (authError: any) {
          console.warn('Authenticated assignments endpoint failed:', authError);
        }
      }

      // If we got data from the API, use it
      if (data && data.generated) {
        this.assignmentsGenerated.set(true);

        // If user is host and can see all
        if (data.assignments && Array.isArray(data.assignments)) {
          this.assignments.set(data.assignments);
        }

        // If user is participant
        if (data.myAssignment) {
          this.myAssignment.set(data.myAssignment);
        }
      } else {
        // Fallback: Try to derive assignment from partyDetails
        // This works when party was fetched via token and includes assignment data
        const hasAssignmentsInParty = currentParty.assignments && currentParty.assignments.length > 0;
        this.assignmentsGenerated.set(hasAssignmentsInParty);

        if (hasAssignmentsInParty) {
          // Always try to find and set the user's own assignment if they are a participant
          if (currentParty.userParticipant) {
            const userAssignment = currentParty.assignments.find(
              a => a.giver_id === currentParty.userParticipant!.id
            );

            if (userAssignment) {
              // Find the receiver participant
              const receiver = currentParty.participants.find(
                p => p.id === userAssignment.receiver_id
              );

              if (receiver) {
                this.myAssignment.set({
                  receiver: {
                    id: receiver.id,
                    name: receiver.name,
                    email: receiver.email
                  },
                  wishlist: receiver.wishlist || undefined,
                  wishlistDescription: receiver.wishlist_description || undefined
                });
                console.log('User assignment set from partyDetails:', this.myAssignment());
              }
            }
          }

          // If host can see all, populate the assignments list
          if (this.canSeeAllAssignments()) {
            const formattedAssignments = currentParty.assignments.map(assignment => {
              const giver = currentParty.participants.find(p => p.id === assignment.giver_id);
              const receiver = currentParty.participants.find(p => p.id === assignment.receiver_id);
              return {
                id: assignment.id,
                giver: {
                  id: giver?.id || 0,
                  name: giver?.name || 'Unknown',
                  email: giver?.email || ''
                },
                receiver: {
                  id: receiver?.id || 0,
                  name: receiver?.name || 'Unknown',
                  email: receiver?.email || ''
                },
                createdAt: assignment.created_at
              };
            });
            this.assignments.set(formattedAssignments);
          }
        }
      }

      // Load exclusions if host and authenticated
      if (this.isHost() && this.isAuthenticated()) {
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
   * Toggle visibility of a specific assignment
   */
  protected toggleAssignmentVisibility(assignmentId: number): void {
    const current = this.visibleAssignments();
    const newSet = new Set(current);
    if (newSet.has(assignmentId)) {
      newSet.delete(assignmentId);
    } else {
      newSet.add(assignmentId);
    }
    this.visibleAssignments.set(newSet);
  }

  /**
   * Check if an assignment is visible
   */
  protected isAssignmentVisible(assignmentId: number): boolean {
    return this.visibleAssignments().has(assignmentId);
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

