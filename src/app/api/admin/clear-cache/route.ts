import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/nextauth.config";
import { revalidatePath, revalidateTag } from "next/cache";

// POST - Clear cache for castle data (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is authorized admin
    const adminEmails =
      process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((email) =>
        email.trim(),
      ) || [];
    const userEmail = session.user?.email?.toLowerCase();

    if (
      !userEmail ||
      !adminEmails.some((email) => email.toLowerCase() === userEmail)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Force revalidate all castle-related paths
    revalidatePath("/");
    revalidatePath("/castles");
    revalidatePath("/api/castles");
    revalidatePath("/booking");

    // Also revalidate tags
    revalidateTag("castles");

    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully for all castle-related pages",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
