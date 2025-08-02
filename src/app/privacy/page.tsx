import { Shield, Eye, Lock, FileText } from "lucide-react";

const PrivacyPage = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-6 pt-20 sm:py-12 sm:pt-24 min-h-screen">
      <main className="container mx-auto px-2 sm:px-8">
        <div className="rounded-3xl border-4 border-blue-300 bg-white/80 p-2 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
              🛡️ Privacy Policy
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-blue-300">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </p>
          </div>

          {/* Last Updated */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-center">
            <p className="text-sm text-blue-700 font-medium">
              Last updated: January 2025
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className="space-y-8">
            {/* Information We Collect */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-300">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>We collect the following types of personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Contact Information:</strong> Name, email address, phone number, and address for booking purposes</li>
                  <li><strong>Booking Details:</strong> Event date, castle selection, payment preferences, and special requirements</li>
                  <li><strong>Website Usage:</strong> Information about how you use our website (cookies and analytics)</li>
                  <li><strong>Communication Records:</strong> Emails, phone calls, and messages exchanged with us</li>
                </ul>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-300">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>We use your personal information for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>To process and confirm your bouncy castle bookings</li>
                  <li>To communicate with you about your booking, delivery, and collection</li>
                  <li>To provide customer support and respond to your inquiries</li>
                  <li>To send you important safety information and hire agreements</li>
                  <li>To process payments and manage financial transactions</li>
                  <li>To improve our services and website functionality</li>
                  <li>To comply with legal obligations and insurance requirements</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-300">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> With trusted partners who help us deliver our services (delivery drivers, payment processors)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                  <li><strong>Insurance Purposes:</strong> With our insurance provider when necessary for claims or coverage</li>
                  <li><strong>Safety Emergencies:</strong> In emergency situations where safety information is required</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-300">
              <div className="flex items-center mb-4">
                <Lock className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>We implement appropriate security measures to protect your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Secure website hosting with SSL encryption</li>
                  <li>Limited access to personal information on a need-to-know basis</li>
                  <li>Regular security updates and monitoring</li>
                  <li>Secure storage of physical and digital records</li>
                  <li>Staff training on data protection and privacy</li>
                </ul>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                </ul>
              </div>
            </div>

            {/* Cookies */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Website Analytics</h2>
              <div className="space-y-4 text-gray-700">
                <p>Our website uses cookies and analytics to improve your experience:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for website functionality and booking forms</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Third-party Services:</strong> We use Google Analytics for website performance monitoring and Vercel for hosting analytics</li>
                </ul>
                <p className="mt-4 text-sm">
                  You can control cookie settings through your browser preferences. Disabling cookies may affect website functionality.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p>We retain your personal information for as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide our services and fulfill bookings</li>
                  <li>Comply with legal and insurance requirements</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Improve our services and customer experience</li>
                </ul>
                <p className="mt-4">
                  Booking records are typically retained for 7 years for legal and insurance purposes. 
                  Marketing communications can be unsubscribed from at any time.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 shadow-lg border-2 border-blue-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you have any questions about this privacy policy or how we handle your personal information, please contact us:</p>
                <div className="bg-white rounded-xl p-4 space-y-2">
                  <p><strong>Email:</strong> info@bouncy-castle-hire.com</p>
                  <p><strong>Phone:</strong> 07835 094187</p>
                  <p><strong>Address:</strong> Edwinstowe, UK</p>
                </div>
                <p className="text-sm">
                  We will respond to your privacy-related inquiries within 30 days.
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
                  We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date.
                </p>
                <p>
                  We encourage you to review this policy periodically to stay informed about how we protect your information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage; 