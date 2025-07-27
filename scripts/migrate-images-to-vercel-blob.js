// Migration script: Move all bouncy castle images to Vercel Blob storage and update DB

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { getCastles, updateCastleImageUrls } = require('../src/lib/database/castles');
const { put } = require('@vercel/blob');

function isVercelBlobUrl(url) {
  return url && url.startsWith('https://') && url.includes('.blob.vercel-storage.com/');
}

function getMimeType(filename) {
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

async function uploadImageToBlob(fileBuffer, fileName, mimeType) {
  const blob = await put(fileName, fileBuffer, {
    access: 'public',
    contentType: mimeType,
  });
  return {
    imageUrl: blob.url,
    fileId: blob.pathname,
  };
}

async function migrate() {
  const publicDir = path.resolve(__dirname, '../public');
  const castles = await getCastles();
  const updates = [];
  const results = [];

  for (const castle of castles) {
    try {
      if (isVercelBlobUrl(castle.imageUrl)) {
        results.push({ id: castle.id, name: castle.name, status: 'skipped', reason: 'Already Vercel Blob', url: castle.imageUrl });
        continue;
      }
      let localImagePath;
      if (castle.imageUrl.startsWith('/')) {
        localImagePath = path.join(publicDir, castle.imageUrl.replace(/^\//, ''));
      } else if (castle.imageUrl.startsWith('http')) {
        results.push({ id: castle.id, name: castle.name, status: 'skipped', reason: 'Remote image migration not implemented', url: castle.imageUrl });
        continue;
      } else {
        results.push({ id: castle.id, name: castle.name, status: 'failed', reason: 'Unknown imageUrl format', url: castle.imageUrl });
        continue;
      }
      if (!fs.existsSync(localImagePath)) {
        results.push({ id: castle.id, name: castle.name, status: 'failed', reason: 'Local file not found', filePath: localImagePath });
        continue;
      }
      const fileBuffer = fs.readFileSync(localImagePath);
      const fileName = `castle-${castle.id}-${path.basename(castle.imageUrl)}`;
      const mimeType = getMimeType(fileName);
      const uploadResult = await uploadImageToBlob(fileBuffer, fileName, mimeType);
      updates.push({ id: castle.id, imageUrl: uploadResult.imageUrl });
      results.push({ id: castle.id, name: castle.name, status: 'success', oldUrl: castle.imageUrl, newUrl: uploadResult.imageUrl });
    } catch (err) {
      results.push({ id: castle.id, name: castle.name, status: 'failed', reason: err.message, url: castle.imageUrl });
    }
  }

  if (updates.length > 0) {
    await updateCastleImageUrls(updates);
    console.log(`Updated ${updates.length} castle image URLs in the database.`);
  }

  for (const r of results) {
    if (r.status === 'success') {
      console.log(`[SUCCESS] ${r.name}: ${r.oldUrl} -> ${r.newUrl}`);
    } else if (r.status === 'skipped') {
      console.log(`[SKIPPED] ${r.name}: ${r.reason} (${r.url})`);
    } else {
      console.log(`[FAILED] ${r.name}: ${r.reason} (${r.url || r.filePath})`);
    }
  }
  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
