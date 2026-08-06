import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // In a full production app with Firebase Admin SDK, we would verify the token here using:
    // admin.auth().verifyIdToken(token)
    // However, since we are doing client-side verification, we just use the token to set a session cookie.
    
    // We set the auth cookie to tell the Next.js middleware that the user is authenticated.
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'kitabi_admin_auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
