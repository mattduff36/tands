'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ErrorInfo {
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
}

function AdminErrorContent() {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>({
    title: 'Authentication Error',
    description: 'An error occurred during authentication.',
  });

  useEffect(() => {
    const error = searchParams?.get('error');
    
    switch (error) {
      case 'access_denied':
        setErrorInfo({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin portal. Only authorized administrators can sign in.',
          action: 'Return Home',
          actionHref: '/',
        });
        break;
      case 'invalid_token':
        setErrorInfo({
          title: 'Invalid Session',
          description: 'Your session is invalid or has expired. Please sign in again.',
          action: 'Sign In',
          actionHref: '/admin/signin',
        });
        break;
      case 'middleware_error':
        setErrorInfo({
          title: 'System Error',
          description: 'A system error occurred. Please try again or contact support if the problem persists.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'Signin':
        setErrorInfo({
          title: 'Sign In Error',
          description: 'There was a problem signing you in. Please check your credentials and try again.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'OAuthSignin':
        setErrorInfo({
          title: 'OAuth Error',
          description: 'There was a problem with the OAuth provider. Please try again later.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'OAuthCallback':
        setErrorInfo({
          title: 'Callback Error',
          description: 'There was a problem processing the OAuth callback. Please try signing in again.',
          action: 'Sign In',
          actionHref: '/admin/signin',
        });
        break;
      case 'OAuthCreateAccount':
        setErrorInfo({
          title: 'Account Creation Error',
          description: 'There was a problem creating your account. Please contact support.',
          action: 'Return Home',
          actionHref: '/',
        });
        break;
      case 'EmailCreateAccount':
        setErrorInfo({
          title: 'Email Account Error',
          description: 'There was a problem with your email account. Please try again.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'Callback':
        setErrorInfo({
          title: 'Callback Error',
          description: 'There was a problem during the authentication callback.',
          action: 'Sign In',
          actionHref: '/admin/signin',
        });
        break;
      case 'OAuthAccountNotLinked':
        setErrorInfo({
          title: 'Account Not Linked',
          description: 'This account is not linked to an admin user. Please use an authorized admin account.',
          action: 'Try Different Account',
          actionHref: '/admin/signin',
        });
        break;
      case 'EmailSignin':
        setErrorInfo({
          title: 'Email Sign In Error',
          description: 'There was a problem sending the sign-in email.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'CredentialsSignin':
        setErrorInfo({
          title: 'Credentials Error',
          description: 'Invalid credentials provided. Please check your login details.',
          action: 'Try Again',
          actionHref: '/admin/signin',
        });
        break;
      case 'SessionRequired':
        setErrorInfo({
          title: 'Session Required',
          description: 'You need to be signed in to access this page.',
          action: 'Sign In',
          actionHref: '/admin/signin',
        });
        break;
      default:
        setErrorInfo({
          title: 'Unknown Error',
          description: 'An unknown error occurred. Please try again or contact support.',
          action: 'Sign In',
          actionHref: '/admin/signin',
        });
    }
  }, [searchParams]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            T&S Bouncy Castle Admin Portal
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errorInfo.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              {errorInfo.action && errorInfo.actionHref && (
                <Link href={errorInfo.actionHref}>
                  <Button className="w-full" size="lg">
                    {errorInfo.action}
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              
              <Link href="/">
                <Button variant="ghost" className="w-full" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Main Site
                </Button>
              </Link>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>If you continue to experience issues, please contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <AdminErrorContent />
    </Suspense>
  );
}