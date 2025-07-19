import { useMemo } from 'react';

const useIsOnMobileSafari = () => {
  const isOnMobileSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone/i.test(ua);
    const webkit = /WebKit/i.test(ua);
    const iOSSafari = iOS && webkit && !/CriOS/i.test(ua);
    return iOSSafari;
  }, []);

  return {
    isOnMobileSafari,
  }
}

export default useIsOnMobileSafari;