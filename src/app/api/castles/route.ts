import { NextResponse } from 'next/server';
import { getCastles } from '@/lib/database/castles';
import { castles as staticCastles } from '@/lib/castle-data';

// Enable static generation with revalidation for better performance
export const revalidate = 1800; // Revalidate every 30 minutes

// GET - Public endpoint to fetch all castles for the main website
export async function GET() {
  try {
    // Try database first, fallback to static data if DB is unavailable
    let castles;
    try {
      castles = await getCastles();
    } catch (dbError) {
      console.warn('Database unavailable, using static castle data:', dbError);
      castles = staticCastles;
    }
    
    // Create response with optimized caching headers for static data
    const response = NextResponse.json(castles);
    
    // Cache for 30 minutes with stale-while-revalidate for better performance
    // This allows serving cached data while fetching fresh data in background
    response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=300, stale-while-revalidate=3600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=1800');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=1800');
    
    return response;
  } catch (error) {
    console.error('Error fetching castles:', error);
    
    // Don't cache error responses
    const errorResponse = NextResponse.json({ error: 'Failed to fetch castles' }, { status: 500 });
    errorResponse.headers.set('Cache-Control', 'no-store');
    return errorResponse;
  }
}