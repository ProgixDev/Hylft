import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import Features from '@/components/sections/Features';
import Guides from '@/components/sections/Guides';
import Hero from '@/components/sections/HeroSection';
import Questions from '@/components/sections/Questions';
import Reviews from '@/components/sections/Review';

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <Header />
      <Hero />
      <Features />
      <Reviews />
      <Guides />
      <Questions />
      <Footer />
    </main>
  );
}