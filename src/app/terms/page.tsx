import { FileText, AlertTriangle, CheckCircle, Shield } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 py-6 pt-20 sm:py-12 sm:pt-24 min-h-screen">
      <main className="container mx-auto px-2 sm:px-8">
        <div className="rounded-3xl border-4 border-green-300 bg-white/80 p-2 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
              📋 Terms and Conditions
            </h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-green-300">
              Please read these terms and conditions carefully before using our services or website.
            </p>
          </div>

          {/* Last Updated */}
          <div className="bg-green-50 rounded-2xl p-4 mb-8 text-center">
            <p className="text-sm text-green-700 font-medium">
              Last updated: January 2025
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-300">
              <div className="flex items-center mb-4">
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  These terms and conditions ("Terms") govern your use of the T&S Bouncy Castle Hire website and services. 
                  By accessing our website or using our services, you agree to be bound by these Terms.
                </p>
                <p>
                  <strong>Company Information:</strong> T&S Bouncy Castle Hire is a family-run business based in Edwinstowe, UK, 
                  providing bouncy castle hire services for parties and events.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Services</h2>
              <div className="space-y-4 text-gray-700">
                <p>We provide the following services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Bouncy castle hire for parties, events, and celebrations</li>
                  <li>Delivery and setup within a 20-mile radius of Edwinstowe</li>
                  <li>Collection and dismantling services</li>
                  <li>Safety instructions and supervision guidance</li>
                  <li>PIPA tested and insured equipment</li>
                </ul>
                <p className="mt-4">
                  <strong>Service Area:</strong> We serve Edwinstowe and surrounding areas including Mansfield, Ollerton, and Worksop. 
                  Free delivery within 10 miles, £5 charge for 10-20 mile radius.
                </p>
              </div>
            </div>

            {/* Booking and Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking and Payment Terms</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Booking Process</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Bookings can be made online, by phone, or email</li>
                    <li>A non-refundable deposit of 25% is required to secure your booking</li>
                    <li>Full payment is due on the day of hire</li>
                    <li>We accept cash on delivery and bank transfer</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Cancellations more than 7 days before hire: full refund of balance (deposit retained)</li>
                    <li>Cancellations less than 7 days before: no refund, full balance still due</li>
                    <li>Weather-related cancellations will be rescheduled where possible</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Safety and Usage */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-300">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Safety and Usage Rules</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>All users must follow these safety rules:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>No shoes, glasses, jewellery, badges, food, drink, gum, pets, toys or sharp objects on or near equipment</li>
                  <li>No somersaults, climbing, hanging on walls, or bouncing on the front step</li>
                  <li>A responsible adult (17+) must supervise at all times</li>
                  <li>Children and adults should not use simultaneously except for assistance</li>
                  <li>Stop use if surface becomes wet or in rain; evacuate immediately if blower fails</li>
                  <li>No use by persons under the influence of alcohol, drugs, or with medical conditions aggravated by physical activity</li>
                  <li>Equipment must be secured to the ground per manufacturer's instructions on a level, debris-free surface</li>
                </ul>
              </div>
            </div>

            {/* Liability and Insurance */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-300">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Liability and Insurance</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All users do so at their own risk</li>
                  <li>We hold public liability insurance up to £1 million (certificate available on request)</li>
                  <li>We are not liable for indirect, special or consequential losses</li>
                  <li>The hirer is responsible for all loss, damage or injury resulting from misuse or negligent use</li>
                  <li>The hirer agrees to cover any repair or replacement costs for damage</li>
                  <li>All equipment is PIPA tested and meets UK safety standards (BS EN 14960)</li>
                </ul>
              </div>
            </div>

            {/* Website Usage */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Usage</h2>
              <div className="space-y-4 text-gray-700">
                <p>By using our website, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the website for lawful purposes only</li>
                  <li>Not attempt to gain unauthorized access to our systems</li>
                  <li>Not interfere with the website's functionality</li>
                  <li>Provide accurate information when making bookings</li>
                  <li>Respect our intellectual property rights</li>
                </ul>
                <p className="mt-4">
                  <strong>Website Developer:</strong> This website was developed by mpdee.co.uk. 
                  All website-related issues should be reported to us first.
                </p>
              </div>
            </div>

            {/* Privacy and Data */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy and Data Protection</h2>
              <div className="space-y-4 text-gray-700">
                <p>Your privacy is important to us. Please refer to our Privacy Policy for detailed information about:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>How we collect and use your personal information</li>
                  <li>Your rights regarding your data</li>
                  <li>Our data security measures</li>
                  <li>How to contact us about privacy concerns</li>
                </ul>
                <p className="mt-4">
                  By using our services, you consent to our collection and use of your information as described in our Privacy Policy.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>All content on this website, including but not limited to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Text, images, and graphics</li>
                  <li>Logo and branding materials</li>
                  <li>Website design and layout</li>
                  <li>Photographs of our bouncy castles</li>
                </ul>
                <p className="mt-4">
                  Is the property of T&S Bouncy Castle Hire or our licensors and is protected by copyright laws. 
                  You may not reproduce, distribute, or create derivative works without our written permission.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <p>To the maximum extent permitted by law:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Our total liability for any claim shall not exceed the amount paid for the hire service</li>
                  <li>We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>We are not liable for any loss or damage caused by events beyond our reasonable control</li>
                  <li>Our liability is limited to the terms of our insurance coverage</li>
                </ul>
              </div>
            </div>

            {/* Governing Law */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  These terms and conditions are governed by and construed in accordance with the laws of England and Wales. 
                  Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts of England and Wales.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 shadow-lg border-2 border-green-300">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>If you have any questions about these terms and conditions, please contact us:</p>
                <div className="bg-white rounded-xl p-4 space-y-2">
                  <p><strong>Email:</strong> info@bouncy-castle-hire.com</p>
                  <p><strong>Phone:</strong> 07835 094187</p>
                  <p><strong>Address:</strong> Edwinstowe, UK</p>
                </div>
                <p className="text-sm">
                  We will respond to your inquiries within 24 hours during business days.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to These Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to modify these terms and conditions at any time. Changes will be effective immediately upon posting on our website. 
                  Your continued use of our services after any changes constitutes acceptance of the new terms.
                </p>
                <p>
                  We encourage you to review these terms periodically to stay informed about our current policies and practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage; 