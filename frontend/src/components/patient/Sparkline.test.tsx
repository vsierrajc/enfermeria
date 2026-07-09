import { render, waitFor } from '@testing-library/react';
import { Sparkline } from './Sparkline';

test('redibuja el canvas cuando cambia el tema en <html>', async () => {
  // jsdom no implementa el contexto 2D del canvas; espiamos getContext para
  // contar cuántas veces se intenta dibujar.
  const ctxStub = {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineJoin: '',
  };
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(ctxStub as unknown as CanvasRenderingContext2D);
  // clientWidth/clientHeight son 0 en jsdom; forzamos un tamaño para que dibuje.
  const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 120 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 34 });

  const { unmount } = render(<Sparkline values={[118, 122, 120, 126, 124, 128]} tone="accent" />);

  await waitFor(() => expect(getContext).toHaveBeenCalled());
  const initialCalls = getContext.mock.calls.length;

  // Alterna el tema como lo hace el toggle real del AppShell.
  document.documentElement.setAttribute('data-theme', 'dark');

  await waitFor(() => expect(getContext.mock.calls.length).toBeGreaterThan(initialCalls));

  // Desmonta (desconecta el observer) antes de restaurar los mocks para evitar
  // que un callback tardío llame al getContext real de jsdom (no implementado).
  unmount();
  document.documentElement.removeAttribute('data-theme');
  getContext.mockRestore();
  if (widthDesc) Object.defineProperty(HTMLElement.prototype, 'clientWidth', widthDesc);
  if (heightDesc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', heightDesc);
});
