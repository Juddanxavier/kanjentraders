/** @format */

'use client';

import { useTheme } from 'next-themes';
import { Button } from './button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Toggle theme'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      {isDark ? <span aria-hidden>🌙</span> : <span aria-hidden>☀️</span>}
    </Button>
  );
}
