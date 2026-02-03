import twilio from 'twilio';

/**
 * SMS Notification Service
 * Author: Sanket
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send a session reminder via SMS
 */
export async function sendSessionReminderSMS(params: {
  phoneNumber: string;
  teacherName: string;
  sessionTitle: string;
  sessionTimeDisplay: string;
  timeUntil: '24h' | '1h';
}): Promise<boolean> {
  if (!client) {
    console.log('---------------------------------------------------');
    console.log('SMS REMINDER (MOCKED):');
    console.log('To:', params.phoneNumber);
    console.log('Message:', `Reminder: Your session "${params.sessionTitle}" with ${params.teacherName} is ${params.timeUntil === '24h' ? 'tomorrow' : 'in 1 hour'} at ${params.sessionTimeDisplay}.`);
    console.log('---------------------------------------------------');
    return true;
  }

  const message = params.timeUntil === '24h'
    ? `Reminder: Your session "${params.sessionTitle}" with ${params.teacherName} is tomorrow at ${params.sessionTimeDisplay}.`
    : `Starting Soon: Your session "${params.sessionTitle}" with ${params.teacherName} starts in 1 hour at ${params.sessionTimeDisplay}!`;

  try {
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: params.phoneNumber
    });
    console.log('SMS sent successfully:', result.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}
