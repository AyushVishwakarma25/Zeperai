import React from 'react';
import { Spinner } from './ui/Spinner';

interface CreativeBrief {
  personas: string[];
  marketingAngles: string[];
  sceneIdeas: string[];
}

interface CreativeBriefPanelProps {
  brief: CreativeBrief | null;
  isLoading: boolean;
  onApplySuggestion: (field: 'modelPersona' | 'poseSuggestion' | 'backgroundStyle', value: string) => void;
}

const SuggestionButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 bg-dark-card text-light-text rounded-lg text-left w-full hover:bg-primary/50 hover:text-white transition-colors text-sm"
  >
    {children}
  </button>
);

export const CreativeBriefPanel: React.FC<CreativeBriefPanelProps> = ({ brief, isLoading, onApplySuggestion }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-text">
        <Spinner />
        <p className="mt-2 text-sm">Brainstorming ideas...</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center text-muted-text p-4 text-sm">
        Describe your product above, and AI will generate a creative brief here to kickstart your campaign.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in" style={{ animation: 'fade-in 0.5s ease-out forwards' }}>
      <div>
        <h4 className="font-semibold text-light-text mb-2">Target Personas</h4>
        <div className="space-y-2">
          {brief.personas.map((persona, i) => (
            <SuggestionButton key={`p-${i}`} onClick={() => onApplySuggestion('modelPersona', persona)}>
              {persona}
            </SuggestionButton>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-light-text mb-2">Marketing Angles</h4>
        <div className="space-y-2">
          {brief.marketingAngles.map((angle, i) => (
             <SuggestionButton key={`a-${i}`} onClick={() => onApplySuggestion('poseSuggestion', angle)}>
              {angle}
            </SuggestionButton>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-light-text mb-2">Scene Ideas</h4>
        <div className="space-y-2">
          {brief.sceneIdeas.map((scene, i) => (
            <SuggestionButton key={`s-${i}`} onClick={() => onApplySuggestion('backgroundStyle', scene)}>
              {scene}
            </SuggestionButton>
          ))}
        </div>
      </div>
    </div>
  );
};
