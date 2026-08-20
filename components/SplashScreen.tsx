import React from 'react';
import { EncryptedText } from './ui/encrypted-text';

interface SplashScreenProps {
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white p-4 select-none">
      <p className="mx-auto max-w-lg py-10 text-left text-xl sm:text-2xl font-mono">
        <EncryptedText
          text="Welcome to the ZeperAI."
          encryptedClassName="text-neutral-500"
          revealedClassName="text-white"
          revealDelayMs={50}
        />
      </p>
    </div>
  );
};
