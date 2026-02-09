import React, { useState } from 'react';

interface SqlHelperProps {
  sql: string;
}

export const SqlHelper = ({ sql }: SqlHelperProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  return (
    <div className="mt-3 w-full animate-fade-in">
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3">
        <p className="text-xs text-amber-800 font-semibold mb-1">
          Database tables not found.
        </p>
        <p className="text-[10px] text-amber-700 leading-tight">
          Please run the SQL script below in your Supabase SQL Editor to initialize your database and storage buckets.
        </p>
      </div>

      <div className="relative group">
        <pre className="bg-slate-900 text-slate-300 p-3 rounded-xl text-[9px] h-32 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 font-mono border border-slate-800">
          {sql}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1 text-[10px] font-bold rounded-lg transition-all shadow-sm ${
            copied 
            ? 'bg-green-500 text-white' 
            : 'bg-white text-slate-800 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
          }`}
        >
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>
    </div>
  );
};