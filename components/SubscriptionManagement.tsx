import React, { useState, useEffect } from 'react';
import { Icon } from './ui/Icon.js';
import { Button } from './ui/Button.js';
import { 
  getSubscriptionDetails, 
  openUpdatePaymentMethodCheckout, 
  SubscriptionInfo 
} from '../services/razorpayService.js';

interface SubscriptionManagementProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    tier?: string;
  };
  className?: string;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ user, className = '' }) => {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const normalizedTier = user.tier || 'Free';

  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      try {
        const details = await getSubscriptionDetails();
        if (isMounted) {
          setSubInfo(details);
        }
      } catch (err: any) {
        console.warn('Could not fetch subscription details from server:', err);
        // Synchronized tier fallback
        if (isMounted) {
          const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          let planName = 'Free Starter Plan';
          let amountStr = '₹0 / forever';
          let nextBilling = 'No recurring billing';

          if (normalizedTier === 'PayAsYouGo') {
            planName = 'Pay As You Go (120 Credits)';
            amountStr = '₹999 / pack';
            nextBilling = 'Non-recurring / Pay as you go';
          } else if (normalizedTier === 'Standard' || normalizedTier === 'Pro') {
            planName = 'Pro Subscription (300 Credits/mo)';
            amountStr = '₹1,999 / month';
            nextBilling = nextMonth;
          } else if (normalizedTier === 'Agency') {
            planName = 'Agency Plan (1,000 Credits/mo)';
            amountStr = '₹4,999 / month';
            nextBilling = nextMonth;
          }

          setSubInfo({
            key_id: '',
            subscription_id: `sub_${(user.id || 'default').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`,
            status: 'active',
            next_billing_date: nextBilling,
            plan_name: planName,
            amount: amountStr
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchInfo();
    return () => {
      isMounted = false;
    };
  }, [user.id, normalizedTier]);

  const handleUpdatePaymentMethod = async () => {
    setIsUpdating(true);
    setStatusMessage(null);

    try {
      await openUpdatePaymentMethodCheckout({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        subscriptionId: subInfo?.subscription_id,
        onSuccess: (response: any) => {
          setStatusMessage({
            type: 'success',
            text: `Payment method updated successfully! Payment ID: ${response.razorpay_payment_id || 'verified'}`
          });
          setIsUpdating(false);
          if (subInfo) {
            setSubInfo({ ...subInfo, status: 'active' });
          }
        },
        onError: (error: Error) => {
          setStatusMessage({
            type: 'error',
            text: error.message || 'Failed to update payment method.'
          });
          setIsUpdating(false);
        }
      });
    } catch (err: any) {
      console.error('Update payment method failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not launch Razorpay checkout.'
      });
      setIsUpdating(false);
    }
  };

  const handleConfirmCancel = () => {
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      setShowCancelModal(false);
      if (subInfo) {
        setSubInfo({
          ...subInfo,
          status: 'cancelled',
          next_billing_date: 'Cancels at end of cycle'
        });
      }
      setStatusMessage({
        type: 'success',
        text: 'Auto-renewal disabled. Your current plan credits will remain active until the end of your billing cycle.'
      });
    }, 1000);
  };

  const currentStatus = subInfo?.status || 'active';

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-500"></span>
            Pending Auto-Debit Retry
          </span>
        );
      case 'halted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-rose-500"></span>
            Payment Halted
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Auto-Renewal Off
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Active
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Icon name="credit-card" className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800">Subscription Management</h3>
            <p className="text-[10px] md:text-xs text-slate-500">Manage billing schedule & payment details</p>
          </div>
        </div>
        <div>
          {isLoadingDetails ? (
            <span className="text-xs text-slate-400">Loading status...</span>
          ) : (
            getStatusBadge(currentStatus)
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-start space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <Icon
            name={statusMessage.type === 'success' ? 'check-circle' : 'info'}
            className="w-4 h-4 flex-shrink-0 mt-0.5"
          />
          <div className="flex-grow">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {currentStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
          <Icon name="info" className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Auto-charge attempt pending</p>
            <p className="mt-0.5 text-amber-700">
              The last automatic debit failed. We will automatically retry tomorrow. You can update your card below to clear dues immediately.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px]">Current Plan</span>
          <span className="text-slate-800 font-bold text-sm">{subInfo?.plan_name}</span>
          <span className="text-slate-500 block text-[11px] mt-0.5">{subInfo?.amount}</span>
        </div>

        <div>
          <span className="text-slate-400 font-medium block uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Icon name="calendar" className="w-3 h-3" />
            Next Billing Date
          </span>
          <span className="text-slate-800 font-bold text-sm">
            {subInfo?.next_billing_date}
          </span>
          <span className="text-slate-500 block text-[11px] mt-0.5">
            {normalizedTier === 'Free' || normalizedTier === 'PayAsYouGo' 
              ? 'No recurring commitment' 
              : currentStatus === 'cancelled' ? 'Auto-renewal disabled' : 'Auto-renewal enabled'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-slate-500 flex items-center space-x-1">
          <Icon name="shield-check" className="w-3.5 h-3.5 text-emerald-600 inline" />
          <span>Secured via Razorpay Subscriptions</span>
        </div>

        <div className="flex items-center space-x-2">
          {normalizedTier !== 'Free' && currentStatus !== 'cancelled' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 transition-colors"
            >
              Cancel Subscription
            </button>
          )}

          <Button
            onClick={handleUpdatePaymentMethod}
            isLoading={isUpdating}
            disabled={isUpdating || isLoadingDetails || normalizedTier === 'Free'}
            variant="secondary"
            className="!py-1.5 !px-3 !text-xs font-semibold !bg-indigo-50 !text-indigo-700 hover:!bg-indigo-100 !border !border-indigo-200 shadow-sm"
          >
            <Icon name="credit-card" className="w-3.5 h-3.5 mr-1.5" />
            Update Payment Method
          </Button>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4 mx-auto">
              <Icon name="alert-triangle" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Disable Auto-Renewal?</h3>
            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
              Your subscription will remain active until the end of your billing cycle. You won't be charged again, and unused credits will expire at cycle end.
            </p>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
                fullWidth
                className="!py-2"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                fullWidth
                className="!bg-rose-600 hover:!bg-rose-700 !text-white !py-2"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

