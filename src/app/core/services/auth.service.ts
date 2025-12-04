import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';
import type {
  User,
  AuthResponse,
  ApiResponse,
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private http = inject(HttpClient);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);

  private currentUser = signal<User | null>(this.loadUserFromStorage());
  private authToken = signal<string | null>(this.loadTokenFromStorage());

  public readonly user = this.currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.currentUser());
  public readonly isEmailVerified = computed(() => this.currentUser()?.is_email_verified ?? false);

  /**
   * Register with email and password
   */
  async register(email: string, password: string, fullName?: string): Promise<User> {
    try {
      const requestData: RegisterRequest = { email, password, fullName };

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, requestData)
      );

      if (response.success && response.data) {
        this.setAuth(response.data.user, response.data.token);
        return response.data.user;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      // Re-throw with handled error message
      throw new Error(this.errorHandler.handleError(error, 'Registration failed'));
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const requestData: LoginRequest = { email, password };

      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, requestData)
      );

      if (response.success && response.data) {
        this.setAuth(response.data.user, response.data.token);
        return response.data.user;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error) {
      // Re-throw with handled error message
      throw new Error(this.errorHandler.handleError(error, 'Login failed'));
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    // Redirect to Google OAuth endpoint
    window.location.href = `${this.API_URL}/auth/google`;
  }

  /**
   * Handle OAuth callback (called from callback route)
   */
  async handleOAuthCallback(token: string): Promise<User> {
    // Get user data with token
    const response = await firstValueFrom(
      this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );

    if (response.success && response.data) {
      this.setAuth(response.data, token);
      return response.data;
    }

    throw new Error('OAuth login failed');
  }

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<User> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`)
    );

    if (response.success && response.data) {
      this.currentUser.set(response.data);
      this.saveUserToStorage(response.data);
      return response.data;
    }

    throw new Error('Failed to get current user');
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/verify-email`, { token })
    );

    if (response.success) {
      // Refresh user data
      await this.getCurrentUser();
      return true;
    }

    throw new Error(response.message || 'Email verification failed');
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/resend-verification`, {})
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to resend verification email');
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      const requestData: ChangePasswordRequest = { oldPassword, newPassword };

      const response = await firstValueFrom(
        this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/change-password`, requestData)
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      // Re-throw with handled error message
      throw new Error(this.errorHandler.handleError(error, 'Failed to change password'));
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/forgot-password`, { email })
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to send password reset email');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/reset-password`, {
        token,
        newPassword
      })
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.currentUser.set(null);
    this.authToken.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/']);
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.authToken();
  }

  /**
   * Update user profile locally
   */
  updateUser(updates: Partial<User>): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.currentUser.set(updatedUser);
      this.saveUserToStorage(updatedUser);
    }
  }

  // Private helper methods

  private setAuth(user: User, token: string): void {
    this.currentUser.set(user);
    this.authToken.set(token);
    this.saveUserToStorage(user);
    this.saveTokenToStorage(token);
  }

  private loadUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private saveTokenToStorage(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}


