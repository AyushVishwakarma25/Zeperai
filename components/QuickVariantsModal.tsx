import React from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';

interface QuickVariantsModalProps {
  field: 'modelPersona' | 'poseSuggestion';
  isLoading: boolean;
  suggestions: string[];
  error: string | null;
  onClose: () => void;
  onSelect: (suggestion: string) => void;
}

const QuickVariantsModal: React.FC<QuickVariantsModalProps> = ({
  field,
  isLoading,
  suggestions,
  error,
  onClose,
  onSelect,
}) => {
  const title = field === 'modelPersona' ? 'Model Persona Ideas' : 'Pose & Action Ideas';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-main w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center">
            <Icon name="sparkles" className="w-6 h-6 mr-3 text-primary" />
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <Icon name="close" className="w-5 h-5"/>
          </button>
        </header>
        <main className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48">
              <Spinner />
              <p className="mt-2 text-slate-500">Generating creative ideas...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
              <p><strong>Failed to get suggestions:</strong></p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSelect(suggestion)}
                  className="p-3 bg-slate-100 text-slate-700 rounded-lg text-left h-full hover:bg-primary/20 hover:text-primary transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuickVariantsModal;
