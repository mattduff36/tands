import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCastles, addCastle } from '@/lib/database/castles';

// GET - Fetch all castles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is authorized admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = session.user?.email?.toLowerCase();
    
    if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get castles from persistent storage
    const castles = getCastles();
    return NextResponse.json(castles);
  } catch (error) {
    console.error('Error fetching castles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new castle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is authorized admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = session.user?.email?.toLowerCase();
    
    if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, theme, size, price, description, imageUrl } = body;

    // Validate required fields
    if (!name || !theme || !size || !price || !description || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Add castle to persistent storage
    const newCastle = addCastle({
      name,
      theme,
      size,
      price: Number(price),
      description,
      imageUrl
    });

    return NextResponse.json(newCastle, { status: 201 });
  } catch (error) {
    console.error('Error creating castle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}