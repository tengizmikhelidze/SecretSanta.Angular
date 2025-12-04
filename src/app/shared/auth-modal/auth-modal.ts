import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModal {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AuthModal>);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.fb.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  protected async onLogin(): Promise<void> {
    if (this.loginForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email!, password!);

      this.snackBar.open('✅ Login successful!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close({ success: true });
    } catch (error: any) {
      this.snackBar.open(`❌ ${error.message || 'Login failed. Please check your credentials.'}`, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onRegister(): Promise<void> {
    if (this.registerForm.invalid || this.isLoading()) return;

    const { password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.snackBar.open('❌ Passwords do not match', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading.set(true);

    try {
      const { email, fullName } = this.registerForm.value;
      await this.authService.register(email!, password!, fullName || undefined);

      this.snackBar.open('✅ Registration successful! Please check your email to verify your account.', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close({ success: true });
    } catch (error: any) {
      this.snackBar.open(`❌ ${error.message || 'Registration failed. Please try again.'}`, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onGoogleLogin(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);

    try {
      await this.authService.loginWithGoogle();
      // Will redirect to Google OAuth
    } catch (error: any) {
      this.snackBar.open(`❌ ${error.message || 'Google login failed. Please try again.'}`, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      this.isLoading.set(false);
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }
}

