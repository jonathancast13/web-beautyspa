import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Schedule from "@/components/Schedule";
import Services from "@/components/Services";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <HowItWorks />
      <Gallery />
      <Schedule />
      <FAQ />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
