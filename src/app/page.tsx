import { Metadata } from 'next';
import Hero from "@/components/sections/Hero";
import Introduction from "@/components/sections/Introduction";
import { CastleHighlights } from "@/components/sections/CastleHighlights";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: "T&S Bouncy Castle Hire | Professional Party Equipment Rental Edwinstowe",
  description: "T&S Bouncy Castle Hire provides premium bouncy castle rentals in Edwinstowe, Mansfield, and Nottinghamshire. Fully insured, professionally cleaned, and delivered to your door. Book today!",
  keywords: "bouncy castle hire Edwinstowe, party equipment rental Nottinghamshire, children's birthday parties, inflatable hire Mansfield, safe bouncy castles, insured castle hire",
  openGraph: {
    title: "T&S Bouncy Castle Hire | Professional Party Equipment Rental Edwinstowe",
    description: "Premium bouncy castle rentals in Edwinstowe and Nottinghamshire. Fully insured, professionally cleaned, and delivered to your door.",
    url: "https://www.bouncy-castle-hire.com",
    images: [
      {
        url: "/IMG_2360.JPEG",
        width: 1200,
        height: 630,
        alt: "Colorful bouncy castle from T&S Bouncy Castle Hire",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <div className="bg-gradient-home pb-12">
        <main>
          <Hero />
          <AnimatedSection>
            <Introduction />
          </AnimatedSection>
          <AnimatedSection>
            <CastleHighlights />
          </AnimatedSection>
          
          {/* SEO Content Section */}
          <AnimatedSection>
            <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                      Professional Bouncy Castle Hire in Edwinstowe & Nottinghamshire
                    </h2>
                    <p className="text-xl text-gray-600">
                      Serving local communities with safe, clean, and exciting bouncy castles since 2024
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Service Areas</h3>
                      <ul className="text-gray-700 space-y-2">
                        <li>• <strong>Edwinstowe</strong> - Our home base with free delivery</li>
                        <li>• <strong>Mansfield</strong> - Full service area coverage</li>
                        <li>• <strong>Newark</strong> - Reliable delivery and setup</li>
                        <li>• <strong>Worksop</strong> - Professional party equipment</li>
                        <li>• <strong>Ollerton</strong> - Local community specialist</li>
                        <li>• <strong>Nottingham</strong> - City-wide service</li>
                        <li>• <strong>Bilsthorpe</strong> - Village coverage</li>
                        <li>• <strong>Nottinghamshire</strong> - Wide coverage area</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Why Choose T&S?</h3>
                      <ul className="text-gray-700 space-y-2">
                        <li>• <strong>Fully Insured</strong> - Complete peace of mind</li>
                        <li>• <strong>Professional Cleaning</strong> - Sanitized after every use</li>
                        <li>• <strong>Safety Inspected</strong> - Regular safety checks</li>
                        <li>• <strong>Reliable Delivery</strong> - On-time setup and collection</li>
                        <li>• <strong>Competitive Prices</strong> - Best value in the area</li>
                        <li>• <strong>Local Business</strong> - Supporting the community</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Perfect for Every Occasion
                    </h3>
                    <p className="text-gray-700 mb-6 text-lg">
                      Our bouncy castles are ideal for <strong>children's birthday parties</strong>, <strong>school events</strong>, <strong>family gatherings</strong>, <strong>community festivals</strong>, and <strong>corporate fun days</strong> throughout Nottinghamshire.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a 
                        href="/castles" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                      >
                        🏰 View Our Castles
                      </a>
                      <a 
                        href="/booking" 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                      >
                        📅 Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>
        </main>
      </div>
    </>
  );
}
