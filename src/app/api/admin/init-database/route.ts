import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { initializeDatabase } from '@/lib/database/connection';
import { log } from '@/lib/utils/logger';

/**
 * POST /api/admin/init-database
 * Initialize database and seed castle data
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is authorized admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = session.user?.email?.toLowerCase();
    
    if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    log.info('Initializing database');
    
    // Initialize database (this will create tables and add maintenance fields)
    await initializeDatabase();
    
    log.info('Database initialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });

  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 