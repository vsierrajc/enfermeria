import type { Config } from 'tailwindcss';
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
        border: 'var(--border)', 'border-strong': 'var(--border-strong)',
        text: 'var(--text)', muted: 'var(--muted)', faint: 'var(--faint)',
        accent: 'var(--accent)', 'accent-strong': 'var(--accent-strong)', 'accent-soft': 'var(--accent-soft)',
        ok: 'var(--ok)', 'ok-soft': 'var(--ok-soft)', warn: 'var(--warn)', 'warn-soft': 'var(--warn-soft)',
        crit: 'var(--crit)', 'crit-soft': 'var(--crit-soft)',
      },
      borderRadius: { DEFAULT: 'var(--radius)', sm: 'var(--radius-sm)' },
      boxShadow: { sm: 'var(--shadow-sm)', DEFAULT: 'var(--shadow)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
