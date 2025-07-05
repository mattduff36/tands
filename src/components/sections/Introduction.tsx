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
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Welcome to T&S Bouncy Castle Hire</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Making Your Events Unforgettable
          </p>
          <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-600">
            We are a family-run business based in Edwinstowe, dedicated to bringing joy and laughter to your parties and events with our top-quality, clean, and safe bouncy castles.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-8 w-8 text-blue-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Ready to get bouncing?
            </h3>
            <p className="mt-4 text-lg text-gray-600">
                Contact us today to book your castle!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="tel:07935094187" className="flex items-center gap-2 text-lg font-medium text-blue-600 hover:text-blue-800">
                    <Phone className="h-5 w-5" />
                    07935094187
                </a>
                <a href="mailto:tsbouncycastlehire@gmail.com" className="flex items-center gap-2 text-lg font-medium text-blue-600 hover:text-blue-800">
                    <Mail className="h-5 w-5" />
                    tsbouncycastlehire@gmail.com
                </a>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Introduction; 