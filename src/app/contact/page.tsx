import { ContactForm } from "@/components/sections/ContactForm";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";

const ContactPage = () => {
    return (
        <div className="bg-gradient-contact py-6 pt-20 sm:py-12 sm:pt-24">
            <main className="container mx-auto px-2 sm:px-8">
                <div className="rounded-3xl border-4 border-blue-300 bg-gradient-to-br from-blue-100 via-green-100 to-purple-100 p-2 sm:p-8 shadow-2xl backdrop-blur-sm">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
                            📧 Get In Touch 📞
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-green-300">
                            🎉 We're here to help you plan the perfect event. Reach out to us with any questions or to book your bouncy castle today! 🎉
                        </p>
                    </div>

                    {/* Contact Section */}
                    <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Contact Form */}
                            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-8 rounded-3xl border-4 border-pink-300 shadow-xl flex flex-col min-h-[400px] h-full">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-6">
                                    ✉️ Send us a message
                                </h2>
                                <ContactForm />
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-3xl border-4 border-yellow-300 shadow-xl">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                        📋 Contact Information
                                    </h2>
                                    <p className="mt-2 text-lg text-gray-700 font-semibold">
                                        You can reach us through any of the following methods. We look forward to hearing from you!
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-blue-300 transform hover:scale-105 transition-all duration-300">
                                        <Phone className="h-8 w-8 text-blue-600 mt-1 animate-pulse" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                📞 Phone
                                            </h3>
                                            <a href="tel:07835094187" className="text-lg text-gray-700 hover:text-blue-600 font-semibold transition-colors duration-300">
                                                07835 094187
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-purple-300 transform hover:scale-105 transition-all duration-300">
                                        <Mail className="h-8 w-8 text-purple-600 animate-pulse" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                📧 Email
                                            </h3>
                                            <a href="mailto:info@bouncy-castle-hire.com" className="text-lg text-gray-700 hover:text-purple-600 font-semibold transition-colors duration-300 break-words">
                                                info@bouncy-castle-hire.com
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-green-300 transform hover:scale-105 transition-all duration-300">
                                        <MapPin className="h-8 w-8 text-green-600 animate-pulse" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                📍 Location
                                            </h3>
                                            <p className="text-lg text-gray-700 font-semibold">
                                                🏠 Based in Edwinstowe, UK
                                            </p>
                                            <p className="text-sm text-gray-600 font-medium bg-green-100 rounded-full px-3 py-1 mt-2 inline-block">
                                                🎯 Serving a 20-mile radius
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-indigo-300 transform hover:scale-105 transition-all duration-300">
                                        <Facebook className="h-8 w-8 text-indigo-600 animate-pulse" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                👥 Facebook
                                            </h3>
                                            <a href="https://www.facebook.com/profile.php?id=61577881314560" className="text-lg text-gray-700 hover:text-indigo-600 font-semibold transition-colors duration-300" target="_blank" rel="noopener noreferrer">
                                                Follow us on Facebook
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactPage; 