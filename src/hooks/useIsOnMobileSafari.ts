import { useEffect, useMemo, useState } from 'react';

const useIsOnMobileSafari = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  const isOnMobileSafari = useMemo(() => {
    if (!isMounted) return false;
    const ua = navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    return iOSSafari;
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return {
    isOnMobileSafari,
  }
}

export default useIsOnMobileSafari;