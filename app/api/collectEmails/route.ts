// pages/api/subscribe.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
      unsubscribed: false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Resend API Error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export const runtime = "edge";