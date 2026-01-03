import React, { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

interface LoginPageProps {
  onLogin: (username: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('sukuna');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      await onLogin(username.trim());
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setIsLoading(false);
    }
    // Don't set isLoading to false here, as the parent component will take over.
  };

  return (
    <div className="h-dvh w-screen bg-bg text-zinc-300 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 italic">
          ANIME<span className="text-accent">HERO</span>
        </h1>
        <p className="text-zinc-500 mb-12 max-w-sm mx-auto text-sm leading-relaxed">
          ROG Edition System requires a user handle to access the content nexus.
        </p>
        <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto space-y-6">
          <div>
            <label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest text-left pl-1 block mb-2">
              User Handle
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='Enter your user handle...'
              className="w-full text-center bg-input border border-border text-white px-4 py-4 rounded-sm text-sm focus:border-accent focus:outline-none placeholder-zinc-700 font-medium"
              autoFocus
            />
            {error && <p className="text-accent text-xs mt-2 animate-pulse">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-white font-black py-4 px-10 rounded-sm text-sm uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-105 flex items-center justify-center gap-3 mx-auto shadow-[0_0_20px_rgba(230,25,25,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <span>Enter Nexus</span>}
            {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};