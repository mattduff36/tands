import { Metadata } from 'next';
import { TestPaymentForm } from '@/components/test-payment/TestPaymentForm';

// Prevent indexing by search engines
export const metadata: Metadata = {
  title: 'Test Payment - T&S Bouncy Castle Hire',
  description: 'Test payment page for development purposes only',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  other: {
    'robots': 'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache',
  },
};

const TestPaymentPage = () => {
  return (
    <>
      {/* Additional meta tags to prevent indexing */}
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
      <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
      <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" />
      
      <div className="bg-gradient-booking py-4 pt-24 sm:py-12 sm:pt-28">
        <main className="container mx-auto px-2 sm:px-8">
          <div className="bg-gradient-to-r from-red-100 to-orange-100 p-2 sm:p-8 rounded-xl sm:rounded-3xl border-4 border-red-300 shadow-xl flex flex-col min-h-[600px] h-full max-w-4xl mx-auto">
            
            {/* Warning Banner */}
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>⚠️ DEVELOPMENT TESTING ONLY</strong> - This page is for testing purposes only. 
                    Do not use real payment information. No actual payments will be processed.
                  </p>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-2 sm:mb-6 text-center leading-tight pb-1 sm:pb-2" tabIndex={0} aria-label="Test Payment System">
              🧪 Test Payment System
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              {/* Left Column - Payment Form */}
              <div className="space-y-6">
                <TestPaymentForm />
              </div>
              
              {/* Right Column - Information */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-orange-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Testing Information
                  </h2>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p><strong>Purpose:</strong> Testing payment platform integration and user experience</p>
                    <p><strong>Status:</strong> Development environment only</p>
                    <p><strong>Security:</strong> This page is blocked from search engines</p>
                    <p><strong>Data:</strong> No real payment processing - test data only</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-green-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recommended Payment Providers
                  </h2>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-blue-700">Stripe (Recommended)</h3>
                      <p className="text-sm text-gray-600">1.5% + 20p • Most secure • Best for deposits</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-green-700">Square</h3>
                      <p className="text-sm text-gray-600">1.4% + 25p • Small business friendly • Easy setup</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-semibold text-purple-700">Open Banking</h3>
                      <p className="text-sm text-gray-600">0.1-1% • Lowest fees • Instant payments</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-blue-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security Features
                  </h2>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      PCI DSS Level 1 Compliance
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      End-to-end encryption
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Fraud detection & prevention
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      3D Secure authentication
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TestPaymentPage;