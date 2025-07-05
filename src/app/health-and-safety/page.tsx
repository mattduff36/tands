import Image from "next/image";
import { ShieldCheck, FileText, Umbrella } from "lucide-react";

const safetyFeatures = [
  {
    name: "PIPA Tested & Compliant",
    description:
      "Every single one of our bouncy castles has undergone rigorous PIPA testing to meet and exceed UK safety standards (BS EN 14960). You can hire from us with the confidence that you're getting a certified-safe inflatable.",
    icon: ShieldCheck,
  },
  {
    name: "Public Liability Insurance",
    description:
      "We are fully insured with Public Liability insurance, covering any eventualities. We can provide a copy of our insurance certificate upon request for your peace of mind.",
    icon: Umbrella,
  },
  {
    name: "Safety Instructions Provided",
    description:
      "Upon delivery and setup, our team will walk you through all the necessary safety instructions and guidelines for use. We also provide a printed copy of the rules for your reference during the hire period.",
    icon: FileText,
  },
];

const HealthAndSafetyPage = () => {
  return (
    <div className="bg-white">
      <main>
        {/* Hero Section */}
        <div className="relative bg-gray-900">
          <div className="absolute inset-0">
            <Image
              src="/bouncy-castle-4.jpg" // Using a placeholder image
              alt="Safe and fun bouncy castles"
              fill
              className="object-cover opacity-50"
            />
          </div>
          <div className="relative container mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Safety is Our Priority
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-300">
              We are committed to providing a fun and safe experience for everyone.
            </p>
          </div>
        </div>

        {/* Core Safety Information */}
        <div className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-600">Our Commitment</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How We Ensure a Safe Bouncing Environment
              </p>
            </div>
            <div className="mt-16">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                {safetyFeatures.map((feature) => (
                  <div key={feature.name} className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* PIPA Statement */}
        <div className="bg-blue-50">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="rounded-md bg-blue-100 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ShieldCheck className="h-5 w-5 text-blue-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">A Note on PIPA Testing</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>The PIPA scheme is the only inflatable testing scheme supported by the HSE (Health and Safety Executive). A PIPA tag on our bouncy castles means it has been tested against the European standard BS EN 14960 and is certified as safe to use. Never hire an inflatable that does not have a valid PIPA test.</p>
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

export default HealthAndSafetyPage; 