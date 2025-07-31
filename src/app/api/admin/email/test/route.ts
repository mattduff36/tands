/**
 * Email Configuration Test API Route
 * Tests email service configuration and SMTP connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { testEmailConfiguration } from '@/lib/email/email-service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test email configuration
    const testResult = await testEmailConfiguration();

    return NextResponse.json(testResult, { 
      status: testResult.success ? 200 : 400 
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to test email configuration',
      details: error 
    }, { status: 500 });
  }
}