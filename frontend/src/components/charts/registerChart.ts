import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Registro único de los componentes de chart.js usados por los wrappers
// (Line/Doughnut/Bar). Importar este módulo garantiza que el registro
// ocurra una sola vez, sin importar cuántos wrappers se monten.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
