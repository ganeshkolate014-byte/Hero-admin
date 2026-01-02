import React from 'react';
import { ClipboardDocumentIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface HomePageProps {
  publishedUrl: string;
  onNavigateToAdmin: () => void;
  onCopyToClipboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ publishedUrl, onNavigateToAdmin, onCopyToClipboard }) => {
  return (
    <div className="h-dvh w-screen bg-bg text-zinc-300 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Anime Hero Admin
        </h1>
        <p className="text-zinc-400 mb-12 max-w-md mx-auto">
          Manage your hero slider content with ease. Publish your changes and get a live API endpoint instantly.
        </p>

        <div className="space-y-4 mb-12">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Live API Endpoint
          </label>
          <div className="flex gap-2 justify-center">
            <input
              readOnly
              value={publishedUrl || "Publish from the admin panel to get your URL"}
              className="w-full max-w-md text-center bg-input border border-border text-zinc-400 px-4 py-3 rounded-lg text-sm outline-none"
            />
            {publishedUrl && (
              <button
                onClick={onCopyToClipboard}
                className="px-4 py-3 rounded-lg border border-border bg-input text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                title="Copy URL"
              >
                <ClipboardDocumentIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onNavigateToAdmin}
          className="bg-white text-black font-bold py-4 px-8 rounded-lg text-base hover:bg-zinc-200 transition-transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <span>Open Admin Panel</span>
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};