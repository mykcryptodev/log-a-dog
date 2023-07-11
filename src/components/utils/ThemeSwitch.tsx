import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { type FC,useEffect, useState } from 'react';

interface Props {
  toggle?: boolean;
}

const ThemeSwitch: FC<Props> = ({ toggle }) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, []);

  if (!mounted) {
    return null
  }

  if (toggle) {
    return (
      <input 
        type="checkbox" 
        className="toggle toggle-lg" checked={theme === "light"}
        onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
    )
  }

  return (
    <div className="mx-auto w-full justify-center flex">
      <label className="swap swap-rotate">
        <input type="checkbox" checked={theme === "light"} onChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
        <SunIcon className="swap-on w-10 h-10 stroke-2" />
        <MoonIcon className="swap-off w-10 h-10 stroke-2" />
      </label>
    </div>
  )
}

export default ThemeSwitch;