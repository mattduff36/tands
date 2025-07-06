import CastleCard from "@/components/sections/CastleCard";
import { castles } from "@/lib/castle-data";

const CastlesPage = () => {
  return (
    <div className="bg-gradient-castles py-12">
      <main className="container mx-auto">
        <div className="rounded-xl border bg-white/30 p-8 shadow-lg backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Our Bouncy Castle Fleet
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              Browse our selection of fun, safe, and clean bouncy castles. Find the perfect one for your next event!
            </p>
          </div>

          {/* Castle Grid */}
          <div className="container mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
              {castles.map((castle) => (
                <CastleCard key={castle.id} castle={castle} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CastlesPage; 