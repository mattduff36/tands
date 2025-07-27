import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { addCastle } from '@/lib/database/castles';
import path from 'path';
import fs from 'fs';

async function seedCastles() {
  // Read placeholder castles
  const dataPath = path.resolve(process.cwd(), 'data/castles.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const castles = JSON.parse(raw);

  const results = [];
  for (const castle of castles) {
    const { id, ...castleData } = castle;
    try {
      const result = await addCastle(castleData);
      results.push({ name: castleData.name, status: 'success', id: result.id });
    } catch (err) {
      results.push({ name: castleData.name, status: 'error', error: String(err) });
    }
  }
  return results;
}

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  const userEmail = session.user?.email?.toLowerCase();
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const results = await seedCastles();
  return NextResponse.json({ results });
} 