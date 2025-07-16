/** @format */

/**
 * SMS service that safely handles Twilio integration
 * This file uses dynamic imports to avoid build-time issues
 */

export async function sendSMS(phoneNumber: string, code: string): Promise<void> {
  // Twilio configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured');
    throw new Error('SMS service not configured');
  }
  
  // In development, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 DEV MODE - OTP for ${phoneNumber}: ${code}`);
    return;
  }
  
  // In production, send via Twilio
  try {
    // Only import Twilio if we're actually in Node.js runtime
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      // Use eval to prevent webpack from analyzing this require
      const twilioPackage = eval('require')('twilio');
      const twilio = twilioPackage(accountSid, authToken);
      
      await twilio.messages.create({
        body: `Your Kajen Traders verification code is: ${code}. Valid for 5 minutes.`,
        from: fromNumber,
        to: phoneNumber
      });
      
      console.log(`SMS sent successfully to ${phoneNumber}`);
    } else {
      throw new Error('Twilio not available in this environment');
    }
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send verification code');
  }
}
