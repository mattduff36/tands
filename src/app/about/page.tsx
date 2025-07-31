import Image from "next/image";
import { MapPin, Truck, Award } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="bg-gradient-about py-6 pt-20 sm:py-12 sm:pt-24">
      <main className="container mx-auto px-2 sm:px-8">
        <div className="rounded-3xl border-4 border-green-300 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 p-2 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-16 h-[320px] flex items-center justify-center">
            <div className="absolute inset-0">
              <Image
                src="/IMG_2362.JPEG"
                alt="Fun bouncy castles"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/60 via-purple-500/60 to-blue-500/60" />
            </div>
            <div className="relative w-full flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg text-shadow-white mb-6">
                👥 About T&S Bouncy Castle Hire 🎪
              </h1>
              <p className="max-w-3xl mx-auto text-xl text-white font-bold bg-white/20 rounded-2xl p-4 backdrop-blur-sm border-2 border-white/30">
                🎉 Your local, friendly, and reliable source for unforgettable fun! 🎉
              </p>
            </div>
          </div>

          {/* Our Story Section */}
          <div className="py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-base font-bold leading-7 text-blue-600 bg-blue-100 rounded-full px-6 py-2 inline-block shadow-lg mb-4">
                  🌟 Our Journey 🌟
                </h2>
                <p className="mt-2 text-4xl font-bold tracking-tight bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
                  From a Simple Idea to a Thriving Business
                </p>
                <div className="mx-auto max-w-2xl text-lg leading-8 text-gray-700 bg-white/60 rounded-2xl p-6 shadow-lg border-2 border-yellow-300">
                  <p className="font-semibold">
                    T&S Bouncy Castle Hire started with a simple mission: to bring more joy and laughter to our community in Edwinstowe. As a family-run business, we pour our hearts into ensuring every event we cater to is a massive success. We believe in fair pricing, exceptional customer service, and above all, the safety of your loved ones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 py-8 sm:py-12 rounded-3xl border-4 border-orange-300 shadow-xl mt-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl text-center bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-6">
                    🚚 Delivery Information 📦
                  </h2>
                  <p className="text-lg text-gray-700 text-center font-semibold bg-white/60 rounded-2xl p-4 shadow-lg mb-6">
                    We are proud to serve Edwinstowe and the surrounding areas. Here's how our delivery works:
                  </p>
                  <dl className="mt-8 space-y-4">
                    <div className="flex items-start bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-blue-300 transform hover:scale-105 transition-all duration-300">
                      <div className="flex-shrink-0">
                        <MapPin className="h-8 w-8 text-blue-600 animate-bounce" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-bold text-gray-900">🏠 Based in Edwinstowe</dt>
                        <dd className="mt-1 text-base text-gray-600 font-medium">Our main location, serving the heart of the community.</dd>
                      </div>
                    </div>
                    <div className="flex items-start bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-green-300 transform hover:scale-105 transition-all duration-300">
                      <div className="flex-shrink-0">
                        <Truck className="h-8 w-8 text-green-500 animate-bounce" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-bold text-gray-900">🆓 Free Delivery (10-Mile Radius)</dt>
                        <dd className="mt-1 text-base text-gray-600 font-medium">We offer free delivery and setup for all locations within a 10-mile radius of Edwinstowe.</dd>
                      </div>
                    </div>
                    <div className="flex items-start bg-white/80 rounded-2xl p-6 shadow-lg border-2 border-yellow-300 transform hover:scale-105 transition-all duration-300">
                      <div className="flex-shrink-0">
                        <Truck className="h-8 w-8 text-yellow-500 animate-bounce" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-bold text-gray-900">💰 Extended Delivery (10-20 Miles)</dt>
                        <dd className="mt-1 text-base text-gray-600 font-medium">For locations between 10 and 20 miles away, we apply a small delivery charge of just £5.</dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 shadow-xl border-4 border-purple-300">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
                  🗺️ Our Service Area 📍
                </h3>
                <p className="text-lg text-gray-700 font-semibold">
                  We proudly serve Edwinstowe and the surrounding areas, including Mansfield, Ollerton, and Worksop. If you're unsure whether we cover your location, please don't hesitate to get in touch!
                </p>
              </div>
              <div className="relative h-80 w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-300">
                <div className="aspect-w-1 aspect-h-1 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 overflow-hidden">
                  <Image src="/service-area-map.png" alt="Map of delivery area" fill className="object-cover"/>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-center text-white font-bold text-lg">
                    🎯 Our 20-mile delivery radius from Edwinstowe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage; 