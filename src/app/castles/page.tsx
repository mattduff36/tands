import CastleCard from "@/components/sections/CastleCard";
import { castles } from "@/lib/castle-data";

const CastlesPage = () => {
  return (
    <div className="bg-gradient-castles py-12 pt-24">
      <main className="container mx-auto">
        <div className="rounded-3xl border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent sm:text-5xl animate-pulse mb-6">
              🏰 Our Bouncy Castle Fleet 🎪
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-700 font-semibold bg-white/60 rounded-2xl p-4 shadow-lg border-2 border-pink-300">
              🎉 Browse our selection of fun, safe, and clean bouncy castles. Find the perfect one for your next event! 🎉
            </p>
          </div>

          {/* Castle Grid */}
          <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
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