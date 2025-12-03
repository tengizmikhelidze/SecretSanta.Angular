import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private currentUser = signal<User | null>(this.loadUserFromStorage());
  private authToken = signal<string | null>(this.loadTokenFromStorage());

  public readonly user = this.currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.currentUser());
  public readonly isEmailVerified = computed(() => this.currentUser()?.isEmailVerified ?? false);

  constructor(private router: Router) {}

  /**
   * Register with email and password
   */
  async register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    // TODO: Replace with actual HTTP call
    await this.delay(1500);

    // Mock response
    const mockUser: User = {
      id: Date.now(),
      email,
      fullName: fullName || email.split('@')[0],
      isEmailVerified: false
    };

    const mockToken = this.generateMockToken();

    this.setAuth(mockUser, mockToken);

    return { user: mockUser, token: mockToken };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // TODO: Replace with actual HTTP call
    await this.delay(1500);

    // Mock response
    const mockUser: User = {
      id: Date.now(),
      email,
      fullName: email.split('@')[0],
      isEmailVerified: true
    };

    const mockToken = this.generateMockToken();

    this.setAuth(mockUser, mockToken);

    return { user: mockUser, token: mockToken };
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    // TODO: Implement Google OAuth flow
    await this.delay(1500);

    const mockUser: User = {
      id: Date.now(),
      email: 'google.user@gmail.com',
      fullName: 'Google User',
      avatarUrl: 'https://via.placeholder.com/150',
      isEmailVerified: true
    };

    const mockToken = this.generateMockToken();

    this.setAuth(mockUser, mockToken);

    return { user: mockUser, token: mockToken };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    // TODO: Replace with actual HTTP call
    await this.delay(1000);

    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, isEmailVerified: true };
      this.currentUser.set(updatedUser);
      this.saveUserToStorage(updatedUser);
    }

    return true;
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // TODO: Replace with actual HTTP call
    await this.delay(1000);

    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    // Validate old password
    console.log('Password changed successfully');
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    // TODO: Replace with actual HTTP call
    await this.delay(1000);
    console.log('Password reset email sent to:', email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Replace with actual HTTP call
    await this.delay(1000);
    console.log('Password reset successfully');
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
   * Update user profile
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

  private generateMockToken(): string {
    return 'mock_token_' + Math.random().toString(36).substring(2) + Date.now();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

