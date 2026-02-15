import { NextResponse } from 'next/server';

// Simulating database storage for payment methods
// In a real production app with a schema migration, this would be a Prisma query.
let MOCK_PAYMENT_METHODS = [
  {
    id: 'pm_1',
    type: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2028,
    isDefault: true,
    holder: 'JOHN DOE'
  },
  {
    id: 'pm_2',
    type: 'Mastercard',
    last4: '8899',
    expiryMonth: 10,
    expiryYear: 2029,
    isDefault: false,
    holder: 'JOHN DOE'
  }
];

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(MOCK_PAYMENT_METHODS);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const newMethod = {
      id: `pm_${Date.now()}`,
      type: data.type || 'Visa',
      last4: data.cardNumber?.slice(-4) || '1234',
      expiryMonth: data.expiryMonth || 12,
      expiryYear: data.expiryYear || 2030,
      isDefault: MOCK_PAYMENT_METHODS.length === 0, // First card is default
      holder: data.holder || 'STUDENT'
    };

    MOCK_PAYMENT_METHODS.push(newMethod);
    
    return NextResponse.json(newMethod);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  // Logic to delete would go here
  return NextResponse.json({ success: true });
}
