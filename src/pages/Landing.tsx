import { useEffect } from "react";
import Hero from "@/components/landing/Hero";
import AboutSection from "@/components/landing/AboutSection";
import WhatWeDo from "@/components/landing/WhatWeDo";
import UserExperience from "@/components/landing/UserExperience";
import Testimonials from "@/components/landing/Testimonials";
import AuthSection from "@/components/landing/AuthSection";
import Footer from "@/components/landing/Footer";
import LandingHeader from "@/components/landing/LandingHeader";

export default function Landing() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

      <main className="flex-1 pt-24 sm:pt-28">
        <Hero />
        <AboutSection />
        <WhatWeDo />
        <UserExperience />
        <Testimonials />
        <AuthSection />
      </main>

      <Footer />
    </div>
  );
}
