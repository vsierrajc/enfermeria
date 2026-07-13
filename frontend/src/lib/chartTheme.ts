function v(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

export function chartColors() {
  const accent = v('--accent');
  const warn = v('--warn');
  const crit = v('--crit');
  const ok = v('--ok');
  const accentStrong = v('--accent-strong');
  const muted = v('--muted');
  return {
    accent,
    accentStrong,
    ok,
    warn,
    crit,
    muted,
    faint: v('--faint'),
    border: v('--border'),
    surface: v('--surface'),
    text: v('--text'),
    series: [accent, ok, warn, crit, accentStrong, muted],
  };
}

export type ChartColors = ReturnType<typeof chartColors>;

export function baseOptions(c: ChartColors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: c.muted, font: { family: 'Inter' } } },
      tooltip: {
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.text,
        bodyColor: c.muted,
      },
    },
    scales: {
      x: { grid: { color: c.border }, ticks: { color: c.faint } },
      y: { grid: { color: c.border }, ticks: { color: c.faint }, beginAtZero: true },
    },
  } as const;
}
