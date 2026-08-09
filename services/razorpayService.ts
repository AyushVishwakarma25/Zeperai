import { supabase } from './supabaseClient';

export interface SubscriptionInfo {
  key_id: string;
  subscription_id: string;
  status: 'active' | 'pending' | 'halted' | 'cancelled';
  next_billing_date: string;
  plan_name: string;
  amount: string;
}

export interface CreateOrderParams {
  planId: string;
  amount: number;
  currency?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId?: string;
  amount?: number;
}

export interface CheckoutOptions {
  planId: string;
  planName: string;
  amount: number;
  creditsText?: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
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

export const createRazorpayOrder = async (params: CreateOrderParams) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const res = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      planId: params.planId,
      amount: params.amount,
      currency: params.currency || 'INR',
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || errBody.error || 'Failed to create Razorpay order.');
  }

  return await res.json();
};

export const verifyRazorpayPayment = async (params: VerifyPaymentParams) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  const res = await fetch('/api/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || errBody.error || 'Payment verification failed.');
  }

  return await res.json();
};

export const openCheckout = async (options: CheckoutOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
  }

  const orderData = await createRazorpayOrder({
    planId: options.planId,
    amount: options.amount
  });

  const { order, key_id } = orderData;
  if (!key_id) {
    throw new Error('Razorpay Key ID is missing from server response.');
  }

  const rzpOptions = {
    key: key_id,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'ZeperAI Studio',
    description: `${options.planName} ${options.creditsText ? `(${options.creditsText})` : ''}`,
    order_id: order.id,
    prefill: {
      name: options.userName || '',
      email: options.userEmail || '',
      contact: ''
    },
    theme: {
      color: '#4452FB'
    },
    handler: async function (response: any) {
      try {
        const verifyResult = await verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planId: options.planId,
          amount: options.amount
        });
        if (options.onSuccess) {
          options.onSuccess(verifyResult);
        }
      } catch (err: any) {
        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(err.message || 'Verification error'));
        }
      }
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      }
    }
  };

  const rzp = new (window as any).Razorpay(rzpOptions);
  rzp.on('payment.failed', function (response: any) {
    const err = new Error(response.error?.description || 'Payment failed.');
    if (options.onError) {
      options.onError(err);
    }
  });

  rzp.open();
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
    subscription_card_change: true,
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

