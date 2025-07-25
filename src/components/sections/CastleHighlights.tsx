'use client';

import { useEffect, useState } from 'react';
import CastleCard from "@/components/sections/CastleCard";
import type { Castle } from "@/lib/database/castles";

export const CastleHighlights = () => {
  const [highlightedCastles, setHighlightedCastles] = useState<Castle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCastles = async () => {
      try {
        const response = await fetch('/api/castles');
        if (response.ok) {
          const castles = await response.json();
          setHighlightedCastles(castles.slice(0, 3)); // Show first 3 castles
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
    <section className="container mx-auto my-12 rounded-3xl border-4 border-purple-300 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100 p-8 shadow-2xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
      <h2 className="mb-8 text-center text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
        🏰 Our Most Popular Castles 🏰
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-60 bg-gray-200 rounded-3xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          highlightedCastles.map((castle) => (
            <CastleCard key={castle.id} castle={castle} />
          ))
        )}
      </div>
    </section>
  );
};