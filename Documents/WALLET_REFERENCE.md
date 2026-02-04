# Wallet System - Quick Reference

## API Endpoints

### Wallet Management
- `GET /api/wallet/balance` - Get current user's wallet balance
- `POST /api/wallet/recharge` - Create Razorpay order for recharge

### Purchases
- `POST /api/courses/[slug]/enroll-wallet` - Enroll in course using wallet
- `POST /api/sessions/[id]/book-wallet` - Book session using wallet
- `POST /app/actions/groups.ts → joinGroupClass(groupId, "wallet")` - Join group with wallet (includes 20% platform fee tracking)

### Webhook
- `POST /api/webhook/razorpay` - Processes wallet recharges and other payment events

---

## Server Actions

### Wallet Actions (`app/actions/wallet.ts`)
```typescript
// Get balance
const balance = await getWalletBalance();

// Get full wallet
const wallet = await getWallet(userId);

// Get transaction history
const transactions = await getTransactionHistory(50);

// Deduct from wallet (internal use)
await deductFromWallet(userId, amount, type, description, metadata);

// Credit to wallet (internal use)
await creditToWallet(userId, amount, type, description, metadata);
```

---

## Database Schema

### Wallet
```prisma
model Wallet {
  id            String              @id @default(uuid())
  userId        String              @unique
  balance       Int                 @default(0) // 1 point = ₹1
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  user          User                @relation(...)
  transactions  WalletTransaction[]
}
```

### WalletTransaction
```prisma
model WalletTransaction {
  id              String                @id @default(uuid())
  walletId        String
  type            WalletTransactionType
  amount          Int                   // Positive = credit, Negative = debit
  balanceBefore   Int
  balanceAfter    Int
  description     String
  metadata        Json?
  razorpayOrderId String?
  createdAt       DateTime              @default(now())
  
  wallet          Wallet                @relation(...)
}
```

### Transaction Types
- `RECHARGE` - Adding money via Razorpay
- `COURSE_PURCHASE` - Buying a course
- `SESSION_BOOKING` - Booking live session
- `GROUP_ENROLLMENT` - Joining group class
- `REFUND` - Money returned
- `ADMIN_CREDIT` - Admin added balance
- `ADMIN_DEBIT` - Admin removed balance

---

## Component Usage

### Payment Selection Dialog
```tsx
import { PaymentSelectionDialog } from "@/components/payment/PaymentSelectionDialog";

<PaymentSelectionDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  amount={coursePrice}
  itemType="course"
  itemTitle={courseTitle}
  onOnlinePayment={async () => {
    // Handle Razorpay checkout
  }}
  onWalletPayment={async () => {
    // Handle wallet payment
  }}
/>
```

---

## Common Patterns

### Check Wallet Balance Before Purchase
```typescript
const balance = await getWalletBalance();
if (balance < itemPrice) {
  return { error: `Insufficient balance. You need ₹${itemPrice - balance} more.` };
}
```

### Atomic Purchase Transaction
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Deduct from wallet
  await deductFromWallet(userId, amount, type, description, metadata);
  
  // 2. Create enrollment/booking
  const enrollment = await tx.enrollment.create({ ... });
  
  // 3. Create commission (20%)
  const { calculatePlatformCommission } = await import("@/lib/finance");
  const { platformFee, teacherNet } = await calculatePlatformCommission(amount * 100);
  await tx.commission.create({ ... });
  
  // 4. Send notification
  await tx.notification.create({ ... });
});
```

---

## Error Handling

### Insufficient Balance
```typescript
try {
  await deductFromWallet(userId, amount, type, description);
} catch (error) {
  if (error.message?.includes("Insufficient balance")) {
    // Show "Add money" prompt
  }
}
```

### Webhook Idempotency (Razorpay)
```typescript
const existing = await prisma.walletTransaction.findFirst({
  where: { razorpayOrderId: orderId }
});

if (existing && existing.status === 'SUCCESS') {
  console.log("Already processed");
  return;
}
```

---

## Testing

### Test Razorpay
- Use Razorpay Test Mode credentials
- Use Test Cards provided in Razorpay documentation (e.g., 4111 1111 1111 1111)

---

## Monitoring Queries

### Daily Wallet Activity
```sql
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM wallet_transactions
WHERE "createdAt" >= CURRENT_DATE
GROUP BY type;
```

---

Author: Sanket
