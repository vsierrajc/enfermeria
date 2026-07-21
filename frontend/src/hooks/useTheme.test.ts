import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

test('alterna el tema y lo escribe en <html>', () => {
  const { result } = renderHook(() => useTheme());
  const inicial = result.current.theme;
  act(() => result.current.toggle());
  expect(result.current.theme).not.toBe(inicial);
  expect(document.documentElement.getAttribute('data-theme')).toBe(result.current.theme);
});
