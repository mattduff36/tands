import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCastles, addCastle } from '@/lib/database/castles';
import { castleSchema, validateAndSanitize } from '@/lib/validation/schemas';
import { createSanitizedErrorResponse, logSafeError } from '@/lib/utils/error-sanitizer';

// Helper function to trigger revalidation
async function triggerRevalidation() {
  try {
    if (process.env.REVALIDATION_SECRET) {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/revalidate/castles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.REVALIDATION_SECRET,
        }),
      });
    }
  } catch (error) {
    console.warn('Failed to trigger revalidation:', error);
    // Don't fail the main operation if revalidation fails
  }
}

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
    const castles = await getCastles();
    return NextResponse.json(castles);
  } catch (error) {
    logSafeError(error, 'admin-fleet-get');
    const sanitizedError = createSanitizedErrorResponse(error, 'database', 500);
    return NextResponse.json(sanitizedError, { status: 500 });
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
    
    // Validate and sanitize input data
    let validatedData;
    try {
      validatedData = validateAndSanitize(castleSchema, body);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: error instanceof Error ? error.message : 'Validation failed' 
      }, { status: 400 });
    }

    const { name, theme, size, price, description, imageUrl } = validatedData;

    // Add castle to persistent storage
    const newCastle = await addCastle({
      name,
      theme,
      size,
      price: Number(price),
      description,
      imageUrl
    });

    // Trigger revalidation to clear caches
    await triggerRevalidation();

    return NextResponse.json(newCastle, { status: 201 });
  } catch (error) {
    logSafeError(error, 'admin-fleet-create');
    const sanitizedError = createSanitizedErrorResponse(error, 'database', 500);
    return NextResponse.json(sanitizedError, { status: 500 });
  }
}