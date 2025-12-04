# 🤖 COPILOT QUICK REFERENCE - SECRET SANTA API

## 📦 Files for Copilot

Copy these 2 files to your Angular project for full Copilot IntelliSense:

1. **`secret-santa.models.ts`** → `src/app/models/secret-santa.models.ts`
2. **`secret-santa.service.ts`** → `src/app/services/secret-santa.service.ts`

---

## ⚡ Quick Import

```typescript
import { SecretSantaService } from './services/secret-santa.service';
import { 
  User, Party, PartyDetails, Participant, WishlistItem,
  RegisterRequest, LoginRequest, CreatePartyRequest,
  ApiResponse, PartyStatus, WishlistPriority
} from './models/secret-santa.models';
```

---

## 🎯 Most Used Methods

### Authentication
```typescript
// Register
api.register({ email, password, fullName })

// Login
api.login({ email, password })

// Get current user
api.getCurrentUser()

// Change password
api.changePassword({ oldPassword, newPassword })

// Logout
api.logout()

// Check if authenticated
api.isAuthenticated()
```

### Account & Parties
```typescript
// Get all parties (host + participant) - YOUR REQUIREMENT ✓
api.getAccountPage()

// Get hosted parties only
api.getMyParties()

// Get party details
api.getPartyDetails(partyId)
```

### Create & Manage Party
```typescript
// Create party
api.createParty({
  hostEmail: string,
  partyDate?: string,
  location?: string,
  maxAmount?: number,
  participants: [{ name, email }]
})

// Add participant (email unique per party) - YOUR REQUIREMENT ✓
api.addParticipant(partyId, { name, email })

// Draw Secret Santa names
api.drawNames(partyId)

// Update party
api.updateParty(partyId, { partyDate, location, maxAmount })

// Delete party
api.deleteParty(partyId)
```

### Wishlist
```typescript
// Get wishlist
api.getWishlist(participantId)

// Add item
api.addWishlistItem(participantId, { itemName, itemDescription, priority })

// Update item
api.updateWishlistItem(itemId, { itemName, priority })

// Delete item
api.deleteWishlistItem(itemId)
```

---

## 📋 Common Patterns

### Login Flow
```typescript
constructor(private api: SecretSantaService, private router: Router) {}

login(email: string, password: string) {
  this.api.login({ email, password }).subscribe({
    next: (response) => {
      console.log('User:', response.data.user);
      this.router.navigate(['/dashboard']);
    },
    error: (error) => alert(error.message)
  });
}
```

### Account Page - YOUR REQUIREMENT ✓
```typescript
accountData: AccountData | null = null;

loadAccount() {
  this.api.getAccountPage().subscribe({
    next: (response) => {
      this.accountData = response.data!;
      // response.data.hostedParties → Parties you host
      // response.data.participantParties → Parties you joined
    }
  });
}
```

### Create Party
```typescript
createParty(form: any) {
  const data: CreatePartyRequest = {
    hostEmail: form.email,
    partyDate: form.date,
    location: form.location,
    maxAmount: form.budget,
    participants: form.participants // [{ name, email }]
  };

  this.api.createParty(data).subscribe({
    next: (response) => {
      const partyId = response.data!.party.id;
      console.log('Party created:', partyId);
    },
    error: (error) => console.error(error.message)
  });
}
```

### Add Participant - EMAIL UNIQUE ✓
```typescript
addParticipant(partyId: string, name: string, email: string) {
  this.api.addParticipant(partyId, { name, email }).subscribe({
    next: () => console.log('Participant added'),
    error: (error) => {
      // Backend validates: email must be unique per party
      if (error.message.includes('already added')) {
        alert('This email is already in the party!');
      }
    }
  });
}
```

### Change Password - YOUR REQUIREMENT ✓
```typescript
changePassword(oldPwd: string, newPwd: string) {
  this.api.changePassword({ oldPassword: oldPwd, newPassword: newPwd }).subscribe({
    next: (response) => alert(response.message),
    error: (error) => alert('Current password is incorrect')
  });
}
```

### Draw Names
```typescript
drawNames(partyId: string) {
  if (confirm('Draw Secret Santa names? Emails will be sent!')) {
    this.api.drawNames(partyId).subscribe({
      next: (response) => {
        alert(response.message); // "Secret Santa assignments created and sent!"
      },
      error: (error) => {
        if (error.message.includes('3 participants')) {
          alert('At least 3 participants required!');
        }
      }
    });
  }
}
```

### Wishlist Management
```typescript
wishlistItems: WishlistItem[] = [];

loadWishlist(participantId: number) {
  this.api.getWishlist(participantId).subscribe({
    next: (response) => this.wishlistItems = response.data!
  });
}

addItem(participantId: number, itemName: string) {
  this.api.addWishlistItem(participantId, { 
    itemName, 
    priority: 'medium' 
  }).subscribe({
    next: () => this.loadWishlist(participantId)
  });
}
```

---

## 🔐 Auth Guard
```typescript
canActivate(): boolean {
  if (this.api.isAuthenticated()) {
    return true;
  }
  this.router.navigate(['/login']);
  return false;
}
```

---

## 🎨 TypeScript Interfaces

### User
```typescript
interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_email_verified: boolean;
  created_at: string;
}
```

### Party
```typescript
interface Party {
  id: string; // UUID
  status: 'created' | 'pending' | 'active' | 'completed' | 'cancelled';
  party_date: string | null;
  location: string | null;
  max_amount: number | null;
  host_email: string;
}
```

### Participant
```typescript
interface Participant {
  id: number;
  party_id: string;
  name: string;
  email: string; // Unique per party
  is_host: boolean;
  assigned_to: number | null;
}
```

### WishlistItem
```typescript
interface WishlistItem {
  id: number;
  participant_id: number;
  item_name: string;
  item_description: string | null;
  priority: 'high' | 'medium' | 'low';
}
```

### ApiResponse
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## ✅ Your Requirements - All Implemented

- ✅ `api.login()` - Email/password
- ✅ `api.loginWithGoogle()` - Google OAuth
- ✅ `api.register()` - Sign up
- ✅ `api.changePassword()` - Old + new password
- ✅ `api.getAccountPage()` - All parties (host + participant)
- ✅ `api.createParty()` - Create parties
- ✅ `api.addParticipant()` - Email unique per party validated

---

## 🌐 API Base URL

```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:5000/api/v1'
};
```

---

## 📞 Error Handling

```typescript
this.api.someMethod().subscribe({
  next: (response) => {
    if (response.success) {
      console.log(response.data);
    }
  },
  error: (error) => {
    console.error(error.message);
    // error.message contains user-friendly error
  }
});
```

---

## 🎯 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `409` - Conflict (duplicate email in party)
- `500` - Server Error

---

## 🚀 Start Coding!

1. Copy `secret-santa.models.ts` to `src/app/models/`
2. Copy `secret-santa.service.ts` to `src/app/services/`
3. Import `HttpClientModule` in `app.module.ts`
4. Inject `SecretSantaService` in components
5. Start using the API!

---

**Copilot will now suggest everything automatically! 🤖✨**

