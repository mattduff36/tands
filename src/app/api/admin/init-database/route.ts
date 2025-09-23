import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth-helpers";

import { initializeDatabase } from "@/lib/database/connection";
//import { log } from '@/lib/utils/logger';

/**
 * POST /api/admin/init-database
 * Initialize database and seed castle data
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(null, request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const allowedUsers = process.env.ACCOUNTS?.split(",") || [];
    if (!allowedUsers.includes(session.user?.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("Initializing database");

    // Initialize database (this will create tables and add maintenance fields)
    await initializeDatabase();

    console.log("Database initialized successfully");

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error: any) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
