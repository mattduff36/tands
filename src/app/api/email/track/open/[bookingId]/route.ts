/**
 * Email Open Tracking API Route
 * Tracks when customers open agreement/confirmation emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackAgreementEmailInteraction } from '@/lib/database/bookings';

// 1x1 transparent tracking pixel
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const bookingId = parseInt(params.bookingId);
  
  if (isNaN(bookingId)) {
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  try {
    // Track email open in audit trail
    await trackAgreementEmailInteraction(bookingId, 'email_opened', {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });

    console.log(`Email opened tracked for booking ${bookingId}`);
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return tracking pixel even if database update fails
  }

  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache', 
      'Expires': '0'
    }
  });
}