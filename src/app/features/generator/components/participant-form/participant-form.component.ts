import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-participant-form',
  imports: [ReactiveFormsModule],
  template: `
    <div class="participant-form" [formGroup]="formGroup()">
      <div class="form-field">
        <label [for]="'name-' + index()">Name</label>
        <input
          [id]="'name-' + index()"
          type="text"
          formControlName="name"
          placeholder="Enter name">
      </div>

      <div class="form-field">
        <label [for]="'email-' + index()">Email</label>
        <input
          [id]="'email-' + index()"
          type="email"
          formControlName="email"
          placeholder="Enter email">
      </div>

      @if (showRemoveButton()) {
        <button
          type="button"
          (click)="remove.emit()"
          class="remove-btn">
          Remove
        </button>
      }
    </div>
  `,
  styles: [`
    .participant-form {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    input {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
    }

    .remove-btn {
      padding: 0.5rem 1rem;
      background: #fee;
      color: #dc2626;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantFormComponent {
  formGroup = input.required<FormGroup>();
  index = input.required<number>();
  showRemoveButton = input<boolean>(true);
  remove = output<void>();
}

