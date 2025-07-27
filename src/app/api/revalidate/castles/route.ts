import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Get the secret token from the request
    const body = await request.json();
    const { secret } = body;

    // Check for secret to confirm this is a valid revalidation request
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    // Revalidate the castles-related paths
    revalidatePath('/');
    revalidatePath('/castles');
    revalidatePath('/api/castles');
    
    // Also revalidate any tags if we were using them
    revalidateTag('castles');

    return NextResponse.json({ 
      revalidated: true, 
      message: 'Castle data revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during revalidation:', error);
    return NextResponse.json({ 
      message: 'Error revalidating castle data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 