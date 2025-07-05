import { CastleCard } from "@/components/CastleCard";
import { castles } from "@/lib/castle-data";

export const CastleHighlights = () => {
  const highlightedCastles = castles.slice(0, 3); // Show first 3 castles

  return (
    <section className="container mx-auto my-12 rounded-xl border bg-white/30 p-8 shadow-lg backdrop-blur-sm">
      <h2 className="mb-8 text-center text-3xl font-bold">
        Our Most Popular Castles
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {highlightedCastles.map((castle) => (
          <CastleCard key={castle.id} castle={castle} />
        ))}
      </div>
    </section>
  );
}; 