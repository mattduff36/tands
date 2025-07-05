"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const images = [
  "/bouncy-castle-1.jpg",
  "/bouncy-castle-2.jpg",
  "/bouncy-castle-3.jpg",
  "/bouncy-castle-4.jpg",
];

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-white">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt="Bouncy castle"
          fill
          className={`object-cover transition-opacity duration-1000 ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center p-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">
          The Best Bouncy Castles in Town!
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl drop-shadow">
          Fun, Safe, and Fully Insured. We bring the party to you!
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/castles">View Our Castles</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/booking">Book Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero; 