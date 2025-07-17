import { Phone, Mail, Award, Smile, ShieldCheck } from "lucide-react";

const features = [
  {
    name: "Fun For All Ages",
    description: "Our bouncy castles are a guaranteed hit for kids and adults alike, providing hours of entertainment.",
    icon: Smile,
  },
  {
    name: "Safety First",
    description: "All our castles are PIPA tested and we are fully insured, so you can have peace of mind.",
    icon: ShieldCheck,
  },
  {
    name: "Excellent Service",
    description: "We pride ourselves on friendly, reliable service, from booking to setup and collection.",
    icon: Award,
  },
];

const Introduction = () => {
  return (
    <section className="container mx-auto my-12 rounded-3xl border-4 border-pink-300 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 p-8 shadow-2xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
      {/* Title spanning full width */}
      <div className="text-center mb-8">
        <h2 className="mb-4 text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent animate-pulse">
          🎉 Welcome to T&S Bouncy Castle Hire 🎉
        </h2>
        <p className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-gray-800 drop-shadow-lg">
          Making Your Events Unforgettable
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="text-lg leading-8 text-gray-700 bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-yellow-300">
              <p className="font-semibold">
                We are a family-run business based in Edwinstowe, dedicated to bringing joy and laughter to your parties and events with our top-quality, clean, and safe bouncy castles.
              </p>
            </div>
          </div>

          {/* Features in a more compact grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={feature.name} className={`flex flex-col items-center text-center transform hover:scale-110 transition-all duration-300 bg-white/80 rounded-2xl p-4 shadow-lg border-2 ${
                index === 0 ? 'border-pink-400' : index === 1 ? 'border-blue-400' : 'border-green-400'
              }`}>
                <dt className="flex flex-col items-center gap-2 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className={`h-8 w-8 ${
                    index === 0 ? 'text-pink-500' : index === 1 ? 'text-blue-500' : 'text-green-500'
                  } animate-bounce`} aria-hidden="true" />
                  <span className="text-lg">{feature.name}</span>
                </dt>
                <dd className="mt-3 flex flex-auto flex-col text-sm leading-6 text-gray-600">
                  <p className="flex-auto font-medium">{feature.description}</p>
                </dd>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section - Sidebar on large screens */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 rounded-3xl p-6 shadow-xl border-4 border-rainbow-300 mt-8 lg:mt-0">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-2 text-center">
              🎈 Ready to get bouncing? 🎈
            </h3>
            <p className="mt-3 text-lg text-gray-700 font-semibold text-center">
              Contact us today to book your castle!
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-white/80 rounded-2xl p-3 shadow-lg border-2 border-blue-300 hover:bg-blue-50 transition-all duration-300">
                <Phone className="h-6 w-6 text-blue-600 animate-pulse flex-shrink-0" />
                <a href="tel:07835094187" className="text-lg font-bold text-blue-600 hover:text-blue-800">
                  <span className="sr-only">Call us at 07835 094187</span>
                  07835 094187
                </a>
              </div>
              <a href="mailto:tsbouncycastlehire@gmail.com" className="flex items-center gap-3 text-xs sm:text-lg font-bold text-purple-600 hover:text-purple-800 bg-white/80 rounded-2xl p-3 shadow-lg border-2 border-purple-300 hover:bg-purple-50 transition-all duration-300 overflow-x-auto">
                <Mail className="h-6 w-6 animate-pulse flex-shrink-0" />
                <span className="break-all max-w-full">tsbouncycastlehire@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction; 