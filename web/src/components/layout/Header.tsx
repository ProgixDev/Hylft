import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="HYLFT" 
            width={120} 
            height={40} 
            className="brightness-110"
          />
        </Link>

        <nav className="hidden md:flex gap-8">
          {[
            { label: 'Home', href: '/' },
            { label: 'Product', href: '/#features' },
            { label: 'Articles', href: '/#guides' },
            { label: 'Hevy Coach', href: '/#reviews' },
            { label: 'About Us', href: '/#faq' },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href}
              className="text-sm font-medium hover:text-brand-green transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium hover:text-brand-green transition-colors">
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="bg-brand-green text-brand-dark px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}