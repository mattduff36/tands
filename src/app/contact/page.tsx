import { ContactForm } from "@/components/sections/ContactForm";
import { Phone, Mail, MapPin, Facebook } from "lucide-react";

const ContactPage = () => {
    return (
        <div className="bg-gradient-contact py-12">
            <main className="container mx-auto">
                <div className="rounded-xl border bg-white/30 p-8 shadow-lg backdrop-blur-sm">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                            Get In Touch
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                            We're here to help you plan the perfect event. Reach out to us with any questions or to book your bouncy castle today!
                        </p>
                    </div>

                    {/* Contact Section */}
                    <div className="container mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Contact Form */}
                            <div className="bg-gray-50 p-8 rounded-lg">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                                <ContactForm />
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                                    <p className="mt-2 text-lg text-gray-600">
                                        You can reach us through any of the following methods. We look forward to hearing from you!
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Phone className="h-6 w-6 text-blue-600 mt-1" />
                                        <div>
                                            <h3 className="text-lg font-semibold">Phone</h3>
                                            <a href="tel:07835094187" className="text-base text-gray-600 hover:text-blue-600">
                                                07835 094187
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Mail className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Email</h3>
                                            <a href="mailto:tsbouncycastlehire@gmail.com" className="text-base text-gray-600 hover:text-blue-600">
                                                tsbouncycastlehire@gmail.com
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <MapPin className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Location</h3>
                                            <p className="text-base text-gray-600">
                                                Based in Edwinstowe, UK
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Serving a 20-mile radius.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Facebook className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">Facebook</h3>
                                            <a href="#" className="text-base text-gray-600 hover:text-blue-600" target="_blank" rel="noopener noreferrer">
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