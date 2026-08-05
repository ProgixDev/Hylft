"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-6">
      <Link href="/" className="mb-10">
        <Image src="/logo.png" alt="HYLFT" width={140} height={40} />
      </Link>

      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2 text-center">Bon retour !</h1>
        <p className="text-brand-gray text-center mb-8">Connecte-toi pour suivre tes progrès.</p>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none transition-all"
              placeholder="ton@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">Mot de passe</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-brand-green text-brand-dark font-black py-4 rounded-xl hover:scale-[1.02] transition-transform">
            SE CONNECTER
          </button>
        </form>

        <p className="mt-8 text-center text-brand-gray text-sm">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-brand-green font-bold hover:underline">
            S'inscrire gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
