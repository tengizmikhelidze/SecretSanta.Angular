import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SecretSantaService } from '../../core/services/secret-santa.service';
import { AuthService } from '../../core/services/auth.service';
import { uniqueEmailInArrayValidator } from '../../core/validators/unique-email.validator';
import { Subject, takeUntil, debounceTime } from 'rxjs';

interface Participant {
  name: string;
  email: string;
  isHost: boolean;
}

interface PartyFormData {
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  participants: Participant[];
  personalMessage: string;
  hostCanSeeAll: boolean;
  termsAccepted: boolean;
}

@Component({
  selector: 'app-generator',
  imports: [
    Header,
    Footer,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './generator.html',
  styleUrl: './generator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)'
  }
})
export class Generator implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private secretSantaService = inject(SecretSantaService);
  private destroy$ = new Subject<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly hasUnsavedChanges = signal(false);
  private readonly STORAGE_KEY = 'secretSantaFormData';
  private readonly TIMESTAMP_KEY = 'secretSantaFormTimestamp';

  protected readonly partyForm = this.fb.group({
    partyDate: [''],
    location: [''],
    maxAmount: [null as number | null],
    participants: this.fb.array([], [Validators.minLength(4), uniqueEmailInArrayValidator()]),
    personalMessage: ['', Validators.maxLength(500)],
    hostCanSeeAll: [false],
    termsAccepted: [false, Validators.requiredTrue]
  });

  protected readonly participantsArray = this.partyForm.get('participants') as FormArray;

  protected readonly participantCount = computed(() => this.participantsArray.length);
  protected readonly canRemoveParticipants = computed(() => this.participantCount() > 4);
  protected readonly isFormValid = signal(false);

  constructor() {
    // Get logged-in user data
    const currentUser = this.authService.user();

    // Initialize with 4 participant rows
    // First row is host - pre-filled if user is logged in
    if (currentUser) {
      this.addParticipant(true, currentUser.full_name || currentUser.email.split('@')[0], currentUser.email);
    } else {
      this.addParticipant(true); // Empty host row
    }

    this.addParticipant();
    this.addParticipant();
    this.addParticipant();

    // Track form validity
    this.partyForm.statusChanges.subscribe(() => {
      this.isFormValid.set(this.partyForm.valid);
    });
  }

  ngOnInit(): void {
    // Check for saved form data
    this.checkForSavedData();

    // Auto-save form data on changes
    this.partyForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000)
      )
      .subscribe(() => {
        this.saveFormData();
        this.hasUnsavedChanges.set(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() && !this.isSubmitting()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private checkForSavedData(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(this.TIMESTAMP_KEY);

    if (savedData && savedTimestamp) {
      const timestamp = new Date(savedTimestamp);
      const hoursSinceLastSave = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);

      // Only restore if saved within last 24 hours
      if (hoursSinceLastSave < 24) {
        const snackBarRef = this.snackBar.open(
          '📋 Found unsaved data from your previous session. Would you like to restore it?',
          'Restore',
          {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['info-snackbar']
          }
        );

        snackBarRef.onAction().subscribe(() => {
          this.restoreFormData(savedData);
        });
      } else {
        // Clear old data
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.TIMESTAMP_KEY);
      }
    }
  }

  private saveFormData(): void {
    const formValue = this.partyForm.value;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(formValue));
    localStorage.setItem(this.TIMESTAMP_KEY, new Date().toISOString());
  }

  private restoreFormData(savedData: string): void {
    try {
      const data = JSON.parse(savedData);

      // Clear existing participants
      while (this.participantsArray.length > 0) {
        this.participantsArray.removeAt(0);
      }

      // Restore participants
      if (data.participants && Array.isArray(data.participants)) {
        data.participants.forEach((participant: any) => {
          const participantForm = this.fb.group({
            name: [participant.name || '', Validators.required],
            email: [participant.email || '', [Validators.required, Validators.email]],
            isHost: [participant.isHost || false]
          });
          this.participantsArray.push(participantForm);
        });
      }

      // Ensure minimum 4 participants
      while (this.participantsArray.length < 4) {
        this.addParticipant();
      }

      // Restore other form fields
      this.partyForm.patchValue({
        partyDate: data.partyDate || '',
        location: data.location || '',
        maxAmount: data.maxAmount || null,
        personalMessage: data.personalMessage || '',
        hostCanSeeAll: data.hostCanSeeAll || false,
        termsAccepted: data.termsAccepted || false
      });

      // Trigger validation
      this.participantsArray.updateValueAndValidity();

      this.snackBar.open('✅ Form data restored successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error restoring form data:', error);
      this.snackBar.open('⚠️ Failed to restore form data', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    }
  }

  protected addParticipant(isHost: boolean = false, name: string = '', email: string = ''): void {
    const participantForm = this.fb.group({
      name: [name, Validators.required],
      email: [email, [Validators.required, Validators.email]],
      isHost: [isHost]
    });

    this.participantsArray.push(participantForm);

    // Trigger validation
    this.participantsArray.updateValueAndValidity();
  }

  protected removeParticipant(index: number): void {
    if (index === 0) return; // Cannot remove host
    if (this.participantsArray.length <= 4) return; // Minimum 4 participants

    this.participantsArray.removeAt(index);

    // Trigger validation
    this.participantsArray.updateValueAndValidity();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const csv = e.target?.result as string;
      this.parseCsvAndFillForm(csv);
    };

    reader.readAsText(file);
  }

  private parseCsvAndFillForm(csv: string): void {
    const lines = csv.split('\n').filter(line => line.trim());

    // Skip header row if exists
    const startIndex = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('email') ? 1 : 0;

    // Clear existing participants except host
    while (this.participantsArray.length > 1) {
      this.participantsArray.removeAt(1);
    }

    // Parse CSV lines
    for (let i = startIndex; i < lines.length; i++) {
      const [name, email] = lines[i].split(',').map(s => s.trim());

      if (name && email) {
        if (i === startIndex && this.participantsArray.length > 0) {
          // Update host
          this.participantsArray.at(0).patchValue({ name, email });
        } else {
          // Add new participant
          const participantForm = this.fb.group({
            name: [name, Validators.required],
            email: [email, [Validators.required, Validators.email]],
            isHost: [false]
          });
          this.participantsArray.push(participantForm);
        }
      }
    }

    // Ensure minimum 4 participants
    while (this.participantsArray.length < 4) {
      this.addParticipant();
    }

    // Trigger validation
    this.participantsArray.updateValueAndValidity();
  }

  protected async onSubmit(): Promise<void> {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.partyForm);

    if (this.partyForm.invalid) {
      // Scroll to first error
      this.scrollToFirstError();

      // Show error snackbar
      this.snackBar.open('❌ Please fix all validation errors before submitting', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });

      return;
    }

    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const formData: PartyFormData = {
        partyDate: this.partyForm.value.partyDate || undefined,
        location: this.partyForm.value.location || undefined,
        maxAmount: this.partyForm.value.maxAmount || undefined,
        participants: (this.partyForm.value.participants || []) as Participant[],
        personalMessage: this.partyForm.value.personalMessage || '',
        hostCanSeeAll: this.partyForm.value.hostCanSeeAll || false,
        termsAccepted: this.partyForm.value.termsAccepted || false
      };

      const result = await this.secretSantaService.createParty(formData);

      // Clear saved form data on success
      localStorage.removeItem('secretSantaFormData');
      localStorage.removeItem('secretSantaFormTimestamp');

      // Show success snackbar
      this.snackBar.open('🎉 Party created successfully!', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });

      // Navigate to success page
      this.router.navigate(['/success', result.party.id]);

    } catch (error) {
      const errorMessage = 'Failed to create party. Please try again.';
      this.submitError.set(errorMessage);

      // Show error snackbar
      this.snackBar.open('❌ ' + errorMessage, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });

      console.error('Error creating party:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private markFormGroupTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach((arrayControl: any) => {
          this.markFormGroupTouched(arrayControl);
        });
      }
    });
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      // Try to find Material form field with error first
      let firstErrorElement = document.querySelector('.mat-mdc-form-field.ng-invalid .mat-mdc-form-field-error');

      // If not found, try to find any invalid and touched field
      if (!firstErrorElement) {
        firstErrorElement = document.querySelector('.mat-mdc-form-field.ng-invalid.ng-touched');
      }

      // If still not found, try checkbox errors
      if (!firstErrorElement) {
        firstErrorElement = document.querySelector('.mat-mdc-checkbox.ng-invalid.ng-touched');
      }

      // If still not found, look for any validation error message
      if (!firstErrorElement) {
        firstErrorElement = document.querySelector('.terms-error, .error-message');
      }

      if (firstErrorElement) {
        // Get the parent form field or section
        const scrollTarget = firstErrorElement.closest('.mat-mdc-form-field')
          || firstErrorElement.closest('.checkbox-group')
          || firstErrorElement.closest('.participant-row')
          || firstErrorElement;

        scrollTarget.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Also try to focus the input if possible
        const input = scrollTarget.querySelector('input, textarea') as HTMLElement;
        if (input && typeof input.focus === 'function') {
          setTimeout(() => input.focus(), 300);
        }
      }
    }, 150);
  }

  protected triggerFileInput(): void {
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    fileInput?.click();
  }
}

