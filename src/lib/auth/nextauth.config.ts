import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { 
  isAdminEmail, 
  verifyAdminUser, 
  AdminAccessDeniedError,
  type AdminUser 
} from './google-auth';

declare module 'next-auth' {
  interface Session {
    user: AdminUser;
    accessToken?: string;
  }
  
  interface User extends AdminUser {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: AdminUser;
    accessToken?: string;
    refreshToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Check if user email is in the admin list
        if (!user.email || !isAdminEmail(user.email)) {
          console.warn(`Access denied for non-admin email: ${user.email}`);
          return false;
        }

        // Verify admin user
        const adminUser = verifyAdminUser(user);
        if (!adminUser) {
          console.warn(`Admin verification failed for: ${user.email}`);
          return false;
        }

        // Store access token for calendar access
        if (account?.access_token) {
          user.accessToken = account.access_token;
        }

        console.log(`Admin access granted for: ${user.email}`);
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const adminUser = verifyAdminUser(user);
        if (!adminUser) {
          throw new AdminAccessDeniedError(user.email || undefined);
        }

        return {
          ...token,
          user: adminUser,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
        };
      }

      // Return previous token if the access token has not expired yet
      return token;
    },

    async session({ session, token }) {
      if (token.user && token.user.isAdmin) {
        session.user = token.user;
        session.accessToken = token.accessToken;
      } else {
        // Invalid session - clear it
        throw new AdminAccessDeniedError();
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/admin`;
    },
  },

  pages: {
    signIn: '/admin/signin',
    error: '/admin/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`Admin signed in: ${user.email} (isNewUser: ${isNewUser})`);
    },
    
    async signOut({ token }) {
      console.log(`Admin signed out: ${token.user?.email}`);
    },
    
    async session({ session, token }) {
      // Log session activity for security monitoring
      if (process.env.NODE_ENV === 'production') {
        console.log(`Admin session active: ${session.user.email}`);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Helper function to get server-side session
export async function getServerSession(req: any, res: any) {
  const { getServerSession: nextAuthGetServerSession } = await import('next-auth/next');
  return nextAuthGetServerSession(req, res, authOptions);
}

// Middleware helper to check admin access
export function requireAdmin(handler: any) {
  return async (req: any, res: any) => {
    const session = await getServerSession(req, res);
    
    if (!session?.user?.isAdmin) {
      return res.status(401).json({ 
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_DENIED' 
      });
    }
    
    return handler(req, res, session);
  };
}

// Client-side admin check hook
export function useAdminSession() {
  const { useSession } = require('next-auth/react');
  const { data: session, status } = useSession();
  
  return {
    session: session as any,
    isAdmin: session?.user?.isAdmin || false,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}