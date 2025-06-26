// pages/api/subscribe.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

interface EmailRequest {
  email: string;
}

export async function POST(req: Request) {
  try {
    // Initialize Resend client inside the function to avoid build-time issues
    const resendApiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!resendApiKey) {
      console.error('❌ [EMAIL API] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    if (!audienceId) {
      console.error('❌ [EMAIL API] RESEND_AUDIENCE_ID not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const body = await req.json() as EmailRequest;
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    console.log('📧 [EMAIL API] Processing email subscription for:', email);

    const result = await resend.contacts.create({
      email,
      audienceId: audienceId,
      unsubscribed: false,
    });

    console.log('✅ [EMAIL API] Successfully added contact:', email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [EMAIL API] Resend API Error:', error);
    return NextResponse.json({ error: 'Failed to subscribe email' }, { status: 500 });
  }
}