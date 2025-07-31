/**
 * Email Click Tracking API Route
 * Tracks when customers click links in agreement/confirmation emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackAgreementEmailInteraction } from '@/lib/database/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const bookingId = parseInt(params.bookingId);
  const url = request.nextUrl;
  const targetUrl = url.searchParams.get('url');
  const linkType = url.searchParams.get('type') || 'unknown';
  
  if (isNaN(bookingId)) {
    return NextResponse.redirect(targetUrl || '/');
  }

  try {
    // Track link click in audit trail
    await trackAgreementEmailInteraction(bookingId, 'agreement_viewed', {
      linkType,
      targetUrl,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });

    console.log(`Email link clicked for booking ${bookingId}: ${linkType} -> ${targetUrl}`);
  } catch (error) {
    console.error('Error tracking email click:', error);
    // Still redirect even if database update fails
  }

  // Redirect to target URL
  return NextResponse.redirect(targetUrl || '/');
}