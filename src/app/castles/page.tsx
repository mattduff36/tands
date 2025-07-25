'use client';

import { useEffect, useState } from 'react';
import CastleCard from "@/components/sections/CastleCard";

interface Castle {
  id: number;
  name: string;
  theme: string;
  size: string;
  price: number;
  description: string;
  imageUrl: string;
}

const CastlesPage = () => {
  const [castles, setCastles] = useState<Castle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCastles = async () => {
      try {
        const response = await fetch('/api/castles');
        if (response.ok) {
          const data = await response.json();
          setCastles(data);
        } else {
          console.error('Failed to fetch castles');
        }
      } catch (error) {
        console.error('Error fetching castles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCastles();
  }, []);

  return (
    <div className="bg-gradient-castles py-6 pt-20 sm:py-12 sm:pt-24">
      <main className="container mx-auto px-2 sm:px-8">
        <div className="rounded-3xl border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-2 sm:p-8 shadow-2xl backdrop-blur-sm">
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
            {isLoading ? (
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-60 bg-gray-200 rounded-3xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {castles.map((castle) => (
                  <CastleCard key={castle.id} castle={castle} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CastlesPage;