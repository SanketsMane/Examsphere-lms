import { NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/lib/notifications/reminder-engine';

/**
 * Cron Endpoint for Session Reminders
 * Author: Sanket
 */

export async function GET(request: Request) {
  // Check for authorization header (FAIL CLOSED if secret is missing) - Author: Sanket
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron] Unauthorized or secret missing');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Execution started');
    await checkAndSendReminders();
    console.log('[Cron] Execution completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reminders processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
