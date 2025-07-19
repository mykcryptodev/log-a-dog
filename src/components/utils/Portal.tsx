import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useMounted from "~/hooks/useMounted";

interface PortalProps {
  children: ReactNode;
}

export const Portal = (props: PortalProps) => {
  const ref = useRef<Element | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      ref.current = document.querySelector<HTMLElement>("#portal");
    }
  }, [mounted]);

  return mounted && ref.current
    ? createPortal(<div>{props.children}</div>, ref.current)
    : null;
};
