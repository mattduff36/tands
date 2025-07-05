import { Castle } from "@/lib/castle-data";
import Image from "next/image";

export const CastleCard = ({ castle }: { castle: Castle }) => {
  return (
    <div
      key={castle.id}
      className="group relative overflow-hidden rounded-lg border bg-white/50 text-card-foreground shadow-sm transition-transform duration-300 ease-in-out hover:scale-105"
    >
      <div className="aspect-video w-full overflow-hidden">
        <Image
          src={castle.imageUrl}
          alt={castle.name}
          width={500}
          height={300}
        />
      </div>
      {/* ... existing code ... */}
    </div>
  );
};
