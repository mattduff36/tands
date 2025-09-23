import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth-helpers";

async function uploadImageToBlob(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
) {
  const blob = await put(fileName, fileBuffer, {
    access: "public",
    contentType: mimeType,
  });
  return {
    imageUrl: blob.url,
    fileId: blob.pathname,
    downloadUrl: blob.downloadUrl,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(null, request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    const userEmail = session.user?.email?.toLowerCase();
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `castle-${timestamp}-${file.name}`;

    const uploadResult = await uploadImageToBlob(
      fileBuffer,
      fileName,
      file.type,
    );

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.imageUrl,
      fileId: uploadResult.fileId,
      downloadUrl: uploadResult.downloadUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

// DELETE handler for cleaning up specific blob images
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(null, request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    const userEmail = session.user?.email?.toLowerCase();
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 },
      );
    }

    // Import deleteBlobImage dynamically to avoid issues
    const { deleteBlobImage } = await import("@/lib/utils/blob-manager");
    const success = await deleteBlobImage(imageUrl);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
        deletedUrl: imageUrl,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
