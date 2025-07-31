import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { getCastleById, updateCastle, deleteCastle } from '@/lib/database/castles';
import { cleanupOldBlobImage, deleteBlobImage } from '@/lib/utils/blob-manager';
import { castleSchema, validateAndSanitize } from '@/lib/validation/schemas';

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

// PUT - Update castle
export async function PUT(
  request: NextRequest,
  { params }: { params: { castleId: string } }
) {
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

    const castleId = parseInt(params.castleId);
    if (isNaN(castleId) || castleId <= 0) {
      return NextResponse.json({ error: 'Invalid castle ID' }, { status: 400 });
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

    // Check if castle exists and get current data
    const existingCastle = await getCastleById(castleId);
    if (!existingCastle) {
      return NextResponse.json({ error: 'Castle not found' }, { status: 404 });
    }

    // Update castle in persistent storage
    const updatedCastle = await updateCastle(castleId, {
      name,
      theme,
      size,
      price: Number(price),
      description,
      imageUrl
    });

    if (!updatedCastle) {
      return NextResponse.json({ error: 'Failed to update castle' }, { status: 500 });
    }

    // Clean up old blob image if the image URL has changed
    if (existingCastle.imageUrl !== imageUrl) {
      await cleanupOldBlobImage(existingCastle.imageUrl, imageUrl);
    }

    // Trigger revalidation to clear caches
    await triggerRevalidation();

    return NextResponse.json(updatedCastle);
  } catch (error) {
    console.error('Error updating castle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete castle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { castleId: string } }
) {
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

    const castleId = parseInt(params.castleId);
    if (isNaN(castleId) || castleId <= 0) {
      return NextResponse.json({ error: 'Invalid castle ID' }, { status: 400 });
    }

    // Check if castle exists and get current data for image cleanup
    const existingCastle = await getCastleById(castleId);
    if (!existingCastle) {
      return NextResponse.json({ error: 'Castle not found' }, { status: 404 });
    }

    // Delete castle from persistent storage
    const success = await deleteCastle(castleId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete castle' }, { status: 500 });
    }

    // Clean up associated blob image
    if (existingCastle.imageUrl) {
      await deleteBlobImage(existingCastle.imageUrl);
    }

    // Trigger revalidation to clear caches
    await triggerRevalidation();

    return NextResponse.json({ 
      message: 'Castle deleted successfully',
      deletedImageUrl: existingCastle.imageUrl 
    });
  } catch (error) {
    console.error('Error deleting castle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}