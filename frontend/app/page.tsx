import Hero from '@/components/Hero';
import GlassTransition from '@/components/GlassTransition';
import ProblemSection from '@/components/ProblemSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import LiveProofSection from '@/components/LiveProofSection';
import NoxTechnicalSection from '@/components/NoxTechnicalSection';
import GovernanceSection from '@/components/GovernanceSection';
import FaqSection from '@/components/FaqSection';
import FinalCta from '@/components/FinalCta';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <GlassTransition />
      <ProblemSection />
      <HowItWorksSection />
      <LiveProofSection />
      <NoxTechnicalSection />
      <GovernanceSection />
      <FaqSection />
      <FinalCta />
      <Footer />
    </>
  );
}
