import './registerChart';
import { Doughnut } from 'react-chartjs-2';
import { useChartTheme } from '../../hooks/useChartTheme';
import { cn } from '../../lib/cn';

type Props = {
  labels: string[];
  values: number[];
  className?: string;
};

/** Doughnut chart tematizado: paleta de series por tokens, sin ejes. */
export function DoughnutChart({ labels, values, className }: Props) {
  const { themeKey, colors, options } = useChartTheme();

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.series,
        borderColor: colors.surface,
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    ...options,
    scales: undefined,
  };

  return (
    <div className={cn('h-64 w-full', className)}>
      <Doughnut key={themeKey} data={data} options={doughnutOptions} />
    </div>
  );
}
