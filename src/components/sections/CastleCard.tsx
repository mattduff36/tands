"use client";

import Image from "next/image";
import Link from "next/link";
import type { Castle } from "@/lib/castle-data";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { MotionDiv } from "@/components/motion/MotionDiv";

interface CastleCardProps {
  castle: Castle;
}

const CastleCard = ({ castle }: CastleCardProps) => {
  return (
    <MotionDiv
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
      whileHover={{ y: -8, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="aspect-h-3 aspect-w-4 bg-gray-200 sm:aspect-none group-hover:opacity-75 sm:h-60 relative">
        <Image
          src={castle.imageUrl}
          alt={`Image of ${castle.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover object-center sm:h-full sm:w-full"
        />
      </div>
      <div className="flex flex-1 flex-col space-y-2 p-4">
        <h3 className="text-lg font-medium text-gray-900">
          <Link href={`/booking?castle=${castle.id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {castle.name}
          </Link>
        </h3>
        <p className="text-sm text-gray-500">{castle.description}</p>
        <div className="flex flex-1 flex-col justify-end">
            <div className="flex items-center text-sm text-gray-500 mb-2">
                <Tag className="h-4 w-4 mr-1"/>
                <span>{castle.theme}</span>
                <span className="mx-2">|</span>
                <span>{castle.size}</span>
            </div>
          <p className="text-2xl font-bold text-gray-900">£{castle.price}</p>
          <p className="text-sm text-gray-500 mb-4">per day hire</p>
          <Button asChild>
            <Link href={`/booking?castle=${castle.id}`} className="w-full">Book Now</Link>
          </Button>
        </div>
      </div>
    </MotionDiv>
  );
};

export default CastleCard; 