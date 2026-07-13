import './registerChart';
import { Bar } from 'react-chartjs-2';
import { useChartTheme } from '../../hooks/useChartTheme';
import { cn } from '../../lib/cn';

type Props = {
  labels: string[];
  values: number[];
  className?: string;
};

/** Bar chart tematizado: color de serie por tokens, barras redondeadas. */
export function BarChart({ labels, values, className }: Props) {
  const { themeKey, colors, options } = useChartTheme();

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.series[0],
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  return (
    <div className={cn('h-64 w-full', className)}>
      <Bar key={themeKey} data={data} options={options} />
    </div>
  );
}
