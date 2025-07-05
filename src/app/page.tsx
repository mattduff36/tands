import Hero from "@/components/sections/Hero";
import Introduction from "@/components/sections/Introduction";
import { CastleHighlights } from "@/components/sections/CastleHighlights";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <AnimatedSection>
        <Introduction />
      </AnimatedSection>
      <AnimatedSection>
        <CastleHighlights />
      </AnimatedSection>
    </main>
  );
}
