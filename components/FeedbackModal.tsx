
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { feedbackService } from '../services/feedbackService';
import { Toast } from './ui/Toast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface FeedbackModalProps {
  onClose: () => void;
}

const ratings = [
  { emoji: '😞', label: 'Very Bad' },
  { emoji: '😟', label: 'Bad' },
  { emoji: '😐', label: 'Medium' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Very Good' },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [selectedRating, setSelectedRating] = useState<number | null>(3); // Default to Good
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleSubmit = async () => {
    if (!isOnline) {
        setToast({ message: "You are offline.", type: 'error' });
        return;
    }
    if (selectedRating === null) {
        setToast({ message: "Please select a rating", type: 'error' });
        return;
    }

    setIsSubmitting(true);
    try {
        const ratingLabel = ratings[selectedRating].label;
        await feedbackService.submitFeedback(ratingLabel, comment);
        
        setToast({ message: "Thank you for your feedback!", type: 'success' });
        
        setTimeout(() => {
            setIsSubmitting(false);
            onClose();
        }, 1500);
    } catch (error) {
        setToast({ message: "Failed to submit feedback. Please try again.", type: 'error' });
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      {toast && (
          <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
          />
      )}
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center">
            <Icon name="chat" className="w-6 h-6 mr-3 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Feedback</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <Icon name="close" className="w-5 h-5"/>
          </button>
        </header>

        <main className="p-6 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">How are you feeling?</h3>
          <p className="text-sm text-slate-500 mb-6">Your input is valuable in helping us better understand your needs and tailor our service accordingly.</p>
          
          <div className="flex justify-center items-end space-x-4 mb-6">
            {ratings.map((rating, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => setSelectedRating(index)}
                  className={`text-4xl transition-all duration-300 transform rounded-full p-2 ${
                    selectedRating === index ? 'scale-125' : 'grayscale hover:grayscale-0 hover:scale-110'
                  }`}
                  style={{
                    filter: selectedRating !== null && selectedRating !== index ? 'grayscale(80%)' : 'none',
                    opacity: selectedRating !== null && selectedRating !== index ? 0.7 : 1,
                  }}
                >
                  <div
                    className="relative rounded-full"
                    style={{
                      boxShadow: selectedRating === index ? '0 0 0 4px rgba(106, 90, 224, 0.3)' : 'none',
                    }}
                  >
                    {rating.emoji}
                  </div>
                </button>
                {selectedRating === index && (
                  <span className="mt-2 text-xs font-semibold text-white bg-slate-800 px-2 py-0.5 rounded-full">
                    {rating.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a Comment..."
            className="w-full h-24 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
          />
        </main>
        
        <footer className="p-4 bg-slate-50 border-t border-slate-200">
          <Button 
            onClick={handleSubmit}
            disabled={!isOnline || isSubmitting}
            isLoading={isSubmitting}
            variant="dark"
            fullWidth
            className="!py-3"
          >
            {isOnline ? (isSubmitting ? 'Sending...' : 'Submit Now') : 'Offline'}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default FeedbackModal;
