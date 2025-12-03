import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { AuthModal } from '../auth-modal/auth-modal';

@Component({
  selector: 'app-header',
  imports: [
    MatButton,
    MatIconButton,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  protected openAuthModal(): void {
    const dialogRef = this.dialog.open(AuthModal, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Optionally navigate to account page after login
        // this.router.navigate(['/account']);
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected goToAccount(): void {
    this.router.navigate(['/account']);
  }
}
