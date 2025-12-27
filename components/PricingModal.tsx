
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { paymentService, STRIPE_PRICES } from '../services/paymentService';
import { Spinner } from './ui/Spinner';

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
    credits: '80 Credits / month',
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
    credits: '300 Credits / month',
    features: [
      '300 Credits monthly',
      'Unlock AI Copywriter ✍️',
      'Unlock Pro Models (Nano Banana)',
      '4K Smart Upscaling',
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
    credits: '1000 Credits / month',
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
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-6 text-sm text-slate-600">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center text-base">
            <Icon name="info" className="w-5 h-5 mr-2 text-primary"/>
            Credit Usage Guide
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>Standard Image (Flash)</span> 
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200">1 Credit</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>Pro Image (Nano Pro)</span> 
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200">4 Credits</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>AI Copywriting</span> 
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200">2 Credits</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span>4K Upscale</span> 
                <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-200">2 Credits</span>
            </div>
        </div>
    </div>
);

const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
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
        className="bg-main w-full max-w-6xl rounded-2xl shadow-xl flex flex-col overflow-hidden relative max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors z-10">
          <Icon name="close" className="w-6 h-6"/>
        </button>
        
        <main className="p-6 md:p-10 lg:p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <div className="text-center mb-10">
            <span className="inline-block bg-accent-green/10 text-accent-green text-sm font-semibold px-4 py-1 rounded-full mb-4">Launch Offer 🚀</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
              Unlock Professional <span className="text-primary">Creative Power</span>
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto">
                Scale your content production with flexible plans. Upgrade to Standard to unlock the AI Writer and Photorealistic Pro Models.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-8">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative bg-white p-6 rounded-2xl border ${plan.highlight ? 'border-primary shadow-glow-primary ring-1 ring-primary' : 'border-slate-200'} shadow-lg flex flex-col transition-transform hover:-translate-y-1`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full flex items-center shadow-md">
                    <Icon name="sparkles" className="w-3 h-3 mr-1.5" />
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-4 h-8">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 font-medium text-sm">/month</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 mb-6 text-center border border-slate-100 flex items-center justify-center">
                    <Icon name="stack" className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{plan.credits}</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="check-circle" className={`w-5 h-5 mr-3 flex-shrink-0 ${feature.includes('Unlock') ? 'text-primary' : 'text-accent-green'}`} />
                      <span className={feature.includes('Unlock') ? 'font-semibold text-slate-800' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button 
                    variant={plan.buttonVariant} 
                    fullWidth 
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={loadingPriceId !== null}
                  >
                    {loadingPriceId === plan.priceId ? <Spinner /> : `Choose ${plan.name}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2">
                <CreditInfo />
             </div>
             
             {/* Pay As You Go Section */}
             <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <h4 className="font-bold text-slate-800">Pay As You Go</h4>
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded">No Expiry</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 relative z-10">Need a quick top-up without a subscription? Add credits instantly.</p>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 relative z-10">
                    <span className="font-bold text-slate-700">25 Credits</span>
                    <span className="font-bold text-slate-900">₹200</span>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full text-xs relative z-10"
                    onClick={() => handleCheckout(STRIPE_PRICES.TOP_UP_25)}
                    disabled={loadingPriceId !== null}
                >
                    {loadingPriceId === STRIPE_PRICES.TOP_UP_25 ? <Spinner /> : 'Top Up Now'}
                </Button>
                
                {/* Decorative background icon */}
                <Icon name="sparkles" className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 group-hover:text-primary/5 transition-colors z-0" />
             </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;
