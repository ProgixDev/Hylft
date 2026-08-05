import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    title: "Enregistrez vos séances",
    description: "Une application de suivi qui fonctionne, tout simplement. Tout ce dont vous avez besoin pour noter vos performances et atteindre vos objectifs.",
    items: ["Saisie d'entraînement intuitive", "Planificateur de routine avancé", "Marquez les séries d'échauffement, dégressives et à l'échec", "Minuteurs de repos automatiques", "Ajoutez des notes aux exercices"],
    imageSide: "left",
    imageSrc: "/1.png",
  },
  {
    title: "Mesurez votre progression",
    description: "Rester motivé est plus facile lorsque vous pouvez voir le chemin parcouru.",
    items: ["Graphiques d'exercices avancés", "Records personnels (PR)", "Calcul du 1RM automatique", "Vidéos d'exercices de haute qualité", "Créez vos propres exercices personnalisés", "Historique complet des exercices"],
    imageSide: "right",
    imageSrc: "/2.png",
  },
  {
    title: "Apple Watch & WearOS",
    description: "Laissez votre téléphone au vestiaire et suivez vos séances directement depuis votre appareil Apple Watch ou WearOS. Synchronisez facilement vos routines et concentrez-vous sur votre entraînement.",
    items: ["Interface simple", "Synchronisation des routines de l'app", "Entraînement hors ligne"],
    link: { text: "Obtenez nos cadrans Hevy personnalisés pour Apple Watch.", href: "#" },
    imageSide: "left",
    imageSrc: "/3.png",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, #1B1F24 0%, #272C33 30%, #272C33 70%, #1B1F24 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`flex flex-col ${feature.imageSrc ? `md:flex-row items-center gap-12 ${feature.imageSide === 'right' ? 'md:flex-row-reverse' : ''}` : 'items-center'}`}
          >

            {feature.imageSrc && (
              <div className="w-full md:w-1/2 relative flex justify-center items-center">
                <div className="absolute w-[70%] h-[70%] bg-brand-green/20 rounded-full blur-[100px] -z-10" />
                <div className="w-full max-w-[400px] rounded-3xl overflow-hidden">
                  <Image src={feature.imageSrc} alt={feature.title} width={400} height={800} className="w-full h-auto object-contain" />
                </div>
              </div>
            )}

            <div className={`w-full ${feature.imageSrc ? 'md:w-1/2 text-center md:text-left' : 'max-w-2xl text-center'} space-y-6`}>
              <h2 className="text-3xl md:text-4xl font-black text-brand-green">{feature.title}</h2>
              <p className="text-lg text-brand-gray">{feature.description}</p>
              <ul className="space-y-3">
                {feature.items.map((item, i) => (
                  <li key={i} className={`flex items-start gap-3 text-brand-light ${feature.imageSrc ? 'justify-center md:justify-start' : 'justify-center'}`}>
                    <CheckCircle className="w-6 h-6 text-brand-green flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {feature.link && (
                <a href={feature.link.href} className="text-brand-green hover:underline block mt-4 font-medium">
                  {feature.link.text}
                </a>
              )}
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}