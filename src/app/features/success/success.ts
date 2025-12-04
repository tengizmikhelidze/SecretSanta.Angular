import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SecretSantaService } from '../../core/services/secret-santa.service';

interface PartyDetails {
  id: string;
  partyDate?: string | null;
  location?: string | null;
  maxAmount?: number | null;
  participants: Array<{ name: string; email: string; isHost: boolean }>;
  personalMessage: string;
  hostCanSeeAll: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-success',
  imports: [
    Header,
    Footer,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './success.html',
  styleUrl: './success.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Success implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private secretSantaService = inject(SecretSantaService);

  protected readonly partyDetails = signal<PartyDetails | null>(null);
  protected readonly loading = signal(true);

  async ngOnInit() {
    const partyId = this.route.snapshot.params['id'];

    if (!partyId) {
      this.router.navigate(['/']);
      return;
    }

    try {
      const partyData = await this.secretSantaService.getParty(partyId);

      if (partyData && partyData.party) {
        this.partyDetails.set({
          id: partyData.party.id,
          partyDate: partyData.party.party_date,
          location: partyData.party.location,
          maxAmount: partyData.party.max_amount,
          participants: partyData.participants.map(p => ({
            name: p.name,
            email: p.email,
            isHost: p.is_host
          })),
          personalMessage: partyData.party.personal_message || '',
          hostCanSeeAll: partyData.party.host_can_see_all,
          createdAt: partyData.party.created_at
        });
      } else {
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error loading party:', error);
      this.router.navigate(['/']);
    } finally {
      this.loading.set(false);
    }
  }

  protected createAnother(): void {
    this.router.navigate(['/generator']);
  }

  protected goHome(): void {
    this.router.navigate(['/']);
  }

  protected formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

