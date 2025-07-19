import { useMemo } from 'react';

const useIsOnMobileSafari = () => {
  const isOnMobileSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    return iOSSafari;
  }, []);

  return {
    isOnMobileSafari,
  };
};

export default useIsOnMobileSafari;