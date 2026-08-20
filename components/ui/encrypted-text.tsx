import React, { useEffect, useState } from 'react';

interface EncryptedTextProps {
  text: string;
  encryptedClassName?: string;
  revealedClassName?: string;
  revealDelayMs?: number;
  className?: string;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  encryptedClassName = "text-neutral-500",
  revealedClassName = "dark:text-white text-black",
  revealDelayMs = 50,
  className = "",
}) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [scrambled, setScrambled] = useState<string[]>(() =>
    text.split("").map((char) => (char === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)]))
  );

  useEffect(() => {
    setRevealedCount(0);
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return text.length;
        }
        return prev + 1;
      });
    }, revealDelayMs);

    return () => clearInterval(interval);
  }, [text, revealDelayMs]);

  useEffect(() => {
    const scrambleInterval = setInterval(() => {
      setScrambled(
        text.split("").map((char, index) => {
          if (char === " ") return " ";
          if (index < revealedCount) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
      );
    }, 40);

    return () => clearInterval(scrambleInterval);
  }, [text, revealedCount]);

  return (
    <span className={`font-mono transition-all ${className}`}>
      {scrambled.map((char, index) => {
        const isRevealed = index < revealedCount;
        return (
          <span
            key={index}
            className={isRevealed ? revealedClassName : encryptedClassName}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export function EncryptedTextDemoSecond() {
  return (
    <p className="mx-auto max-w-lg py-10 text-left">
      <EncryptedText
        text="Welcome to the ZeperAI."
        encryptedClassName="text-neutral-500"
revealedClassName="dark:text-white text-black"
        revealDelayMs={50}
      />
    </p>
  );
}
