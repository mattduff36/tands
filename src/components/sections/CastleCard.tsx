"use client";

import Image from "next/image";
import Link from "next/link";
import type { Castle } from "@/lib/database/castles";
import { Button } from "@/components/ui/button";
import { Tag, Star } from "lucide-react";
import { MotionDiv } from "@/components/motion/MotionDiv";

interface CastleCardProps {
  castle: Castle;
}

const CastleCard = ({ castle }: CastleCardProps) => {
  return (
    <MotionDiv
      className="group relative flex flex-col overflow-hidden rounded-3xl border-4 border-pink-300 bg-gradient-to-br from-white via-pink-50 to-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300"
      whileHover={{ y: -12, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="aspect-h-3 aspect-w-4 bg-gradient-to-br from-pink-200 to-purple-200 sm:aspect-none group-hover:opacity-90 sm:h-60 relative overflow-hidden rounded-t-2xl">
        <Image
          src={castle.imageUrl}
          alt={`Image of ${castle.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover object-center sm:h-full sm:w-full transform group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="flex flex-1 flex-col space-y-3 p-6">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
          <Link href={`/booking?castle=${castle.id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            🎪 {castle.name}
          </Link>
        </h3>
        <p className="text-sm text-gray-600 font-medium bg-white/60 rounded-2xl p-3 shadow-sm">{castle.description}</p>
        <div className="flex flex-1 flex-col justify-end">
          <div className="flex items-center text-sm text-gray-600 mb-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-3 shadow-sm">
            <Tag className="h-4 w-4 mr-1 text-pink-500"/>
            <span className="font-semibold">{castle.theme}</span>
            <span className="mx-2 text-pink-400">|</span>
            <Star className="h-4 w-4 mr-1 text-yellow-500"/>
            <span className="font-semibold">{castle.size}</span>
          </div>
          <div className="text-center mb-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-4 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 mb-1">💰 £{castle.price}</p>
            <p className="text-sm text-gray-600 font-medium">per day hire</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg rounded-full shadow-lg border-2 border-white/30 transform hover:scale-105 transition-all duration-300">
            <Link href={`/booking?castle=${castle.id}`} className="w-full">
              🎉 Book Now
            </Link>
          </Button>
        </div>
      </div>
    </MotionDiv>
  );
};

export default CastleCard; 