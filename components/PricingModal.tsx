
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { paymentService, STRIPE_PRICES } from '../services/paymentService';
import { Spinner } from './ui/Spinner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface PricingModalProps {
  onClose: () => void;
}

const pricingPlans = [
  {
    id: 'free',
    priceId: 'free',
    name: 'Free Trial',
    description: 'Perfect for exploring our AI capabilities.',
    price: '₹0',
    credits: '50 Credits',
    features: [
      '50 Credits on sign up',
      'Access to standard models',
      'Basic resolution',
      'Community support',
      'Features in development phase restricted',
    ],
    highlight: false,
    buttonVariant: 'secondary' as const,
    disabled: true,
    buttonText: 'Current Plan'
  },
  {
    id: 'pay-as-you-go',
    priceId: STRIPE_PRICES.PAY_AS_YOU_GO,
    name: 'Pay As You Go',
    description: 'No monthly commitment. All features unlocked.',
    price: '₹499',
    credits: '150 Credits',
    features: [
      '150 Credits instantly',
      'Unlock all Pro features',
      'Higher generation speed',
      'Commercial usage rights',
      'Priority access to new tools',
    ],
    highlight: true,
    buttonVariant: 'primary' as const,
    buttonText: 'Buy 150 Credits'
  }
];

const CreditInfo = () => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full text-sm text-slate-600 flex flex-col justify-center">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm uppercase tracking-wide">
            <Icon name="info" className="w-4 h-4 mr-2 text-primary"/>
            Estimated Costs
        </h4>
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Standard Generation</span> 
                <span className="font-bold text-slate-900">1 Credit</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Batch Processing (per image)</span> 
                <span className="font-bold text-slate-900">1 Credit</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Background Removal Pro</span> 
                <span className="font-bold text-slate-900">2 Credits</span>
            </div>
        </div>
    </div>
);

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
      if (priceId === 'free') return;
      if (!isOnline) {
          alert("You are offline. Cannot initiate payment.");
          return;
      }
      if (loadingPriceId) return;
      setLoadingPriceId(priceId);
      try {
          await paymentService.createCheckoutSession(priceId);
      } catch (e) {
          console.error(e);
          alert(e instanceof Error ? e.message : 'Checkout failed');
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-10">
          <Icon name="close" className="w-5 h-5"/>
        </button>
        
        <main className="p-6 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <div className="text-center mb-10">
            <span className="inline-block bg-accent-green/10 text-accent-green text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide underline underline-offset-4 decoration-skip-ink-auto">Flexible Credits</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
              Choose your Growth Plan
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
                No monthly subscriptions. Buy credits when you need them or start for free. All Pro features are unlocked with any credit purchase.
            </p>
          </div>

          {!isOnline && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-10 max-w-3xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative bg-white p-6 rounded-2xl border ${plan.highlight ? 'border-primary shadow-xl ring-1 ring-primary scale-[1.05] z-10' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'} flex flex-col transition-all duration-200`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-widest whitespace-nowrap">
                    Best Value
                  </div>
                )}
                <div className="mb-5">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{plan.description}</p>
                </div>
                
                <div className="mb-6 flex items-baseline">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 font-medium text-sm ml-1">one-time</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100 flex items-center justify-center">
                    <Icon name="sparkles" className="w-5 h-5 mr-3 text-primary animate-pulse" />
                    <span className="text-lg font-black text-slate-800">{plan.credits}</span>
                </div>

                <ul className="space-y-3 text-sm text-slate-600 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="check-circle" className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-slate-400'}`} />
                      <span className={plan.highlight ? 'font-medium text-slate-700' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant} 
                    fullWidth 
                    className={`!py-3 !text-sm font-bold uppercase tracking-wider ${plan.highlight ? 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30' : ''}`}
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={(!isOnline && plan.id !== 'free') || loadingPriceId !== null}
                  >
                    {loadingPriceId === plan.priceId ? <Spinner /> : plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto">
             <CreditInfo />
          </div>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;
