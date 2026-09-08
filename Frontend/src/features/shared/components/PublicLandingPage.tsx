import SiteNav from './parts/SiteNav';
import Hero from './parts/Hero';
import Stats from './parts/Stats';
import Features from './parts/Features';
import Modules from './parts/Modules';
import WhyUs from './parts/WhyUs';
import Pricing from './parts/Pricing';
import Access from './parts/Access';
import Footer from './parts/Footer';
import Reveal from './Reveal';

export default function PublicLandingPage() {
  return (
    <div className="superadmin-theme min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50/20 text-slate-900">
      <SiteNav />
      <main>
        <Hero />
        <Reveal><Stats /></Reveal>
        <Reveal><Features /></Reveal>
        <Reveal><Modules /></Reveal>
        <Reveal><WhyUs /></Reveal>
        <Reveal><Pricing /></Reveal>
        <Reveal><Access /></Reveal>
      </main>
      <Footer />
    </div>
  );
}
