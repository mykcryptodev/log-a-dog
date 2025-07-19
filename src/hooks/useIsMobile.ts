import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Set initial value
    checkIsMobile();

    // Add event listener with throttling to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIsMobile, 250); // Throttle to 250ms
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  // Return false during SSR to prevent hydration mismatch
  return mounted ? isMobile : false;
};

export default useIsMobile;