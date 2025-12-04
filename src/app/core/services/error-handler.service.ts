import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private snackBar = inject(MatSnackBar);

  /**
   * Handle HTTP errors and show appropriate snackbar messages
   */
  handleError(error: any, defaultMessage: string = 'An error occurred'): string {
    let errorMessage = defaultMessage;

    if (error instanceof HttpErrorResponse) {
      // Server-side error
      if (error.error && typeof error.error === 'object') {
        // API response with error field
        if (error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific HTTP status codes
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 400:
          // Bad Request - use server message or default
          if (!error.error?.error && !error.error?.message) {
            errorMessage = 'Invalid request. Please check your input.';
          }
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          // Conflict - use server message (e.g., "Email already registered")
          if (!error.error?.error && !error.error?.message) {
            errorMessage = 'Conflict. The resource already exists.';
          }
          break;
        case 422:
          errorMessage = 'Validation error. Please check your input.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service unavailable. Please try again later.';
          break;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return errorMessage;
  }

  /**
   * Show error snackbar
   */
  showError(error: any, defaultMessage?: string): void {
    const errorMessage = this.handleError(error, defaultMessage);

    this.snackBar.open(`❌ ${errorMessage}`, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success snackbar
   */
  showSuccess(message: string): void {
    this.snackBar.open(`✅ ${message}`, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show info snackbar
   */
  showInfo(message: string, duration: number = 5000): void {
    this.snackBar.open(`ℹ️ ${message}`, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Show warning snackbar
   */
  showWarning(message: string): void {
    this.snackBar.open(`⚠️ ${message}`, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }
}

