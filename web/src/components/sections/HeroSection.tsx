import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden" style={{ background: 'linear-gradient(180deg, #272C33 0%, #1B1F24 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div className="z-10 text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1]">
            Log Workouts<br />
            <span className="text-brand-green">Get Stronger</span><br />
            Stay Motivated
          </h1>
          
          <p className="mt-6 text-brand-gray text-lg md:text-xl max-w-xl mx-auto lg:mx-0">
            HYLFT est le traqueur d'entraînement ultime. 
            Crée tes routines, suis tes progrès et dépasse tes limites.
          </p>

          <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
            <button className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-14.7 0-51.4-22.2-84.6-21.6-42.9 .7-82.7 25.1-104.7 63.9-45.6 79.4-11.7 197.3 32.1 260.6 21.4 30.9 47.6 65.2 81.1 63.9 32.2-1.3 44.5-20.9 83.5-20.9 38.9 0 50.1 20.9 83.9 20.2 34.4-.7 57.2-30.8 78.5-61.9 24.6-35.9 34.6-70.7 34.8-72.5-.7-.3-66.9-25.7-67.4-102.1zM266.3 83.4c18.1-22 30.3-52.6 27-83.4-25.9 1-57.1 17.2-75.7 39-16.7 19.3-31.3 50.9-27.4 80.8 28.7 2.2 58.1-14.4 76.1-36.4z"/></svg>
              <div className="text-left">
                <p className="text-[10px] text-brand-gray leading-none">Download on</p>
                <p className="text-sm font-bold text-white leading-none">App Store</p>
              </div>
            </button>

            {/* Bouton Google Play */}
            <button className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 58.9-34.1c18-10.4 29.2-27.9 29.2-47.2 0-19.3-11.2-36.8-29.2-47.2zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
              <div className="text-left">
                <p className="text-[10px] text-brand-gray leading-none">Get it on</p>
                <p className="text-sm font-bold text-white leading-none">Google Play</p>
              </div>
            </button>
          </div>

          {/* PREUVE SOCIALE (Étoiles) */}
          <div className="mt-10 flex flex-col items-center lg:items-start gap-3">
            <div className="flex text-brand-green gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl">★</span>
              ))}
            </div>
            <p className="text-sm text-brand-gray italic">
              "La meilleure application pour soulever lourd !" — <span className="text-white font-semibold">1M+ athlètes</span>
            </p>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="absolute w-[80%] h-[80%] bg-brand-green/20 rounded-full blur-[100px] -z-10 animate-pulse" />
          
          <div className="relative w-full max-w-[400px]">
            <Image 
              src="/phone3.png" 
              alt="HYLFT App"
              width={400}
              height={800}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}