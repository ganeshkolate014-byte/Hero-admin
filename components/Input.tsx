import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-zinc-500 text-xs font-medium pl-1">
        {label}
      </label>
      <input
        className={`w-full bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white focus:outline-none transition-colors placeholder-zinc-700 ${className}`}
        autoComplete="off"
        {...props}
      />
    </div>
  );
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-zinc-500 text-xs font-medium pl-1">
        {label}
      </label>
      <textarea
        className={`w-full bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white focus:outline-none transition-colors min-h-[100px] placeholder-zinc-700 ${className}`}
        {...props}
      />
    </div>
  );
};