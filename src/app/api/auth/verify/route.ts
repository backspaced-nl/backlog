import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234'; // Default PIN for development
const COOKIE_NAME = 'admin_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60; // 5 minutes in seconds

// In-memory store for PIN attempts
// In production, you might want to use Redis or a similar solution
const pinAttempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    // Check if IP is blocked
    const attempt = pinAttempts.get(ip);
    if (attempt && attempt.blockedUntil > Date.now()) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    if (pin === ADMIN_PIN) {
      // Reset attempts on successful login
      pinAttempts.delete(ip);

      // Set an HTTP-only cookie to maintain the session
      cookies().set(COOKIE_NAME, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    // Increment failed attempts
    const currentAttempt = pinAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    currentAttempt.count += 1;

    // Block if max attempts reached
    if (currentAttempt.count >= MAX_ATTEMPTS) {
      currentAttempt.blockedUntil = Date.now() + (BLOCK_DURATION * 1000);
      pinAttempts.set(ip, currentAttempt);
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Update attempts
    pinAttempts.set(ip, currentAttempt);

    // Return remaining attempts
    const remainingAttempts = MAX_ATTEMPTS - currentAttempt.count;
    return NextResponse.json(
      { error: `Invalid PIN. ${remainingAttempts} attempts remaining.` },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isAuthenticated = cookies().get(COOKIE_NAME)?.value === 'true';
  return NextResponse.json({ isAuthenticated });
} 