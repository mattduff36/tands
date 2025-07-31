import Image from "next/image";
import { ShieldCheck, FileText, Umbrella } from "lucide-react";
import { safetyPoints } from "@/lib/safety-data";

const safetyFeatures = [
  {
    name: "PIPA Tested & Compliant",
    description:
      "Every single one of our bouncy castles has undergone rigorous PIPA testing to meet and exceed UK safety standards (BS EN 14960). You can hire from us with the confidence that you're getting a certified-safe inflatable.",
    icon: ShieldCheck,
    color: "border-blue-400 bg-blue-100",
  },
  {
    name: "Public Liability Insurance",
    description:
      "We are fully insured with Public Liability insurance, covering any eventualities. We can provide a copy of our insurance certificate upon request for your peace of mind.",
    icon: Umbrella,
    color: "border-green-400 bg-green-100",
  },
  {
    name: "Safety Instructions Provided",
    description:
      "Upon delivery and setup, our team will walk you through all the necessary safety instructions and guidelines for use. We also provide a printed copy of the rules for your reference during the hire period.",
    icon: FileText,
    color: "border-purple-400 bg-purple-100",
  },
];

const HealthAndSafetyPage = () => {
  return (
    <div className="bg-gradient-health py-6 pt-20 min-h-screen sm:py-12 sm:pt-24">
      <main className="container mx-auto px-2 sm:px-8">
        <div className="rounded-3xl border-4 border-blue-300 bg-white/40 p-2 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-16 h-[320px] flex items-center justify-center">
            <div className="absolute inset-0">
              <Image
                src="/IMG_2360.JPEG"
                alt="Safe and fun bouncy castles"
                fill
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/60 via-green-400/60 to-purple-400/60" />
            </div>
            <div className="relative w-full flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg mb-6">
                🛡️ Health & Safety First!
              </h1>
              <p className="max-w-3xl mx-auto text-xl text-white font-bold bg-white/20 rounded-2xl p-4 backdrop-blur-sm border-2 border-white/30">
                We are committed to providing a fun and safe experience for everyone.
              </p>
            </div>
          </div>

          {/* Core Safety Information */}
          <div className="py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-base font-semibold leading-7 text-blue-600">Our Commitment</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-green-400 to-purple-400 bg-clip-text text-transparent sm:text-4xl mb-6">
                  How We Ensure a Safe Bouncing Environment
                </p>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {safetyFeatures.map((feature) => (
                  <div
                    key={feature.name}
                    className={`rounded-2xl border-4 ${feature.color} p-6 shadow-xl transition-transform transform hover:scale-105 bg-white/80`}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <feature.icon className="h-10 w-10 text-blue-500" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{feature.name}</h3>
                    <p className="text-base text-gray-700 text-center">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PIPA Statement */}
          <div className="bg-blue-50 rounded-2xl mt-12">
            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl bg-blue-100 p-4 flex items-center">
                <ShieldCheck className="h-8 w-8 text-blue-500 mr-4" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-bold text-blue-800">A Note on PIPA Testing</h3>
                  <p className="mt-2 text-base text-blue-700">
                    The PIPA scheme is the only inflatable testing scheme supported by the HSE (Health and Safety Executive). A PIPA tag on our bouncy castles means it has been tested against the European standard BS EN 14960 and is certified as safe to use. Never hire an inflatable that does not have a valid PIPA test.
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

export default HealthAndSafetyPage;