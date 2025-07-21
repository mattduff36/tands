import { refreshAccessToken } from './google-auth';
import type { AdminUser, SessionData } from './google-auth';

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, SessionData>();

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanup();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session
   */
  createSession(sessionId: string, user: AdminUser, tokens?: { 
    accessToken?: string; 
    refreshToken?: string;
    expiresIn?: number;
  }): SessionData {
    const expiresAt = tokens?.expiresIn 
      ? Date.now() + (tokens.expiresIn * 1000)
      : Date.now() + (24 * 60 * 60 * 1000); // 24 hours default

    const session: SessionData = {
      user,
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
      expiresAt,
    };

    sessionStore.set(sessionId, session);
    console.log(`Session created for ${user.email}, expires at ${new Date(expiresAt)}`);
    
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | null {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log(`Session expired for ID: ${sessionId}`);
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session data
   */
  updateSession(sessionId: string, updates: Partial<SessionData>): SessionData | null {
    const existingSession = sessionStore.get(sessionId);
    
    if (!existingSession) {
      return null;
    }

    const updatedSession = {
      ...existingSession,
      ...updates,
    };

    sessionStore.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    return sessionStore.delete(sessionId);
  }

  /**
   * Get valid access token (refresh if necessary)
   */
  async getValidAccessToken(sessionId: string): Promise<string | null> {
    const session = this.getSession(sessionId);
    
    if (!session || !session.refreshToken) {
      return null;
    }

    // Check if access token is still valid (with 5 minute buffer)
    const tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes
    const isTokenValid = session.accessToken && 
      (session.expiresAt - Date.now()) > tokenExpiryBuffer;

    if (isTokenValid) {
      return session.accessToken!;
    }

    // Try to refresh the access token
    try {
      console.log(`Refreshing access token for session: ${sessionId}`);
      const refreshResponse = await refreshAccessToken(session.refreshToken);
      
      // Update session with new tokens
      const updatedSession = this.updateSession(sessionId, {
        accessToken: refreshResponse.access_token,
        refreshToken: refreshResponse.refresh_token || session.refreshToken,
        expiresAt: Date.now() + (refreshResponse.expires_in * 1000),
      });

      if (updatedSession) {
        console.log(`Access token refreshed successfully for session: ${sessionId}`);
        return updatedSession.accessToken!;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to refresh access token for session ${sessionId}:`, error);
      // If refresh fails, delete the session
      this.deleteSession(sessionId);
      return null;
    }
  }

  /**
   * Get all sessions for a user (by email)
   */
  getUserSessions(userEmail: string): { sessionId: string; session: SessionData }[] {
    const userSessions: { sessionId: string; session: SessionData }[] = [];
    
    for (const [sessionId, session] of sessionStore) {
      if (session.user.email === userEmail && Date.now() <= session.expiresAt) {
        userSessions.push({ sessionId, session });
      }
    }
    
    return userSessions;
  }

  /**
   * Revoke all sessions for a user
   */
  revokeUserSessions(userEmail: string): number {
    let revokedCount = 0;
    
    for (const [sessionId, session] of sessionStore) {
      if (session.user.email === userEmail) {
        sessionStore.delete(sessionId);
        revokedCount++;
      }
    }
    
    console.log(`Revoked ${revokedCount} sessions for user: ${userEmail}`);
    return revokedCount;
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    
    for (const [, session] of sessionStore) {
      if (now <= session.expiresAt) {
        activeCount++;
      } else {
        expiredCount++;
      }
    }
    
    return {
      total: sessionStore.size,
      active: activeCount,
      expired: expiredCount,
    };
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  private startCleanup() {
    // Clean up expired sessions every 15 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 15 * 60 * 1000);

    console.log('Session cleanup started');
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Session cleanup stopped');
    }
  }

  /**
   * Manually clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of sessionStore) {
      if (now > session.expiresAt) {
        sessionStore.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  }

  /**
   * Clear all sessions (useful for testing or maintenance)
   */
  clearAllSessions(): number {
    const count = sessionStore.size;
    sessionStore.clear();
    console.log(`Cleared all ${count} sessions`);
    return count;
  }

  /**
   * Extend session expiry
   */
  extendSession(sessionId: string, additionalTime: number = 24 * 60 * 60 * 1000): boolean {
    const session = sessionStore.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.expiresAt = Math.max(session.expiresAt, Date.now()) + additionalTime;
    sessionStore.set(sessionId, session);
    
    console.log(`Extended session ${sessionId} until ${new Date(session.expiresAt)}`);
    return true;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Session utilities
export async function createUserSession(
  sessionId: string, 
  user: AdminUser, 
  tokens?: { accessToken?: string; refreshToken?: string; expiresIn?: number }
): Promise<SessionData> {
  return sessionManager.createSession(sessionId, user, tokens);
}

export async function getUserSession(sessionId: string): Promise<SessionData | null> {
  return sessionManager.getSession(sessionId);
}

export async function refreshUserToken(sessionId: string): Promise<string | null> {
  return sessionManager.getValidAccessToken(sessionId);
}

export async function revokeUserSession(sessionId: string): Promise<boolean> {
  return sessionManager.deleteSession(sessionId);
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('Shutting down session manager...');
  sessionManager.stopCleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down session manager...');
  sessionManager.stopCleanup();
  process.exit(0);
});