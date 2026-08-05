import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const guides = [
  {
    title: "Programme Split 3 Jours – Le Guide Complet (2026)",
    image: "/guide1.jpg", 
    category: "Entraînement",
    href: "#"
  },
  {
    title: "Programme Split 4 Jours – Le Guide Complet (2026)",
    image: "/guide2.jpg",
    category: "Musculation",
    href: "#"
  },
  {
    title: "Split 5 Jours : Upper/Lower, PPL & Plus (Exemples)",
    image: "/guide3.jpg",
    category: "Performance",
    href: "#"
  },
  {
    title: "Le 'Bro Split' 5 Jours pour le Bodybuilding Naturel",
    image: "/guide4.jpg",
    category: "Hypertrophie",
    href: "#"
  },
  {
    title: "Le Split Upper / Lower – Guide Complet des Programmes",
    image: "/guide5.jpg",
    category: "Force",
    href: "#"
  },
  {
    title: "Push Pull Legs – Splits de 3, 4, 5 & 6 Jours",
    image: "/guide6.jpg",
    category: "Programmation",
    href: "#"
  }
];

export default function Guides() {
  return (
    <section id="guides" className="bg-brand-dark py-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* En-tête de la section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Nos Guides</h2>
            <p className="text-brand-gray text-lg">
              Apprenez les meilleures stratégies d'entraînement avec nos guides détaillés rédigés par des experts.
            </p>
          </div>
          <Link href="#" className="text-brand-green font-bold flex items-center gap-2 group hover:gap-3 transition-all">
            Voir tous les articles <ArrowRight size={20} />
          </Link>
        </div>

        {/* Grille d'articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide, index) => (
            <Link key={index} href={guide.href} className="group">
              <div className="relative h-64 w-full mb-6 overflow-hidden rounded-2xl border border-white/10">
                {/* Overlay pour assombrir un peu l'image et faire ressortir le texte */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                
                <Image
                  src={guide.image}
                  alt={guide.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge de catégorie */}
                <span className="absolute top-4 left-4 z-20 bg-brand-dark/80 backdrop-blur-md text-brand-green text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                  {guide.category}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-green transition-colors leading-snug">
                {guide.title}
              </h3>
              
              <span className="text-brand-green text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                Lire l'article <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}