"use client"; // Important car on utilise des interactions (useState)

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "L'application HYLFT est-elle gratuite ?",
    answer: "Oui ! HYLFT propose une version gratuite très complète qui vous permet d'enregistrer vos entraînements, de créer des routines illimitées et de suivre vos progrès. Une version Pro est disponible pour ceux qui veulent des analyses encore plus poussées."
  },
  {
    question: "Puis-je importer mes données depuis une autre application ?",
    answer: "Absolument. Nous avons créé des outils d'importation facile pour Strong, Hevy et d'autres applications populaires. Vous ne perdrez pas votre historique en nous rejoignant."
  },
  {
    question: "L'application fonctionne-t-elle sans internet ?",
    answer: "Oui, le mode hors-ligne est natif. Vous pouvez vous entraîner au fond d'une salle en sous-sol sans réseau. Vos données se synchroniseront automatiquement dès que vous retrouverez une connexion."
  },
  
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-brand-dark py-24 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-green text-sm font-bold mb-6">
            <HelpCircle size={16} />
            <span>Support & Aide</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Questions Fréquentes
          </h2>
          <p className="text-brand-gray text-lg">
            Tout ce que vous devez savoir pour bien démarrer votre transformation.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-white/10 rounded-2xl transition-all duration-300 ${openIndex === index ? 'bg-white/5 border-brand-green/30' : 'bg-transparent hover:bg-white/[0.02]'}`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
              >
                <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-white' : 'text-brand-light'}`}>
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="text-brand-green flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-brand-gray flex-shrink-0" />
                )}
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-6 pt-0 text-brand-gray leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-brand-gray mt-12 text-sm">
          Vous ne trouvez pas votre réponse ? <a href="#" className="text-brand-green font-bold hover:underline">Contactez notre support</a>
        </p>

      </div>
    </section>
  );
}