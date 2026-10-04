import React from 'react';
import Navbar from '../components/marketing/Navbar';
import HeroSection from '../components/marketing/HeroSection';
import FeaturesSection from '../components/marketing/FeaturesSection';
import SocialProofSection from '../components/marketing/SocialProofSection';
import TestimonialsSection from '../components/marketing/TestimonialsSection';
import CallToActionSection from '../components/marketing/CallToActionSection';
import Footer from '../components/marketing/Footer';
import CookieBanner from '../components/marketing/CookieBanner';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-cream text-todoist-text flex flex-col selection:bg-brand-light selection:text-brand">
      {/* Cookie Banner */}
      <CookieBanner />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section with Interactive Mini Task Manager */}
        <HeroSection />

        {/* 5 Signature Features */}
        <FeaturesSection />

        {/* Social Proof & Publication Quotes */}
        <SocialProofSection />

        {/* Tweet-style Testimonials */}
        <TestimonialsSection />

        {/* Final Call to Action */}
        <CallToActionSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
