import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode
}

export const Portal = ({ children }: PortalProps) => {
  const portalElement =
    typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('#portal')
      : null;

  return portalElement ? createPortal(<div>{children}</div>, portalElement) : null;
};