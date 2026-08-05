'use client';
import { Star, CheckCircle } from 'lucide-react';

const reviews = [
  {
    title: "Entraînement HYLFT",
    text: "Le meilleur tracker que j'ai trouvé. Facile pour commencer, simple à modifier et un outil puissant à utiliser au quotidien.",
    author: "Thomas_HERO",
    time: "il y a 3 jours",
    rating: 5
  },
  {
    title: "Application incroyable",
    text: "J'utilise l'appli depuis un moment maintenant. Elle décompose les séries, les reps, le volume et te montre les muscles travaillés. Je n'aurai plus jamais besoin d'une autre appli.",
    author: "SwoleBro_Liftin",
    time: "il y a 9 jours",
    rating: 5
  },
  {
    title: "Meilleur Suivi Sportif",
    text: "J'en ai testé d'autres mais celle-ci est la meilleure absolue. Très facile d'y intégrer ses programmes. L'aspect social est unique, j'adore partager mes séances !",
    author: "Csrgrado",
    time: "il y a 3 jours",
    rating: 5
  },
  {
    title: "Parfait pour progresser",
    text: "Grâce à HYLFT, je peux voir mes progrès semaine après semaine. Les graphiques sont super clairs et motivants.",
    author: "FitGirl_92",
    time: "il y a 5 jours",
    rating: 5
  },
  {
    title: "Simple et efficace",
    text: "Pas de pubs, pas de fonctions inutiles. Juste ce qu'il faut pour suivre ses entraînements. Top !",
    author: "MaxPower_Gym",
    time: "il y a 1 semaine",
    rating: 5
  },
  {
    title: "L'appli que j'attendais",
    text: "Après des années à chercher la bonne appli, HYLFT coche toutes les cases. La synchro Apple Watch est un game changer.",
    author: "IronWill_Alex",
    time: "il y a 2 jours",
    rating: 5
  }
];

export default function Reviews() {
  return (
    <section id="reviews" className="bg-brand-dark py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- EN-TÊTE : NOTES GLOBALES --- */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-16">
          {/* Note App Store */}
          <div className="text-center">
            <p className="text-brand-gray text-sm mb-2 font-medium">4.9/5 étoiles - 209k+ avis</p>
            <div className="flex items-center gap-2 justify-center">
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={20} className="stroke-none" />)}
              </div>
              <span className="text-white font-bold flex items-center gap-2">
                 {/* Logo Apple simple SVG */}
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-14.7 0-51.4-22.2-84.6-21.6-42.9 .7-82.7 25.1-104.7 63.9-45.6 79.4-11.7 197.3 32.1 260.6 21.4 30.9 47.6 65.2 81.1 63.9 32.2-1.3 44.5-20.9 83.5-20.9 38.9 0 50.1 20.9 83.9 20.2 34.4-.7 57.2-30.8 78.5-61.9 24.6-35.9 34.6-70.7 34.8-72.5-.7-.3-66.9-25.7-67.4-102.1zM266.3 83.4c18.1-22 30.3-52.6 27-83.4-25.9 1-57.1 17.2-75.7 39-16.7 19.3-31.3 50.9-27.4 80.8 28.7 2.2 58.1-14.4 76.1-36.4z"/></svg>
                 App Store
              </span>
            </div>
          </div>

          {/* Note Google Play */}
          <div className="text-center">
            <p className="text-brand-gray text-sm mb-2 font-medium">4.9/5 étoiles - 186k+ avis</p>
            <div className="flex items-center gap-2 justify-center">
               <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={20} className="stroke-none" />)}
              </div>
              <span className="text-white font-bold flex items-center gap-2">
                 {/* Logo Google Play simple SVG */}
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 58.9-34.1c18-10.4 29.2-27.9 29.2-47.2 0-19.3-11.2-36.8-29.2-47.2zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                 Google Play
              </span>
            </div>
          </div>
        </div>

        {/* --- CARTES AVIS (Défilement automatique infini) --- */}
        <div className="relative overflow-hidden">
          {/* Masques de fondu sur les bords */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-dark to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-dark to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 animate-scroll hover:[animation-play-state:paused]">
            {/* On duplique les cartes pour un effet de boucle infini */}
            {[...reviews, ...reviews].map((review, index) => (
              <div 
                key={index} 
                className="min-w-[320px] max-w-[350px] bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex text-yellow-400 gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" className="stroke-none" />
                      ))}
                    </div>
                    <span className="text-xs text-brand-gray">{review.time}</span>
                  </div>
                  
                  <h4 className="text-white font-bold text-lg mb-2">{review.title}</h4>
                  <p className="text-brand-gray text-sm leading-relaxed mb-6">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-white font-medium text-sm">{review.author}</span>
                  <div className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full text-xs font-medium">
                    <CheckCircle size={12} />
                    Vérifié
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}