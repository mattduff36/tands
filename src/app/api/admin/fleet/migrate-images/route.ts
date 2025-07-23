import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getCastles, updateCastleImageUrls } from '@/lib/database/castles';

// Google Drive setup
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_NAME = 'Bouncy Castle Images';

async function getGoogleDriveClient() {
  try {
    // Use environment variables for service account credentials
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Missing Google service account credentials in environment variables');
    }

    // Create JWT client
    const jwtClient = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    // Authorize the client
    await jwtClient.authorize();

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth: jwtClient });
    
    return drive;
  } catch (error) {
    console.error('Error setting up Google Drive client:', error);
    throw error;
  }
}

async function getOrCreateFolder(drive: any, folderName: string) {
  try {
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    return folderResponse.data.id;
  } catch (error) {
    console.error('Error getting/creating folder:', error);
    throw error;
  }
}

async function uploadImageToDrive(drive: any, filePath: string, fileName: string, folderId: string) {
  try {
    const fileStream = fs.createReadStream(filePath);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: fileStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get the direct image URL
    const imageUrl = `https://drive.google.com/uc?id=${response.data.id}`;
    
    return {
      fileId: response.data.id,
      imageUrl,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error uploading image to Drive:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is authorized admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const userEmail = session.user?.email?.toLowerCase();
    
    if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results: any[] = [];
    const publicDir = path.join(process.cwd(), 'public');

    // Set up Google Drive client
    const drive = await getGoogleDriveClient();
    
    // Get or create the images folder
    const folderId = await getOrCreateFolder(drive, FOLDER_NAME);

    // Get castles from persistent storage
    const castles = getCastles();

    // Process each castle's image
    for (const castle of castles) {
      try {
        // Skip if already using a Google Drive URL
        if (castle.imageUrl.includes('drive.google.com')) {
          results.push({
            castleId: castle.id,
            name: castle.name,
            status: 'skipped',
            reason: 'Already using Google Drive URL',
            originalUrl: castle.imageUrl,
            newUrl: castle.imageUrl
          });
          continue;
        }

        // Get the local file path
        const localImagePath = path.join(publicDir, castle.imageUrl.replace(/^\//, ''));
        
        // Check if file exists
        if (!fs.existsSync(localImagePath)) {
          results.push({
            castleId: castle.id,
            name: castle.name,
            status: 'failed',
            reason: 'Local file not found',
            originalUrl: castle.imageUrl,
            filePath: localImagePath
          });
          continue;
        }

        // Upload to Google Drive
        const fileName = `castle-${castle.id}-${path.basename(castle.imageUrl)}`;
        const uploadResult = await uploadImageToDrive(
          drive,
          localImagePath,
          fileName,
          folderId
        );

        results.push({
          castleId: castle.id,
          name: castle.name,
          status: 'success',
          originalUrl: castle.imageUrl,
          newUrl: uploadResult.imageUrl,
          driveFileId: uploadResult.fileId
        });

      } catch (error) {
        console.error(`Error processing castle ${castle.id}:`, error);
        results.push({
          castleId: castle.id,
          name: castle.name,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
          originalUrl: castle.imageUrl
        });
      }
    }

    // Update castle image URLs in persistent storage
    const successfulUploads = results.filter(r => r.status === 'success');
    if (successfulUploads.length > 0) {
      try {
        const updates = successfulUploads.map(upload => ({
          id: upload.castleId,
          imageUrl: upload.newUrl
        }));
        
        updateCastleImageUrls(updates);
      } catch (error) {
        console.error('Error updating castle data:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to update castle data',
          results
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. ${results.filter(r => r.status === 'success').length} images uploaded successfully.`,
      results
    });

  } catch (error) {
    console.error('Error migrating images:', error);
    return NextResponse.json(
      { error: 'Failed to migrate images' }, 
      { status: 500 }
    );
  }
}