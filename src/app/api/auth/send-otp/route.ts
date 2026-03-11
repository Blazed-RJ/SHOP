import { NextResponse } from 'next/server';
import { db } from '@/db';
import { otpRequests } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Generate a simple 6-digit OTP (in a real app, use crypto library)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to database
    await db.insert(otpRequests).values({
      phone,
      otp,
      expiresAt,
      verified: false,
    });

    // Mock sending SMS via logger (in production, call Twilio/MSG91 here)
    console.log(`\n\n===========================================`);
    console.log(`📲 MOCK SMS GATEWAY (DO NOT SHIP TO PROD)`);
    console.log(`To: ${phone}`);
    console.log(`Your Blazed ERP login code is: ${otp}`);
    console.log(`===========================================\n\n`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
