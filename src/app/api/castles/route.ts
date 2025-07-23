import { NextResponse } from 'next/server';
import { getCastles } from '@/lib/database/castles';

// GET - Public endpoint to fetch all castles for the main website
export async function GET() {
  try {
    const castles = await getCastles();
    return NextResponse.json(castles);
  } catch (error) {
    console.error('Error fetching castles:', error);
    return NextResponse.json({ error: 'Failed to fetch castles' }, { status: 500 });
  }
}