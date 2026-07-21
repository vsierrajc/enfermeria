import './registerChart';
import { Line } from 'react-chartjs-2';
import { useChartTheme } from '../../hooks/useChartTheme';
import { cn } from '../../lib/cn';

type LineDataset = {
  label: string;
  data: number[];
};

type Props = {
  labels: string[];
  datasets: LineDataset[];
  className?: string;
};

/** Line chart tematizado: colores por tokens, redibujo al cambiar tema. */
export function LineChart({ labels, datasets, className }: Props) {
  const { themeKey, colors, options } = useChartTheme();

  const data = {
    labels,
    datasets: datasets.map((ds, i) => {
      const color = colors.series[i % colors.series.length];
      return {
        label: ds.label,
        data: ds.data,
        fill: true,
        backgroundColor: `${color}22`,
        borderColor: color,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      };
    }),
  };

  return (
    <div className={cn('h-64 w-full', className)}>
      <Line key={themeKey} data={data} options={options} />
    </div>
  );
}
