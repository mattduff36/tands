"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { MotionH1 } from "@/components/motion/MotionH1";
import { MotionP } from "@/components/motion/MotionP";

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
    <section className="relative h-[calc(60vh+3rem)] min-h-[448px] w-full flex items-center justify-center text-white">
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
        <div className="mb-4 flex justify-center pt-12">
          <MotionDiv
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: 1 }}
            transition={{
              scale: {
                delay: 0.5,
                duration: 0.3,
                times: [0, 0.5, 1],
              },
              opacity: { duration: 0.5, delay: 0.2 },
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { type: "spring", stiffness: 260, damping: 10 },
            }}
          >
            <Image
              src="/tands_logo.png"
              alt="T&S Bouncy Castle Hire Logo"
              width={300}
              height={80}
              priority
            />
          </MotionDiv>
        </div>
        <MotionH1
          className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md"
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
        >
          The Best Bouncy Castles in Town!
        </MotionH1>
        <MotionP
          className="mt-4 max-w-2xl mx-auto text-lg md:text-xl drop-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Fun, Safe, and Fully Insured. We bring the party to you!
        </MotionP>
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