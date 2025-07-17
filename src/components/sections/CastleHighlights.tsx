import CastleCard from "@/components/sections/CastleCard";
import { castles } from "@/lib/castle-data";

export const CastleHighlights = () => {
  const highlightedCastles = castles.slice(0, 3); // Show first 3 castles

  return (
    <section className="container mx-auto my-12 rounded-3xl border-4 border-purple-300 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 p-8 shadow-2xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
      <h2 className="mb-8 text-center text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
        🏰 Our Most Popular Castles 🏰
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {highlightedCastles.map((castle) => (
          <CastleCard key={castle.id} castle={castle} />
        ))}
      </div>
    </section>
  );
}; 