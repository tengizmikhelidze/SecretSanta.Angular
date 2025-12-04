# Secret Santa API Documentation for Angular

**Base URL:** `http://localhost:5000/api/v1`

**Authentication:** JWT Bearer Token in Authorization header

---

## TypeScript Interfaces

```typescript
// User Interfaces
interface User {
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

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// Party Interfaces
interface Party {
  id: string; // UUID
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

interface Participant {
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

interface PartyDetails {
  party: Party;
  participants: Participant[];
  assignments: Assignment[];
  userParticipant: Participant | null;
}

interface Assignment {
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
interface WishlistItem {
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

// Request/Response wrappers
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AccountData {
  user: User;
  hostedParties: (Party & { role: 'host' })[];
  participantParties: (Party & { role: 'participant' })[];
}

interface UserStats {
  totalPartiesHosted: number;
  totalPartiesParticipated: number;
  activeParties: number;
  completedParties: number;
}
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}
```

**Example:**
```typescript
const registerData: RegisterRequest = {
  email: "user@example.com",
  password: "password123",
  fullName: "John Doe"
};

this.http.post<AuthResponse>(`${baseUrl}/auth/register`, registerData)
  .subscribe(response => {
    console.log(response.data.token); // JWT token
    console.log(response.data.user);  // User object
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_email_verified": false,
      "created_at": "2025-12-04T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

---

### 2. Login User

**Endpoint:** `POST /auth/login`

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Example:**
```typescript
const loginData: LoginRequest = {
  email: "user@example.com",
  password: "password123"
};

this.http.post<AuthResponse>(`${baseUrl}/auth/login`, loginData)
  .subscribe(response => {
    localStorage.setItem('token', response.data.token);
    // Navigate to dashboard
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

### 3. Get Current User

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`
});

this.http.get<ApiResponse<User>>(`${baseUrl}/auth/me`, { headers })
  .subscribe(response => {
    console.log(response.data); // Current user
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_email_verified": true,
    "last_login_at": "2025-12-04T12:00:00.000Z"
  }
}
```

---

### 4. Change Password

**Endpoint:** `POST /auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
```

**Example:**
```typescript
const passwordData: ChangePasswordRequest = {
  oldPassword: "oldpassword123",
  newPassword: "newpassword123"
};

this.http.post<ApiResponse<any>>(`${baseUrl}/auth/change-password`, passwordData, { headers })
  .subscribe(response => {
    console.log(response.message); // "Password changed successfully"
  });
```

---

### 5. Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Example:**
```typescript
this.http.post<ApiResponse<any>>(`${baseUrl}/auth/forgot-password`, { email: "user@example.com" })
  .subscribe(response => {
    console.log(response.message); // Check email
  });
```

---

### 6. Reset Password

**Endpoint:** `POST /auth/reset-password`

**Request Body:**
```typescript
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

**Example:**
```typescript
const resetData: ResetPasswordRequest = {
  token: "reset_token_from_email",
  newPassword: "newpassword123"
};

this.http.post<ApiResponse<any>>(`${baseUrl}/auth/reset-password`, resetData)
  .subscribe(response => {
    console.log(response.message); // "Password reset successfully"
  });
```

---

### 7. Verify Email

**Endpoint:** `POST /auth/verify-email`

**Request Body:**
```typescript
interface VerifyEmailRequest {
  token: string;
}
```

**Example:**
```typescript
this.http.post<ApiResponse<any>>(`${baseUrl}/auth/verify-email`, { token: "verification_token" })
  .subscribe(response => {
    console.log(response.message); // "Email verified successfully"
  });
```

---

### 8. Resend Verification Email

**Endpoint:** `POST /auth/resend-verification`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.post<ApiResponse<any>>(`${baseUrl}/auth/resend-verification`, {}, { headers })
  .subscribe(response => {
    console.log(response.message); // "Verification email sent"
  });
```

---

### 9. Google OAuth Login

**Endpoint:** `GET /auth/google`

Redirect user to this URL to initiate Google OAuth flow.

**Example:**
```typescript
// In your component
initiateGoogleLogin() {
  window.location.href = `${baseUrl}/auth/google`;
}

// Google will redirect to: /auth/google/callback
// Then your frontend callback route at: /auth/callback?token=...
```

---

## User Endpoints

### 10. Get User Profile

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.get<ApiResponse<User>>(`${baseUrl}/users/profile`, { headers })
  .subscribe(response => {
    this.user = response.data;
  });
```

---

### 11. Update User Profile

**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}
```

**Example:**
```typescript
const updateData: UpdateProfileRequest = {
  fullName: "John Updated",
  avatarUrl: "https://example.com/avatar.jpg"
};

this.http.put<ApiResponse<User>>(`${baseUrl}/users/profile`, updateData, { headers })
  .subscribe(response => {
    console.log(response.message); // "Profile updated successfully"
  });
```

---

### 12. Get Account Page (All Parties)

**Endpoint:** `GET /users/account`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.get<ApiResponse<AccountData>>(`${baseUrl}/users/account`, { headers })
  .subscribe(response => {
    this.hostedParties = response.data.hostedParties;
    this.participantParties = response.data.participantParties;
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com" },
    "hostedParties": [
      {
        "id": "uuid-1",
        "status": "active",
        "party_date": "2025-12-25T18:00:00.000Z",
        "role": "host"
      }
    ],
    "participantParties": [
      {
        "id": "uuid-2",
        "status": "active",
        "party_date": "2025-12-26T18:00:00.000Z",
        "role": "participant"
      }
    ]
  }
}
```

---

### 13. Get User Statistics

**Endpoint:** `GET /users/stats`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.get<ApiResponse<UserStats>>(`${baseUrl}/users/stats`, { headers })
  .subscribe(response => {
    console.log(response.data); // User statistics
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPartiesHosted": 5,
    "totalPartiesParticipated": 10,
    "activeParties": 3,
    "completedParties": 12
  }
}
```

---

## Party Endpoints

### 14. Create Party

**Endpoint:** `POST /parties`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreatePartyRequest {
  hostEmail: string;
  partyDate?: string; // ISO date string
  location?: string;
  maxAmount?: number;
  personalMessage?: string;
  hostCanSeeAll?: boolean;
  participants?: Array<{
    name: string;
    email: string;
  }>;
}
```

**Example:**
```typescript
const partyData: CreatePartyRequest = {
  hostEmail: "host@example.com",
  partyDate: "2025-12-25T18:00:00.000Z",
  location: "My House",
  maxAmount: 50.00,
  personalMessage: "Ho ho ho! Let's have fun!",
  hostCanSeeAll: false,
  participants: [
    { name: "Alice Smith", email: "alice@example.com" },
    { name: "Bob Johnson", email: "bob@example.com" },
    { name: "Charlie Brown", email: "charlie@example.com" }
  ]
};

this.http.post<ApiResponse<PartyDetails>>(`${baseUrl}/parties`, partyData, { headers })
  .subscribe(response => {
    console.log(response.data.party); // Created party
    console.log(response.data.participants); // All participants
  });
```

**Response:**
```json
{
  "success": true,
  "data": {
    "party": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "created",
      "party_date": "2025-12-25T18:00:00.000Z",
      "location": "My House",
      "max_amount": 50.00,
      "host_email": "host@example.com",
      "access_token": "abc123..."
    },
    "participants": [
      {
        "id": 1,
        "party_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Alice Smith",
        "email": "alice@example.com",
        "is_host": false
      }
    ]
  },
  "message": "Party created successfully"
}
```

---

### 15. Get My Parties (As Host)

**Endpoint:** `GET /parties/my-parties`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.get<ApiResponse<Party[]>>(`${baseUrl}/parties/my-parties`, { headers })
  .subscribe(response => {
    this.myParties = response.data;
  });
```

---

### 16. Get Party Details

**Endpoint:** `GET /parties/:id`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
const partyId = '550e8400-e29b-41d4-a716-446655440000';

this.http.get<ApiResponse<PartyDetails>>(`${baseUrl}/parties/${partyId}`, { headers })
  .subscribe(response => {
    this.party = response.data.party;
    this.participants = response.data.participants;
    this.assignments = response.data.assignments;
  });
```

---

### 17. Get Party by Access Token

**Endpoint:** `GET /parties/by-token?token=<access_token>`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
const accessToken = 'abc123...';

this.http.get<ApiResponse<PartyDetails>>(`${baseUrl}/parties/by-token?token=${accessToken}`, { headers })
  .subscribe(response => {
    this.party = response.data.party;
  });
```

---

### 18. Update Party

**Endpoint:** `PUT /parties/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdatePartyRequest {
  partyDate?: string;
  location?: string;
  maxAmount?: number;
  personalMessage?: string;
  hostCanSeeAll?: boolean;
  status?: 'created' | 'pending' | 'active' | 'completed' | 'cancelled';
}
```

**Example:**
```typescript
const updateData: UpdatePartyRequest = {
  partyDate: "2025-12-26T18:00:00.000Z",
  location: "New Location",
  maxAmount: 75.00
};

this.http.put<ApiResponse<Party>>(`${baseUrl}/parties/${partyId}`, updateData, { headers })
  .subscribe(response => {
    console.log(response.message); // "Party updated successfully"
  });
```

---

### 19. Delete Party

**Endpoint:** `DELETE /parties/:id`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.delete<ApiResponse<any>>(`${baseUrl}/parties/${partyId}`, { headers })
  .subscribe(response => {
    console.log(response.message); // "Party deleted successfully"
  });
```

---

### 20. Add Participant to Party

**Endpoint:** `POST /parties/:id/participants`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface AddParticipantRequest {
  name: string;
  email: string;
}
```

**Example:**
```typescript
const participantData: AddParticipantRequest = {
  name: "David Wilson",
  email: "david@example.com"
};

this.http.post<ApiResponse<Participant>>(`${baseUrl}/parties/${partyId}/participants`, participantData, { headers })
  .subscribe(response => {
    console.log(response.data); // New participant
    console.log(response.message); // "Participant added successfully"
  });
```

**Note:** Email must be unique within the party (enforced by backend).

---

### 21. Remove Participant from Party

**Endpoint:** `DELETE /parties/:id/participants/:participantId`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.delete<ApiResponse<any>>(`${baseUrl}/parties/${partyId}/participants/${participantId}`, { headers })
  .subscribe(response => {
    console.log(response.message); // "Participant removed successfully"
  });
```

---

### 22. Draw Names (Create Secret Santa Assignments)

**Endpoint:** `POST /parties/:id/draw-names`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.post<ApiResponse<any>>(`${baseUrl}/parties/${partyId}/draw-names`, {}, { headers })
  .subscribe(response => {
    console.log(response.message); // "Secret Santa assignments created and sent!"
    // All participants will receive emails with their assignments
  });
```

**Requirements:**
- At least 3 participants required
- Party status will change to 'active'
- All participants receive email notifications

---

## Wishlist Endpoints

### 23. Get Participant's Wishlist

**Endpoint:** `GET /wishlists/participant/:participantId`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.get<ApiResponse<WishlistItem[]>>(`${baseUrl}/wishlists/participant/${participantId}`, { headers })
  .subscribe(response => {
    this.wishlistItems = response.data;
  });
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "participant_id": 5,
      "item_name": "Wireless Headphones",
      "item_description": "Noise-cancelling, over-ear",
      "item_url": "https://example.com/product",
      "price_range": "$100-$150",
      "priority": "high",
      "is_purchased": false,
      "sort_order": 0,
      "created_at": "2025-12-04T12:00:00.000Z"
    }
  ]
}
```

---

### 24. Add Wishlist Item

**Endpoint:** `POST /wishlists/participant/:participantId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreateWishlistItemRequest {
  itemName: string;
  itemDescription?: string;
  itemUrl?: string;
  priceRange?: string;
  priority?: 'high' | 'medium' | 'low';
  sortOrder?: number;
}
```

**Example:**
```typescript
const wishlistItem: CreateWishlistItemRequest = {
  itemName: "Wireless Headphones",
  itemDescription: "Noise-cancelling, over-ear",
  itemUrl: "https://example.com/product",
  priceRange: "$100-$150",
  priority: "high"
};

this.http.post<ApiResponse<WishlistItem>>(`${baseUrl}/wishlists/participant/${participantId}`, wishlistItem, { headers })
  .subscribe(response => {
    console.log(response.data); // Created wishlist item
  });
```

---

### 25. Update Wishlist Item

**Endpoint:** `PUT /wishlists/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateWishlistItemRequest {
  itemName?: string;
  itemDescription?: string;
  itemUrl?: string;
  priceRange?: string;
  priority?: 'high' | 'medium' | 'low';
  isPurchased?: boolean;
  sortOrder?: number;
}
```

**Example:**
```typescript
const updateData: UpdateWishlistItemRequest = {
  itemName: "Updated Item Name",
  priority: "medium"
};

this.http.put<ApiResponse<WishlistItem>>(`${baseUrl}/wishlists/${itemId}`, updateData, { headers })
  .subscribe(response => {
    console.log(response.message); // "Wishlist item updated successfully"
  });
```

---

### 26. Delete Wishlist Item

**Endpoint:** `DELETE /wishlists/:id`

**Headers:** `Authorization: Bearer <token>`

**Example:**
```typescript
this.http.delete<ApiResponse<any>>(`${baseUrl}/wishlists/${itemId}`, { headers })
  .subscribe(response => {
    console.log(response.message); // "Wishlist item deleted successfully"
  });
```

---

### 27. Reorder Wishlist Items

**Endpoint:** `POST /wishlists/participant/:participantId/reorder`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface ReorderWishlistRequest {
  itemOrders: Array<{
    id: number;
    sortOrder: number;
  }>;
}
```

**Example:**
```typescript
const reorderData: ReorderWishlistRequest = {
  itemOrders: [
    { id: 1, sortOrder: 0 },
    { id: 2, sortOrder: 1 },
    { id: 3, sortOrder: 2 }
  ]
};

this.http.post<ApiResponse<any>>(`${baseUrl}/wishlists/participant/${participantId}/reorder`, reorderData, { headers })
  .subscribe(response => {
    console.log(response.message); // "Wishlist reordered successfully"
  });
```

---

## Angular Service Example

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecretSantaService {
  private baseUrl = environment.apiUrl; // http://localhost:5000/api/v1

  constructor(private http: HttpClient) {}

  // Helper to get auth headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Authentication
  register(email: string, password: string, fullName?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, { email, password, fullName });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password });
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/auth/me`, { headers: this.getHeaders() });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/auth/change-password`, 
      { oldPassword, newPassword }, 
      { headers: this.getHeaders() }
    );
  }

  // Users
  getAccountPage(): Observable<ApiResponse<AccountData>> {
    return this.http.get<ApiResponse<AccountData>>(`${this.baseUrl}/users/account`, { headers: this.getHeaders() });
  }

  getUserStats(): Observable<ApiResponse<UserStats>> {
    return this.http.get<ApiResponse<UserStats>>(`${this.baseUrl}/users/stats`, { headers: this.getHeaders() });
  }

  // Parties
  createParty(partyData: CreatePartyRequest): Observable<ApiResponse<PartyDetails>> {
    return this.http.post<ApiResponse<PartyDetails>>(`${this.baseUrl}/parties`, partyData, { headers: this.getHeaders() });
  }

  getMyParties(): Observable<ApiResponse<Party[]>> {
    return this.http.get<ApiResponse<Party[]>>(`${this.baseUrl}/parties/my-parties`, { headers: this.getHeaders() });
  }

  getPartyDetails(partyId: string): Observable<ApiResponse<PartyDetails>> {
    return this.http.get<ApiResponse<PartyDetails>>(`${this.baseUrl}/parties/${partyId}`, { headers: this.getHeaders() });
  }

  updateParty(partyId: string, updateData: UpdatePartyRequest): Observable<ApiResponse<Party>> {
    return this.http.put<ApiResponse<Party>>(`${this.baseUrl}/parties/${partyId}`, updateData, { headers: this.getHeaders() });
  }

  deleteParty(partyId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/parties/${partyId}`, { headers: this.getHeaders() });
  }

  addParticipant(partyId: string, name: string, email: string): Observable<ApiResponse<Participant>> {
    return this.http.post<ApiResponse<Participant>>(`${this.baseUrl}/parties/${partyId}/participants`, 
      { name, email }, 
      { headers: this.getHeaders() }
    );
  }

  removeParticipant(partyId: string, participantId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/parties/${partyId}/participants/${participantId}`, { headers: this.getHeaders() });
  }

  drawNames(partyId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/parties/${partyId}/draw-names`, {}, { headers: this.getHeaders() });
  }

  // Wishlists
  getWishlist(participantId: number): Observable<ApiResponse<WishlistItem[]>> {
    return this.http.get<ApiResponse<WishlistItem[]>>(`${this.baseUrl}/wishlists/participant/${participantId}`, { headers: this.getHeaders() });
  }

  addWishlistItem(participantId: number, itemData: CreateWishlistItemRequest): Observable<ApiResponse<WishlistItem>> {
    return this.http.post<ApiResponse<WishlistItem>>(`${this.baseUrl}/wishlists/participant/${participantId}`, itemData, { headers: this.getHeaders() });
  }

  updateWishlistItem(itemId: number, updateData: UpdateWishlistItemRequest): Observable<ApiResponse<WishlistItem>> {
    return this.http.put<ApiResponse<WishlistItem>>(`${this.baseUrl}/wishlists/${itemId}`, updateData, { headers: this.getHeaders() });
  }

  deleteWishlistItem(itemId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/wishlists/${itemId}`, { headers: this.getHeaders() });
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  stack?: string; // Only in development mode
}
```

**Example Error Response:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email in party)
- `500` - Internal Server Error

---

## Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api/v1'
};
```

---

## Important Notes

1. **Email Uniqueness:** Each email must be unique within a party (not globally).

2. **JWT Token Storage:** Store the token in localStorage or sessionStorage after login.

3. **Authorization Header:** Include `Authorization: Bearer <token>` in all protected endpoints.

4. **Party Status Flow:** `created` → `pending` → `active` → `completed`

5. **Minimum Participants:** At least 3 participants required to draw names.

6. **Access Tokens:** Non-registered users can access parties via access tokens sent by email.

7. **CORS:** Backend is configured for `http://localhost:4200` (Angular default port).

---

## Complete Usage Example

```typescript
// 1. Register and login
this.secretSantaService.register('user@example.com', 'password123', 'John Doe')
  .subscribe(response => {
    localStorage.setItem('token', response.data.token);
  });

// 2. Get account page
this.secretSantaService.getAccountPage()
  .subscribe(response => {
    this.hostedParties = response.data.hostedParties;
    this.participantParties = response.data.participantParties;
  });

// 3. Create party
const partyData: CreatePartyRequest = {
  hostEmail: 'host@example.com',
  partyDate: '2025-12-25T18:00:00.000Z',
  location: 'My House',
  maxAmount: 50,
  participants: [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' }
  ]
};

this.secretSantaService.createParty(partyData)
  .subscribe(response => {
    const partyId = response.data.party.id;
    
    // 4. Draw names
    this.secretSantaService.drawNames(partyId)
      .subscribe(drawResponse => {
        console.log('Secret Santa assignments created!');
      });
  });

// 5. Add wishlist item
const wishlistItem: CreateWishlistItemRequest = {
  itemName: 'Wireless Headphones',
  itemDescription: 'Noise-cancelling',
  priority: 'high'
};

this.secretSantaService.addWishlistItem(participantId, wishlistItem)
  .subscribe(response => {
    console.log('Wishlist item added!');
  });
```

---

**Backend Server:** http://localhost:5000
**API Base URL:** http://localhost:5000/api/v1
**Health Check:** http://localhost:5000/health

**Total Endpoints:** 27
**Authentication Required:** 20 endpoints
**Public Endpoints:** 7 endpoints

