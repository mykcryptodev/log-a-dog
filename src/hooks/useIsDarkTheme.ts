import { useTheme } from 'next-themes';

const useIsDarkTheme = () => {
  const { theme } = useTheme();
  return theme === 'dark';
}

export default useIsDarkTheme;