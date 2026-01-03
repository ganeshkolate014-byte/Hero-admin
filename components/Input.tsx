import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest pl-1">
        {label}
      </label>
      <input
        className={`w-full bg-input border border-border text-white px-4 py-3 rounded-sm text-sm focus:border-accent focus:outline-none transition-colors placeholder-zinc-700 ${className}`}
        autoComplete="off"
        {...props}
      />
    </div>
  );
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest pl-1">
        {label}
      </label>
      <textarea
        className={`w-full bg-input border border-border text-white px-4 py-3 rounded-sm text-sm focus:border-accent focus:outline-none transition-colors min-h-[120px] placeholder-zinc-700 ${className}`}
        {...props}
      />
    </div>
  );
};