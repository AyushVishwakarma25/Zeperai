
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  const email = "Ayush@zeperai.com";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[80] flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg mr-3">
                <Icon name="headset" className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Contact Support</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
            <Icon name="close" className="w-5 h-5"/>
          </button>
        </header>

        <main className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="chat" className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">How can we help?</h3>
            <p className="text-sm text-slate-500">
                We're here to assist you with any questions, issues, or feedback you might have about ZeperAi.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-colors">
            <div className="flex items-center overflow-hidden">
                <div className="p-2 bg-white rounded-lg shadow-sm mr-3 border border-slate-100">
                    <Icon name="user" className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Support Email</p>
                    <a href={`mailto:${email}`} className="text-sm sm:text-base font-bold text-slate-800 hover:text-primary truncate transition-colors">
                        {email}
                    </a>
                </div>
            </div>
            <button 
                onClick={handleCopy}
                className="p-2 ml-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
                title="Copy Email"
            >
                <Icon name={copied ? 'check-circle' : 'copy'} className={`w-5 h-5 ${copied ? 'text-green-500' : ''}`} />
            </button>
          </div>
        </main>
        
        <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
          <Button 
            onClick={() => window.location.href = `mailto:${email}`}
            variant="primary"
            fullWidth
          >
            Send an Email
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default SupportModal;
