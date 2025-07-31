import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { updateCastleMaintenance, getCastleById } from '@/lib/database/castles';
import { getCalendarService } from '@/lib/calendar/google-calendar';
import { log } from '@/lib/utils/logger';

/**
 * PUT /api/admin/fleet/[castleId]/maintenance
 * Update castle maintenance status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { castleId: string } }
) {
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

    const castleId = parseInt(params.castleId);
    if (isNaN(castleId)) {
      return NextResponse.json(
        { error: 'Invalid castle ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, notes, startDate, endDate } = body;

    // Validate required fields
    if (!status || !['available', 'maintenance', 'out_of_service'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid maintenance status' },
        { status: 400 }
      );
    }

    // Validate dates are provided for maintenance/out_of_service status
    if (status !== 'available') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Start date and end date are required for maintenance or out of service status' },
          { status: 400 }
        );
      }

      // Validate date format and range
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      if (startDateTime > endDateTime) {
        return NextResponse.json(
          { error: 'Start date must be before or equal to end date' },
          { status: 400 }
        );
      }
    }

    // Get castle details for calendar event
    const castle = await getCastleById(castleId);
    if (!castle) {
      return NextResponse.json(
        { error: 'Castle not found' },
        { status: 404 }
      );
    }

    // If setting to available and no dates provided, get current maintenance dates before updating
    let currentMaintenanceDates: { startDate?: string; endDate?: string } | null = null;
    if (status === 'available' && (!startDate || !endDate)) {
      currentMaintenanceDates = {
        startDate: castle.maintenanceStartDate,
        endDate: castle.maintenanceEndDate
      };
    }

    // Update castle maintenance status
    const updatedCastle = await updateCastleMaintenance(castleId, {
      status,
      notes,
      startDate,
      endDate
    });

    if (!updatedCastle) {
      return NextResponse.json(
        { error: 'Castle not found' },
        { status: 404 }
      );
    }

    // Handle Google Calendar events for maintenance
    try {
      const calendarService = getCalendarService();
      
          log.info('Maintenance status update initiated', {
      castleId,
      status,
      startDate,
      endDate
    });
      
      if (status === 'available') {
        // Remove maintenance events from calendar
        if (startDate && endDate) {
          // Delete events in the specific date range
          log.info('Deleting maintenance events with provided dates', { startDate, endDate });
          await calendarService.deleteMaintenanceEvents(castleId, startDate, endDate);
        } else if (currentMaintenanceDates?.startDate && currentMaintenanceDates?.endDate) {
          // Use the dates we got before updating the database
          log.info('Deleting maintenance events with current dates', { 
        startDate: currentMaintenanceDates.startDate, 
        endDate: currentMaintenanceDates.endDate 
      });
          await calendarService.deleteMaintenanceEvents(
            castleId, 
            currentMaintenanceDates.startDate, 
            currentMaintenanceDates.endDate
          );
        } else {
          log.warn('No maintenance dates available for castle', { castleId });
        }
      } else {
        // Add or update maintenance event in calendar
        // Dates are already validated above for non-available status
        log.info('Creating maintenance event for castle', { castleId });
        await calendarService.createMaintenanceEvent({
          castleId,
          castleName: castle.name,
          startDate,
          endDate,
          notes: notes || '',
          status
        });
      }
    } catch (calendarError) {
      console.error('Error managing calendar events for maintenance:', calendarError);
      // Don't fail the main operation if calendar fails
    }

    return NextResponse.json(updatedCastle);

  } catch (error: any) {
    console.error('Error updating castle maintenance:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fleet/[castleId]/maintenance
 * Get castle maintenance status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { castleId: string } }
) {
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

    const castleId = parseInt(params.castleId);
    if (isNaN(castleId)) {
      return NextResponse.json(
        { error: 'Invalid castle ID' },
        { status: 400 }
      );
    }

    // Get castle details
    const castle = await getCastleById(castleId);

    if (!castle) {
      return NextResponse.json(
        { error: 'Castle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: castle.id,
      name: castle.name,
      maintenanceStatus: castle.maintenanceStatus,
      maintenanceNotes: castle.maintenanceNotes,
      maintenanceStartDate: castle.maintenanceStartDate,
      maintenanceEndDate: castle.maintenanceEndDate
    });

  } catch (error: any) {
    console.error('Error getting castle maintenance:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 