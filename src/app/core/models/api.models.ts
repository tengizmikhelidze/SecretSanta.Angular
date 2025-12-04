// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Interfaces
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  is_email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// Party Interfaces
export interface Party {
  id: string;
  user_id: number | null;
  status: 'created' | 'pending' | 'active' | 'completed' | 'cancelled';
  party_date: string | null;
  location: string | null;
  max_amount: number | null;
  personal_message: string | null;
  host_can_see_all: boolean;
  host_email: string;
  access_token: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number;
  party_id: string;
  user_id: number | null;
  name: string;
  email: string;
  is_host: boolean;
  assigned_to: number | null;
  wishlist: string | null;
  wishlist_description: string | null;
  notification_sent: boolean;
  notification_sent_at: string | null;
  access_token: string;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartyDetails {
  party: Party;
  participants: Participant[];
  assignments: Assignment[];
  userParticipant: Participant | null;
}

export interface Assignment {
  id: number;
  party_id: string;
  giver_id: number;
  receiver_id: number;
  created_at: string;
  giver_name?: string;
  giver_email?: string;
  receiver_name?: string;
  receiver_email?: string;
}

// Wishlist Interfaces
export interface WishlistItem {
  id: number;
  participant_id: number;
  item_name: string;
  item_description: string | null;
  item_url: string | null;
  price_range: string | null;
  priority: 'high' | 'medium' | 'low';
  is_purchased: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Request Interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface CreatePartyRequest {
  hostEmail: string;
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  personalMessage?: string;
  hostCanSeeAll?: boolean;
  participants?: Array<{
    name: string;
    email: string;
  }>;
}

export interface UpdatePartyRequest {
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  personalMessage?: string;
  hostCanSeeAll?: boolean;
  status?: 'created' | 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface AccountData {
  user: User;
  hostedParties: (Party & { role: 'host' })[];
  participantParties: (Party & { role: 'participant' })[];
}

export interface UserStats {
  totalPartiesHosted: number;
  totalPartiesParticipated: number;
  activeParties: number;
  completedParties: number;
}

