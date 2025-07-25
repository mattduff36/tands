import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { backupManager, createBackup, restoreFromBackup, listBackups } from '@/lib/database/backup';
import { trackDbOperation } from '@/lib/database/performance-monitor';

/**
 * GET /api/admin/backup
 * List all available backups
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get list of all backups with performance tracking
    const backups = await trackDbOperation('read', async () => {
      return await listBackups();
    }, { queryHash: 'list_backups' });

    return NextResponse.json({
      success: true,
      backups,
      total: backups.length
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/backup:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list backups',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backup
 * Create a new backup or restore from existing backup
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

    const body = await request.json();
    const { action, backupId, options = {} } = body;

    if (action === 'create') {
      // Create a new backup
      const result = await trackDbOperation('create', async () => {
        return await createBackup({
          backupDirectory: './backups',
          maxBackups: 30,
          compressionEnabled: true,
          encryptionEnabled: false
        });
      }, { queryHash: 'create_backup' });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Backup created successfully',
          backup: result
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Backup creation failed',
            details: result.error 
          },
          { status: 500 }
        );
      }

    } else if (action === 'restore') {
      // Restore from backup
      if (!backupId) {
        return NextResponse.json(
          { error: 'backupId is required for restore action' },
          { status: 400 }
        );
      }

      const result = await trackDbOperation('update', async () => {
        return await restoreFromBackup(backupId, {
          overwriteExisting: options.overwriteExisting || false,
          validateData: options.validateData !== false, // Default to true
          dryRun: options.dryRun || false
        });
      }, { queryHash: 'restore_backup' });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: options.dryRun ? 'Dry run completed' : 'Restore completed successfully',
          result
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Restore failed',
            details: result.errors 
          },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "create" or "restore"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in POST /api/admin/backup:', error);
    return NextResponse.json(
      { 
        error: 'Backup operation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/backup
 * Delete a specific backup
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('backupId');

    if (!backupId) {
      return NextResponse.json(
        { error: 'backupId parameter is required' },
        { status: 400 }
      );
    }

    const success = await trackDbOperation('delete', async () => {
      return await backupManager.deleteBackup(backupId);
    }, { queryHash: 'delete_backup' });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Backup not found or could not be deleted' },
        { status: 404 }
      );
    }

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/backup:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete backup',
        details: error.message 
      },
      { status: 500 }
    );
  }
}