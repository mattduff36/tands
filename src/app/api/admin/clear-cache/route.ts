import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { revalidatePath, revalidateTag } from "next/cache";

// POST - Clear cache for castle data (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(null, request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
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
