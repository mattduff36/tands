import { del } from '@vercel/blob';

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isVercelBlobUrl(url: string): boolean {
  return Boolean(url && url.startsWith('https://') && url.includes('.blob.vercel-storage.com/'));
}

/**
 * Extract the blob pathname from a Vercel Blob URL
 */
export function extractBlobPathname(url: string): string | null {
  if (!isVercelBlobUrl(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error extracting blob pathname:', error);
    return null;
  }
}

/**
 * Delete a blob from Vercel Blob storage
 */
export async function deleteBlobImage(imageUrl: string): Promise<boolean> {
  if (!isVercelBlobUrl(imageUrl)) {
    console.log('Not a Vercel Blob URL, skipping deletion:', imageUrl);
    return true; // Not an error, just not a blob URL
  }

  try {
    await del(imageUrl);
    console.log('Successfully deleted blob:', imageUrl);
    return true;
  } catch (error) {
    console.error('Error deleting blob:', imageUrl, error);
    return false;
  }
}

/**
 * Delete multiple blob images
 */
export async function deleteBlobImages(imageUrls: string[]): Promise<{ success: string[], failed: string[] }> {
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };

  for (const url of imageUrls) {
    if (isVercelBlobUrl(url)) {
      const success = await deleteBlobImage(url);
      if (success) {
        results.success.push(url);
      } else {
        results.failed.push(url);
      }
    }
  }

  return results;
}

/**
 * Clean up old blob image when a new one is uploaded
 */
export async function cleanupOldBlobImage(oldImageUrl: string, newImageUrl: string): Promise<void> {
  // Only delete if the old URL is different from the new one and is a blob URL
  if (oldImageUrl && oldImageUrl !== newImageUrl && isVercelBlobUrl(oldImageUrl)) {
    await deleteBlobImage(oldImageUrl);
  }
} 