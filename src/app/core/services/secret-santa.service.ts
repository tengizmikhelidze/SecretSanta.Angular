import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiResponse,
  Party,
  PartyDetails,
  Participant,
  CreatePartyRequest,
  UpdatePartyRequest,
  AccountData
} from '../models/api.models';

export interface PartyFormData {
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  participants: Array<{ name: string; email: string; isHost: boolean }>;
  personalMessage: string;
  hostCanSeeAll: boolean;
  termsAccepted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SecretSantaService {
  private readonly API_URL = environment.apiUrl;
  private http = inject(HttpClient);

  /**
   * Create a new party
   */
  async createParty(formData: PartyFormData): Promise<PartyDetails> {
    // Find host participant
    const hostParticipant = formData.participants.find(p => p.isHost);

    if (!hostParticipant) {
      throw new Error('Host participant not found');
    }

    const requestData: CreatePartyRequest = {
      hostEmail: hostParticipant.email,
      partyDate: formData.partyDate,
      location: formData.location,
      maxAmount: formData.maxAmount,
      personalMessage: formData.personalMessage,
      hostCanSeeAll: formData.hostCanSeeAll,
      participants: formData.participants.map(p => ({
        name: p.name,
        email: p.email
      }))
    };

    const response = await firstValueFrom(
      this.http.post<ApiResponse<PartyDetails>>(`${this.API_URL}/parties`, requestData)
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create party');
  }

  /**
   * Get party by ID
   */
  async getParty(partyId: string): Promise<PartyDetails | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<PartyDetails>>(`${this.API_URL}/parties/${partyId}`)
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching party:', error);
      return null;
    }
  }

  /**
   * Get party by access token
   */
  async getPartyByToken(accessToken: string): Promise<PartyDetails | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<PartyDetails>>(
          `${this.API_URL}/parties/by-token?token=${accessToken}`
        )
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching party by token:', error);
      return null;
    }
  }

  /**
   * Get all user's parties (for account page)
   */
  async getUserParties(): Promise<AccountData> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<AccountData>>(`${this.API_URL}/users/account`)
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user parties');
  }

  /**
   * Get parties where user is host
   */
  async getMyParties(): Promise<Party[]> {
    const response = await firstValueFrom(
      this.http.get<ApiResponse<Party[]>>(`${this.API_URL}/parties/my-parties`)
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get hosted parties');
  }

  /**
   * Update party
   */
  async updateParty(partyId: string, updateData: UpdatePartyRequest): Promise<Party> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<Party>>(
        `${this.API_URL}/parties/${partyId}`,
        updateData
      )
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update party');
  }

  /**
   * Delete party
   */
  async deleteParty(partyId: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<any>>(`${this.API_URL}/parties/${partyId}`)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete party');
    }
  }

  /**
   * Add participant to party
   */
  async addParticipant(partyId: string, name: string, email: string): Promise<Participant> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<Participant>>(
        `${this.API_URL}/parties/${partyId}/participants`,
        { name, email }
      )
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to add participant');
  }

  /**
   * Remove participant from party
   */
  async removeParticipant(partyId: string, participantId: number): Promise<void> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<any>>(
        `${this.API_URL}/parties/${partyId}/participants/${participantId}`
      )
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to remove participant');
    }
  }

  /**
   * Draw names (create Secret Santa assignments)
   */
  async drawNames(partyId: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<any>>(
        `${this.API_URL}/parties/${partyId}/draw-names`,
        {}
      )
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to draw names');
    }
  }

  /**
   * Update participant wishlist
   */
  async updateWishlist(participantId: number, wishlist: string, wishlistDescription?: string): Promise<Participant> {
    const response = await firstValueFrom(
      this.http.put<ApiResponse<Participant>>(
        `${this.API_URL}/participants/${participantId}`,
        { wishlist, wishlistDescription }
      )
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update wishlist');
  }

  /**
   * Get participant by access token (for anonymous access)
   */
  async getParticipantByToken(accessToken: string): Promise<Participant | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Participant>>(
          `${this.API_URL}/participants/by-token?token=${accessToken}`
        )
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching participant by token:', error);
      return null;
    }
  }
}

