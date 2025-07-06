import Image from "next/image";
import { MapPin, Truck, Award } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="bg-gradient-about py-12">
      <main className="container mx-auto">
        <div className="rounded-xl border bg-white/30 p-8 shadow-lg backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              About T&S Bouncy Castle Hire
            </h1>
          </div>
          {/* Hero Section */}
          <div className="relative">
            <div className="absolute inset-0">
              <Image
                src="/bouncy-castle-3.jpg" // Using a placeholder image
                alt="Fun bouncy castles"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-blue-500 mix-blend-multiply" />
            </div>
            <div className="relative container mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">About T&S Bouncy Castle Hire</h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100">
                Your local, friendly, and reliable source for unforgettable fun.
              </p>
            </div>
          </div>

          {/* Our Story Section */}
          <div className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-base font-semibold leading-7 text-blue-600">Our Journey</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From a Simple Idea to a Thriving Business</p>
                <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-600">
                  T&S Bouncy Castle Hire started with a simple mission: to bring more joy and laughter to our community in Edwinstowe. As a family-run business, we pour our hearts into ensuring every event we cater to is a massive success. We believe in fair pricing, exceptional customer service, and above all, the safety of your loved ones.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information Section */}
          <div className="bg-gray-50 py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Delivery Information</h2>
                  <p className="mt-4 text-lg text-gray-600">We are proud to serve Edwinstowe and the surrounding areas. Here's how our delivery works:</p>
                  <dl className="mt-8 space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-medium text-gray-900">Based in Edwinstowe</dt>
                        <dd className="mt-1 text-base text-gray-600">Our main location, serving the heart of the community.</dd>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Truck className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-medium text-gray-900">Free Delivery (10-Mile Radius)</dt>
                        <dd className="mt-1 text-base text-gray-600">We offer free delivery and setup for all locations within a 10-mile radius of Edwinstowe.</dd>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Truck className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <dt className="text-lg font-medium text-gray-900">Extended Delivery (10-20 Miles)</dt>
                        <dd className="mt-1 text-base text-gray-600">For locations between 10 and 20 miles away, we apply a small delivery charge of just £5.</dd>
                      </div>
                    </div>
                  </dl>
                </div>
                <div className="mt-10 md:mt-0">
                  {/* Placeholder for a map or an image of the delivery area */}
                  <div className="aspect-w-1 aspect-h-1 rounded-lg bg-gray-200 overflow-hidden">
                     <Image src="/placeholders/map-placeholder.png" alt="Map of delivery area" fill className="object-cover"/>
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-500">Our 20-mile delivery radius from Edwinstowe.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Our Service Area</h3>
                <p className="mt-4 text-lg text-gray-600">
                  We proudly serve Edwinstowe and the surrounding areas, including Mansfield, Ollerton, and Worksop. If you're unsure whether we cover your location, please don't hesitate to get in touch!
                </p>
              </div>
              <div className="relative h-80 w-full rounded-lg shadow-md overflow-hidden">
                {/* The map placeholder was here and has been removed */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage; 