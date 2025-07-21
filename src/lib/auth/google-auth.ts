import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  isAdmin: boolean;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  adminEmails: string[];
  nextAuthSecret: string;
}

export interface SessionData {
  user: AdminUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: number;
}

// Configuration
const getAuthConfig = (): AuthConfig => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!clientId || !clientSecret || !nextAuthSecret) {
    throw new Error('Missing required Google OAuth environment variables');
  }

  if (adminEmails.length === 0) {
    throw new Error('No admin emails configured');
  }

  return {
    clientId,
    clientSecret,
    adminEmails,
    nextAuthSecret
  };
};

// Google Auth Client
let googleAuthClient: GoogleAuth | null = null;

export const getGoogleAuthClient = (): GoogleAuth => {
  if (!googleAuthClient) {
    const config = getAuthConfig();
    googleAuthClient = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar'
      ],
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret
      }
    });
  }
  return googleAuthClient;
};

// Admin verification
export const isAdminEmail = (email: string): boolean => {
  const config = getAuthConfig();
  return config.adminEmails.includes(email.toLowerCase());
};

export const verifyAdminUser = (user: any): AdminUser | null => {
  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }

  return {
    id: user.id || user.sub,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    image: user.picture || user.image,
    isAdmin: true
  };
};

// JWT Token Management
export const createAdminToken = (user: AdminUser): string => {
  const config = getAuthConfig();
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    },
    config.nextAuthSecret,
    {
      expiresIn: '24h',
      issuer: 'tsb-admin',
      subject: user.id
    }
  );
};

export const verifyAdminToken = (token: string): AdminUser | null => {
  try {
    const config = getAuthConfig();
    const decoded = jwt.verify(token, config.nextAuthSecret) as any;
    
    if (!decoded.isAdmin || !isAdminEmail(decoded.email)) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      isAdmin: true
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Session Management
export const createSessionData = (user: AdminUser, tokens?: { accessToken?: string; refreshToken?: string }): SessionData => {
  return {
    user,
    accessToken: tokens?.accessToken,
    refreshToken: tokens?.refreshToken,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
};

export const isSessionValid = (session: SessionData): boolean => {
  return session.expiresAt > Date.now() && session.user.isAdmin;
};

// OAuth URL Generation
export const generateAuthUrl = (redirectUri: string, state?: string): string => {
  const config = getAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent'
  });

  if (state) {
    params.append('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Token Exchange
export const exchangeCodeForTokens = async (code: string, redirectUri: string) => {
  const config = getAuthConfig();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
};

// Get User Info from Access Token
export const getUserInfo = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  return response.json();
};

// Refresh Token
export const refreshAccessToken = async (refreshToken: string) => {
  const config = getAuthConfig();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
};

// Error Classes
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AdminAccessDeniedError extends AuthError {
  constructor(email?: string) {
    super(
      email 
        ? `Access denied for ${email}. Admin access required.`
        : 'Access denied. Admin access required.',
      'ADMIN_ACCESS_DENIED'
    );
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super('Invalid or expired token', 'INVALID_TOKEN');
  }
}