import React from 'react';

export type SwipeToastCloseReason =
  | 'timeout'
  | 'swipe'
  | 'action'
  | 'close'
  | 'escape'
  | 'programmatic';

export interface SwipeToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  open?: boolean;
  onClose?: (reason: SwipeToastCloseReason) => void;
  background?: string;
  color?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: 'bottom' | 'top' | 'none';
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
}

export declare function SwipeToast(props: SwipeToastProps): React.JSX.Element;
export default SwipeToast;
