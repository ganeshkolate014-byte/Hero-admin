import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

interface HomePageProps {
  onNavigateToAdmin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToAdmin }) => {
  return (
    <div className="h-dvh w-screen bg-bg text-zinc-300 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-lg">
        <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-6 animate-pulse">
          ROG Edition System
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 italic">
          ANIME<span className="text-accent">HERO</span>
        </h1>
        <p className="text-zinc-500 mb-12 max-w-sm mx-auto text-sm leading-relaxed">
          The ultimate content management engine for high-performance sliders. 
          Real-time updates. AI-powered metadata.
        </p>

        <button
          onClick={onNavigateToAdmin}
          className="bg-accent text-white font-black py-4 px-10 rounded-sm text-sm uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(230,25,25,0.3)]"
        >
          <span>Enter Admin Console</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};