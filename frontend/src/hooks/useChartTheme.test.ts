import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartTheme } from './useChartTheme';

test('incrementa themeKey al cambiar data-theme en <html>', async () => {
  const { result } = renderHook(() => useChartTheme());
  const k0 = result.current.themeKey;
  act(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await waitFor(() => expect(result.current.themeKey).not.toBe(k0));
  document.documentElement.removeAttribute('data-theme');
});
