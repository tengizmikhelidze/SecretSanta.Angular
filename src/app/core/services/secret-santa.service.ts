import { Injectable, signal } from '@angular/core';

export interface Participant {
  name: string;
  email: string;
  isHost: boolean;
}

export interface PartyData {
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  participants: Participant[];
  personalMessage: string;
  hostCanSeeAll: boolean;
  termsAccepted: boolean;
}

export interface PartyResponse {
  id: string;
  status: 'created' | 'pending' | 'active';
  createdAt: string;
  data: PartyData;
}

@Injectable({
  providedIn: 'root'
})
export class SecretSantaService {
  private readonly parties = signal<Map<string, PartyResponse>>(new Map());

  /**
   * Mock API call to create a Secret Santa party
   * TODO: Replace with actual HTTP call when backend is ready
   */
  async createParty(partyData: PartyData): Promise<PartyResponse> {
    // Simulate API delay
    await this.delay(1500);

    // Mock validation
    if (partyData.participants.length < 4) {
      throw new Error('Minimum 4 participants required');
    }

    if (!partyData.termsAccepted) {
      throw new Error('Terms must be accepted');
    }

    // Check for unique emails
    const emails = partyData.participants.map(p => p.email);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      throw new Error('All participant emails must be unique');
    }

    // Generate mock response
    const partyId = this.generateId();
    const response: PartyResponse = {
      id: partyId,
      status: 'created',
      createdAt: new Date().toISOString(),
      data: partyData
    };

    // Store in mock database
    const currentParties = this.parties();
    currentParties.set(partyId, response);
    this.parties.set(new Map(currentParties));

    // Log for debugging
    console.log('Mock API: Party created', response);

    return response;
  }

  /**
   * Mock API call to get party by ID
   * TODO: Replace with actual HTTP call when backend is ready
   */
  async getParty(partyId: string): Promise<PartyResponse | null> {
    await this.delay(500);

    const party = this.parties().get(partyId);
    return party || null;
  }

  /**
   * Mock API call to get all parties
   * TODO: Replace with actual HTTP call when backend is ready
   */
  async getAllParties(): Promise<PartyResponse[]> {
    await this.delay(500);

    return Array.from(this.parties().values());
  }

  private generateId(): string {
    return `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

