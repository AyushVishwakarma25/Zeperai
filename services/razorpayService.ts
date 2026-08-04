import { supabase } from './supabaseClient';

export interface SubscriptionInfo {
  key_id: string;
  subscription_id: string;
  status: 'active' | 'pending' | 'halted' | 'cancelled';
  next_billing_date: string;
  plan_name: string;
  amount: string;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const getSubscriptionDetails = async (): Promise<SubscriptionInfo> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const res = await fetch('/api/razorpay/subscription-details', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch subscription info.');
  }

  return await res.json();
};

export interface UpdatePaymentMethodParams {
  user: {
    name?: string;
    email?: string;
    id?: string;
  };
  subscriptionId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

export const openUpdatePaymentMethodCheckout = async (params: UpdatePaymentMethodParams): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay payment script. Please check your network connection.');
  }

  const subInfo = await getSubscriptionDetails();
  const keyId = subInfo.key_id;
  const subscriptionId = params.subscriptionId || subInfo.subscription_id;

  if (!keyId) {
    throw new Error('Razorpay Key ID is not available.');
  }

  const options = {
    key: keyId,
    subscription_id: subscriptionId,
    name: 'ZeperAi Studio',
    description: 'Update Subscription Payment Method',
    subscription_card_change: true, // Key requirement according to Razorpay docs
    handler: function (response: any) {
      if (params.onSuccess) {
        params.onSuccess(response);
      }
    },
    prefill: {
      name: params.user.name || '',
      email: params.user.email || '',
      contact: ''
    },
    theme: {
      color: '#6366F1'
    },
    modal: {
      ondismiss: function () {
        console.log('Update payment method checkout closed');
      }
    }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', function (response: any) {
    const err = new Error(response.error?.description || 'Payment method update failed.');
    if (params.onError) {
      params.onError(err);
    }
  });

  rzp.open();
};
