import { NextResponse } from 'next/server';
import { getCastles } from '@/lib/database/castles';

// Force the route to be dynamic and not cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Public endpoint to fetch all castles for the main website
export async function GET() {
  try {
    const castles = await getCastles();
    
    // Create response with no-cache headers to ensure fresh data
    const response = NextResponse.json(castles);
    
    // Prevent caching in production to ensure admin changes are reflected immediately
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('Error fetching castles:', error);
    return NextResponse.json({ error: 'Failed to fetch castles' }, { status: 500 });
  }
}