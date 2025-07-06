"use client";

import { MotionDiv } from "@/components/motion/MotionDiv";

export const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {children}
    </MotionDiv>
  );
}; 