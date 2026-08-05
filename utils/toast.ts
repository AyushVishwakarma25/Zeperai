/**
 * Client-Side Toast Notification Dispatcher
 * Dispatches a custom window event that App.tsx listens to,
 * presenting a user-friendly, non-technical notification toast.
 */
export function showToast(message: string, type: 'success' | 'error' = 'error') {
  if (typeof window !== 'undefined') {
    const safeMsg = message && typeof message === 'string' && !message.includes('at ') && !message.includes('node_modules')
      ? message
      : 'Oops! Something went wrong. Please try again.';
      
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message: safeMsg, type }
    }));
  }
}
