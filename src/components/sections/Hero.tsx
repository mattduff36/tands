"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { MotionH1 } from "@/components/motion/MotionH1";
import { MotionP } from "@/components/motion/MotionP";
import { Bubblegum_Sans } from "next/font/google";

const bubblegumSans = Bubblegum_Sans({ subsets: ["latin"], weight: ["400"] });

const images = [
  "/IMG_2360.JPEG",
  "/IMG_2361.JPEG",
  "/IMG_2362.JPEG",
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
    <section className="relative h-[80vh] w-full flex items-center justify-center text-white">
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
      <div className="absolute inset-0 bg-[#37B8D4]/50" />
      <div className="relative z-10 text-center p-4">
        <div className="mb-4 flex justify-center pt-20">
          <MotionDiv
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: 1.1,
              rotate: 5
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.2 },
              scale: { 
                delay: 1.5, 
                duration: 0.5, 
                type: "spring", 
                stiffness: 260, 
                damping: 10 
              },
              rotate: { 
                delay: 1.5, 
                duration: 0.5, 
                type: "spring", 
                stiffness: 260, 
                damping: 10 
              }
            }}
          >
            <Image
              src="/tands_logo.png"
              alt="T&S Bouncy Castle Hire Logo"
              width={240}
              height={64}
              priority
            />
          </MotionDiv>
        </div>
        <MotionH1
          className={`${bubblegumSans.className} text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md`}
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
        >
          The Best Bouncy Castles in Town!
        </MotionH1>
        <MotionP
          className="mt-4 max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto text-base sm:text-lg drop-shadow font-bold bg-white/20 rounded-2xl p-2 sm:p-4 backdrop-blur-sm border-2 border-white/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          🎉 Fun, Safe, and Fully Insured. We bring the party to you! 🎉
        </MotionP>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <MotionDiv
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.8,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg border-2 border-white/30">
              <Link href="/castles">🏰 View Our Castles</Link>
            </Button>
          </MotionDiv>
          <MotionDiv
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.8,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg border-2 border-white/30">
              <Link href="/booking">📅 Book Now</Link>
            </Button>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
};

export default Hero; 