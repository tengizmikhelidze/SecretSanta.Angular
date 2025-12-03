import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SecretSantaService } from '../../core/services/secret-santa.service';

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
    MatChipsModule
  ],
  templateUrl: './generator.html',
  styleUrl: './generator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Generator {
  private fb = inject(FormBuilder);
  private secretSantaService = inject(SecretSantaService);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly partyForm = this.fb.group({
    partyDate: [''],
    location: [''],
    maxAmount: [null as number | null],
    participants: this.fb.array([], [Validators.minLength(4)]),
    personalMessage: ['', Validators.maxLength(500)],
    hostCanSeeAll: [false],
    termsAccepted: [false, Validators.requiredTrue]
  });

  protected readonly participantsArray = this.partyForm.get('participants') as FormArray;

  protected readonly participantCount = computed(() => this.participantsArray.length);
  protected readonly canRemoveParticipants = computed(() => this.participantCount() > 4);
  protected readonly isFormValid = signal(false);

  constructor() {
    // Initialize with 4 empty participant rows (first one is host)
    this.addParticipant(true); // Host
    this.addParticipant();
    this.addParticipant();
    this.addParticipant();

    // Track form validity
    this.partyForm.statusChanges.subscribe(() => {
      this.isFormValid.set(this.partyForm.valid);
    });
  }

  protected addParticipant(isHost: boolean = false): void {
    const participantForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isHost: [isHost]
    });

    this.participantsArray.push(participantForm);

    // Revalidate unique emails
    this.validateUniqueEmails();
  }

  protected removeParticipant(index: number): void {
    if (index === 0) return; // Cannot remove host
    if (this.participantsArray.length <= 4) return; // Minimum 4 participants

    this.participantsArray.removeAt(index);
    this.validateUniqueEmails();
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

    this.validateUniqueEmails();
  }

  private validateUniqueEmails(): void {
    const emails = this.participantsArray.controls
      .map(control => control.get('email')?.value)
      .filter(email => email);

    const emailCounts = new Map<string, number>();
    emails.forEach(email => {
      emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    });

    // Set errors on duplicate emails
    this.participantsArray.controls.forEach(control => {
      const email = control.get('email')?.value;
      const emailControl = control.get('email');

      if (email && emailCounts.get(email)! > 1) {
        emailControl?.setErrors({ ...emailControl.errors, duplicate: true });
      } else if (emailControl?.hasError('duplicate')) {
        const errors = { ...emailControl.errors };
        delete errors['duplicate'];
        emailControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.partyForm.invalid || this.isSubmitting()) return;

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

      // Navigate to success page or show success message
      console.log('Party created successfully:', result);

      // TODO: Navigate to success/confirmation page
      // this.router.navigate(['/party', result.id]);

    } catch (error) {
      this.submitError.set('Failed to create party. Please try again.');
      console.error('Error creating party:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected triggerFileInput(): void {
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    fileInput?.click();
  }
}

