import { Metadata } from 'next';
import CastleCard from "@/components/sections/CastleCard";
import { BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import { getCastles } from '@/lib/database/castles';
import { castles as staticCastles } from '@/lib/castle-data';

export const metadata: Metadata = {
  title: "Our Bouncy Castle Fleet | T&S Bouncy Castle Hire Edwinstowe",
  description: "Browse our selection of fun, safe, and clean bouncy castles available for hire in Edwinstowe and surrounding areas. Find the perfect bouncy castle for your next party or event.",
  keywords: "bouncy castle fleet, castle selection, party rentals Edwinstowe, inflatable hire, children's party equipment",
  openGraph: {
    title: "Our Bouncy Castle Fleet | T&S Bouncy Castle Hire",
    description: "Browse our selection of fun, safe, and clean bouncy castles available for hire in Edwinstowe and surrounding areas.",
    url: "https://www.bouncy-castle-hire.com/castles",
    images: [
      {
        url: "/IMG_2360.JPEG",
        width: 1200,
        height: 630,
        alt: "T&S Bouncy Castle Fleet",
      },
    ],
  },
};

async function getCastlesData() {
  try {
    // Try database first, fallback to static data if DB is unavailable
    let castles;
    try {
      castles = await getCastles();
    } catch (dbError) {
      console.warn('Database unavailable, using static castle data:', dbError);
      castles = staticCastles;
    }
    return castles;
  } catch (error) {
    console.error('Error fetching castles:', error);
    return staticCastles; // Fallback to static data
  }
}

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

const CastlesPage = async () => {
  const castles = await getCastlesData();
  
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.bouncy-castle-hire.com' },
    { name: 'Our Bouncy Castles', url: 'https://www.bouncy-castle-hire.com/castles' }
  ];

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <div className="bg-gradient-castles py-6 pt-20 sm:py-12 sm:pt-24">
        <main className="container mx-auto px-2 sm:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Home
                </a>
              </li>
              <li className="text-gray-500">/</li>
              <li className="text-gray-900 font-medium" aria-current="page">
                Our Bouncy Castles
              </li>
            </ol>
          </nav>

          <div className="rounded-3xl border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-2 sm:p-8 shadow-2xl backdrop-blur-sm">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
                🏰 Our Bouncy Castle Fleet 🎪
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-pink-300 mb-8">
                🎉 Browse our selection of fun, safe, and clean bouncy castles. Find the perfect one for your next event in Edwinstowe and surrounding areas! 🎉
              </p>
            </div>

            {/* Castle Grid */}
            <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                {castles.length > 0 ? (
                  castles.map((castle: Castle) => (
                    <CastleCard key={castle.id} castle={castle} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-xl text-gray-600">
                      Our bouncy castle fleet is currently being updated. Please contact us for availability.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Content Section - Moved after castles */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="max-w-4xl mx-auto text-left bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-blue-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Premium Bouncy Castle Hire in Edwinstowe</h2>
                <p className="text-gray-700 mb-4">
                  At T&S Bouncy Castle Hire, we provide a wide range of high-quality, fully insured bouncy castles 
                  perfect for children's birthday parties, family gatherings, school events, and corporate functions 
                  throughout Edwinstowe, Mansfield, Newark, Worksop, Ollerton, Nottingham, Bilsthorpe, and the wider Nottinghamshire area.
                </p>
                <p className="text-gray-700">
                  All our bouncy castles are professionally cleaned and safety inspected before each hire. 
                  We offer competitive prices, reliable delivery, and setup services to make your event unforgettable.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CastlesPage;