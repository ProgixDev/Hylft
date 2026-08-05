"use client";

import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Lock, Target } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center items-center px-6 py-12">
      <Link href="/" className="mb-8 hover:opacity-80 transition-opacity">
        <Image src="/logo.png" alt="HYLFT" width={130} height={35} priority />
      </Link>

      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-green/10 rounded-full blur-[60px] -z-10" />

        <h1 className="text-3xl font-black text-white mb-2 text-center">Crée ton compte</h1>
        <p className="text-brand-gray text-center mb-8 italic text-sm">
          Commence ta transformation aujourd'hui.
        </p>

        <form className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-light mb-2">
              <User size={16} className="text-brand-green" /> Nom d&apos;utilisateur
            </label>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all placeholder:text-white/20"
              placeholder="ex: MuscuWarrior"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-light mb-2">
              <Mail size={16} className="text-brand-green" /> Email
            </label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all placeholder:text-white/20"
              placeholder="ton@email.com"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-light mb-2">
              <Lock size={16} className="text-brand-green" /> Mot de passe
            </label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-brand-light mb-2">
              <Target size={16} className="text-brand-green" /> Ton objectif principal
            </label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-green outline-none transition-all appearance-none cursor-pointer">
              <option className="bg-brand-dark" value="mass">Prise de masse</option>
              <option className="bg-brand-dark" value="cut">Sèche / Perte de poids</option>
              <option className="bg-brand-dark" value="strength">Force pure</option>
              <option className="bg-brand-dark" value="health">Santé &amp; Bien-être</option>
            </select>
          </div>

          <button className="w-full bg-brand-green text-brand-dark font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(164,230,0,0.2)] mt-4">
            REJOINDRE LA COMMUNAUTÉ
          </button>
        </form>

        <p className="mt-8 text-center text-brand-gray text-sm">
          Déjà un athlète HYLFT ?{" "}
          <Link href="/login" className="text-brand-green font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      
    </div>
  );
}
