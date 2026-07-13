import { useEffect, useState } from 'react';
import { chartColors, baseOptions } from '../lib/chartTheme';

export function useChartTheme() {
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => obs.disconnect();
  }, []);

  const colors = chartColors();
  return { themeKey, colors, options: baseOptions(colors) };
}
