
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { payments, STRIPE_PRICES } from '../services/payments';
import { Spinner } from './ui/Spinner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface PricingModalProps {
  onClose: () => void;
}

const pricingPlans = [
  {
    id: 'starter',
    priceId: STRIPE_PRICES.STARTER,
    name: 'Starter',
    description: 'Essential tools for casual creators.',
    price: '₹499',
    credits: '80 Credits',
    features: [
      '80 Credits monthly',
      'Access to Flash Models ⚡',
      'Standard HD Resolution',
      'Basic Image Editing',
      'Commercial Usage Rights',
    ],
    highlight: false,
    buttonVariant: 'secondary' as const,
  },
  {
    id: 'standard',
    priceId: STRIPE_PRICES.STANDARD,
    name: 'Standard',
    description: 'Unlock Pro AI tools & higher quality.',
    price: '₹1,499',
    credits: '300 Credits',
    features: [
      '300 Credits monthly',
      'Unlock AI Copywriter ✍️',
      'Unlock Pro Models',
      'Priority Generation Speed',
    ],
    highlight: true,
    buttonVariant: 'primary' as const,
  },
  {
    id: 'agency',
    priceId: STRIPE_PRICES.AGENCY,
    name: 'Agency',
    description: 'Maximum volume for power users.',
    price: '₹3,999',
    credits: '1000 Credits',
    features: [
      '1000 Credits monthly',
      'All Pro Features Included',
      'Bulk Content Generation 🚀',
      'Unlimited Cloud Storage ☁️',
      'Early Access to Beta Models',
    ],
    highlight: false,
    buttonVariant: 'secondary' as const,
  },
];

const CreditInfo = () => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full text-sm text-slate-600 flex flex-col justify-center">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm uppercase tracking-wide">
            <Icon name="info" className="w-4 h-4 mr-2 text-primary"/>
            Credit Cost
        </h4>
        <div className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Standard Image</span> 
                <span className="font-bold text-slate-900">1 Credit</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>Pro Image (High Res)</span> 
                <span className="font-bold text-slate-900">4 Credits</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
                <span>AI Copywriting</span> 
                <span className="font-bold text-slate-900">2 Credits</span>
            </div>
        </div>
    </div>
);

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const isOnline = useNetworkStatus();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
      if (!isOnline) {
          alert("You are offline. Cannot initiate payment.");
          return;
      }
      if (loadingPriceId) return;
      setLoadingPriceId(priceId);
      try {
          await payments.createCheckoutSession(priceId);
      } catch (e) {
          console.error(e);
          alert(e instanceof Error ? e.message : 'Checkout failed');
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden relative max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-10">
          <Icon name="close" className="w-5 h-5"/>
        </button>
        
        <main className="p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <div className="text-center mb-8">
            <span className="inline-block bg-accent-green/10 text-accent-green text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">Launch Offer 🚀</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
              Unlock Creative Power
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Scale your content production with flexible plans. Upgrade to Standard to unlock the AI Writer and Photorealistic Pro Models.
            </p>
          </div>

          {!isOnline && (
              <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  You are currently offline. Payment features are unavailable.
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch mb-6">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative bg-white p-5 rounded-xl border ${plan.highlight ? 'border-primary shadow-lg ring-1 ring-primary scale-[1.02] z-10' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'} flex flex-col transition-all duration-200`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                    <p className="text-xs text-slate-500 h-8 line-clamp-2">{plan.description}</p>
                </div>
                
                <div className="mb-4 flex items-baseline">
                  <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 font-medium text-xs ml-1">/mo</span>
                </div>

                <div className="bg-slate-50 rounded-lg p-2 mb-4 text-center border border-slate-100 flex items-center justify-center">
                    <Icon name="stack" className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{plan.credits}</span>
                </div>

                <ul className="space-y-2 text-xs sm:text-sm text-slate-600 mb-6 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="check-circle" className={`w-4 h-4 mr-2 flex-shrink-0 ${feature.includes('Unlock') ? 'text-primary' : 'text-accent-green'}`} />
                      <span className={feature.includes('Unlock') ? 'font-semibold text-slate-800' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant} 
                    fullWidth 
                    className="!py-2 !text-sm"
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={!isOnline || loadingPriceId !== null}
                  >
                    {loadingPriceId === plan.priceId ? <Spinner /> : `Choose ${plan.name}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <CreditInfo />
             
             <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 flex flex-col justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <h4 className="font-bold text-slate-800 text-sm">Pay As You Go</h4>
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase tracking-wide">No Expiry</span>
                </div>
                <div className="flex items-center justify-between gap-4 mb-3 relative z-10">
                    <p className="text-xs text-slate-500">Instant top-up without subscription.</p>
                    <div className="text-right">
                        <span className="block font-bold text-slate-900 text-lg">₹200</span>
                        <span className="text-xs text-slate-500">25 Credits</span>
                    </div>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full !py-2 !text-xs relative z-10"
                    onClick={() => handleCheckout(STRIPE_PRICES.TOP_UP_25)}
                    disabled={!isOnline || loadingPriceId !== null}
                >
                    {loadingPriceId === STRIPE_PRICES.TOP_UP_25 ? <Spinner /> : 'Top Up Now'}
                </Button>
                
                <Icon name="sparkles" className="absolute -bottom-2 -right-2 w-16 h-16 text-slate-50 group-hover:text-primary/5 transition-colors z-0" />
             </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;
