import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator factory that checks for duplicate emails across all participants
 * Must be applied to the FormArray, not individual controls
 */
export function uniqueEmailInArrayValidator(): ValidatorFn {
  return (formArray: AbstractControl): ValidationErrors | null => {
    if (!(formArray instanceof Object) || !Array.isArray((formArray as any).controls)) {
      return null;
    }

    const controls = (formArray as any).controls;
    const emails = controls
      .map((control: any) => control.get('email')?.value)
      .filter((email: string) => email && email.trim() !== '');

    const emailCounts = new Map<string, number>();
    emails.forEach((email: string) => {
      const lowerEmail = email.toLowerCase().trim();
      emailCounts.set(lowerEmail, (emailCounts.get(lowerEmail) || 0) + 1);
    });

    // Mark individual controls with duplicate error
    let hasDuplicates = false;
    controls.forEach((control: any) => {
      const emailControl = control.get('email');
      const email = emailControl?.value;

      if (email && email.trim() !== '') {
        const lowerEmail = email.toLowerCase().trim();
        const count = emailCounts.get(lowerEmail) || 0;

        if (count > 1) {
          hasDuplicates = true;
          // Set duplicate error on the email control
          const currentErrors = emailControl.errors || {};
          emailControl.setErrors({ ...currentErrors, duplicate: true });
        } else {
          // Remove duplicate error if it exists
          if (emailControl.hasError('duplicate')) {
            const currentErrors = { ...emailControl.errors };
            delete currentErrors['duplicate'];
            emailControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
          }
        }
      }
    });

    return hasDuplicates ? { duplicateEmails: true } : null;
  };
}

