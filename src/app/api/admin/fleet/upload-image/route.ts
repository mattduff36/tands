import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth.config';

async function uploadImageToBlob(fileBuffer: Buffer, fileName: string, mimeType: string) {
 const blob = await put(fileName, fileBuffer, { 
 access: 'public',
 contentType: mimeType,
 });
 return {
 imageUrl: blob.url,
 fileId: blob.pathname,
 };
}

export async function POST(request: NextRequest) {
 try {
 const session = await getServerSession(authOptions);
 if (!session) {
 return NextResponse.json({ error: 'Unauthorized' }, { status:401 });
 }

 const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
 const userEmail = session.user?.email?.toLowerCase();
 if (!userEmail || !adminEmails.some(email => email.toLowerCase() === userEmail)) {
 return NextResponse.json({ error: 'Forbidden' }, { status:403 });
 }

 const formData = await request.formData();
 const file = formData.get('image') as File;
 if (!file) {
 return NextResponse.json({ error: 'No image file provided' }, { status:400 });
 }

 if (!file.type.startsWith('image/')) {
 return NextResponse.json({ error: 'File must be an image' }, { status:400 });
 }

 const maxSize =10 *1024 *1024; //10MB
 if (file.size > maxSize) {
 return NextResponse.json({ error: 'File size must be less than10MB' }, { status:400 });
 }

 const fileBuffer = Buffer.from(await file.arrayBuffer());
 const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
 const fileName = `castle-${timestamp}-${file.name}`;

 const uploadResult = await uploadImageToBlob(fileBuffer, fileName, file.type);

 return NextResponse.json({
 success: true,
 imageUrl: uploadResult.imageUrl,
 fileId: uploadResult.fileId,
 fileName,
 });
 } catch (error) {
 console.error('Error uploading image:', error);
 return NextResponse.json({ error: 'Failed to upload image' }, { status:500 });
 }
}

// DELETE handler remains the same, but you might want to update it to handle Vercel Blob deletions