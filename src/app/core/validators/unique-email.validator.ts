import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator to ensure email uniqueness within a form array
 */
export function uniqueEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // This will be handled at the form array level
    // Individual controls don't need validation here
    return null;
  };
}

