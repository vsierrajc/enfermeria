import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  values: number[];
  tone?: 'accent' | 'warn';
  themeKey?: string | number;
  className?: string;
};

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Mini gráfico de tendencia por canvas. Dibuja área + línea + punto final,
 * usando el color del tema activo (`--accent` o `--warn`). Se redibuja al
 * cambiar de tamaño y cuando cambia `themeKey` (p. ej. el tema claro/oscuro).
 */
export function Sparkline({ values, tone = 'accent', themeKey, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const cv = canvasRef.current;
      if (!cv || values.length === 0) return;

      const color = tone === 'warn' ? cssVar('--warn') : cssVar('--accent');
      const border = cssVar('--border');
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (w === 0 || h === 0) return;

      cv.width = w * dpr;
      cv.height = h * dpr;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const pad = 4;
      const rng = max - min || 1;
      const denom = Math.max(values.length - 1, 1);
      const x = (i: number) => pad + (i * (w - pad * 2)) / denom;
      const y = (v: number) => h - pad - ((v - min) / rng) * (h - pad * 2);

      // línea base
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - 1.5);
      ctx.lineTo(w, h - 1.5);
      ctx.stroke();

      // área
      ctx.beginPath();
      ctx.moveTo(x(0), y(values[0]));
      values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
      ctx.lineTo(x(values.length - 1), h);
      ctx.lineTo(x(0), h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `${color}33`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.fill();

      // línea
      ctx.beginPath();
      ctx.moveTo(x(0), y(values[0]));
      values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // punto final
      const lx = x(values.length - 1);
      const ly = y(values[values.length - 1]);
      ctx.beginPath();
      ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, tone, themeKey]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('block h-9 w-full', className)} />;
}
