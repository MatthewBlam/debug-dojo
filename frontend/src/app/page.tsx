import { T } from "@/lib/tokens";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Problem } from "@/components/landing/Problem";
import { Solution } from "@/components/landing/Solution";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AiEra } from "@/components/landing/AiEra";
import { Audience } from "@/components/landing/Audience";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { LandingStyles } from "@/components/landing/shared";

export const metadata = {
  title: "Debug Dojo — Practice the judgment CS classes don't teach",
  description:
    "Train the real-world engineering instincts that make CS students valuable: debug subtle bugs, review code, and verify AI-generated work before your next internship or job."
};

export default function LandingPage() {
  return (
    <div
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        minHeight: "100dvh",
        overflowX: "hidden"
      }}>
      <LandingNav />
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <AiEra />
      <Audience />
      <FinalCta />
      <Footer />
      <LandingStyles />
    </div>
  );
}
