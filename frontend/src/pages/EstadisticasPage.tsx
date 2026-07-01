import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { estadisticasService } from '../api/estadisticas.service';
import type { EstadisticasResumen, ControlesPorMes, PresionPromedio } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const EstadisticasPage: React.FC = () => {
  const [resumen, setResumen] = useState<EstadisticasResumen | null>(null);
  const [controlesPorMes, setControlesPorMes] = useState<ControlesPorMes[]>([]);
  const [presionPromedio, setPresionPromedio] = useState<PresionPromedio | null>(null);
  const [controlesPorTipo, setControlesPorTipo] = useState<{ tipo: string; cantidad: number }[]>([]);
  const [remisionesPorEstado, setRemisionesPorEstado] = useState<{ estado: string; cantidad: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ desde: '', hasta: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const params: any = {};
      if (dateRange.desde) params.desde = dateRange.desde;
      if (dateRange.hasta) params.hasta = dateRange.hasta;

      const [r, m, p, t, re] = await Promise.all([
        estadisticasService.getResumen(params),
        estadisticasService.getControlesPorMes(),
        estadisticasService.getPresionPromedio(params),
        estadisticasService.getControlesPorTipo(),
        estadisticasService.getRemisionesPorEstado(),
      ]);
      setResumen(r);
      setControlesPorMes(m);
      setPresionPromedio(p);
      setControlesPorTipo(t);
      setRemisionesPorEstado(re);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleFilter = () => { loadAll(); };

  const tipoColors = ['#4299e1', '#48bb78', '#ed8936', '#e53e3e', '#9f7aea'];
  const estadoColors: Record<string, string> = {
    PENDIENTE: '#ed8936', EN_CURSO: '#4299e1', FINALIZADO: '#48bb78',
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', color: '#2d3748' }}>Estadísticas</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 30, alignItems: 'center' }}>
        <input type="date" value={dateRange.desde} onChange={(e) => setDateRange({ ...dateRange, desde: e.target.value })}
          style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: 6 }} />
        <span>a</span>
        <input type="date" value={dateRange.hasta} onChange={(e) => setDateRange({ ...dateRange, hasta: e.target.value })}
          style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: 6 }} />
        <button onClick={handleFilter} style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Filtrar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 30 }}>
        {[
          { label: 'Pacientes', value: resumen?.totalPacientes || 0, color: '#4299e1' },
          { label: 'Controles', value: resumen?.totalControles || 0, color: '#48bb78' },
          { label: 'Recetas', value: resumen?.totalRecetas || 0, color: '#ed8936' },
          { label: 'Remisiones', value: resumen?.totalRemisiones || 0, color: '#9f7aea' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${kpi.color}` }}>
            <div style={{ color: '#718096', fontSize: '0.85rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2d3748' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#2d3748' }}>Controles por Mes</h3>
          <Line
            data={{
              labels: controlesPorMes.map((c) => c.mes),
              datasets: [{ label: 'Controles', data: controlesPorMes.map((c) => c.cantidad), borderColor: '#4299e1', backgroundColor: 'rgba(66,153,225,0.1)', fill: true, tension: 0.4 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#2d3748' }}>Controles por Tipo</h3>
          <Doughnut
            data={{
              labels: controlesPorTipo.map((c) => c.tipo),
              datasets: [{ data: controlesPorTipo.map((c) => c.cantidad), backgroundColor: tipoColors }],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#2d3748' }}>Remisiones por Estado</h3>
          <Bar
            data={{
              labels: remisionesPorEstado.map((r) => r.estado),
              datasets: [{ label: 'Remisiones', data: remisionesPorEstado.map((r) => r.cantidad), backgroundColor: remisionesPorEstado.map((r) => estadoColors[r.estado] || '#718096') }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#2d3748' }}>Promedio Signos Vitales</h3>
          {presionPromedio && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'PA Sistólica', value: `${presionPromedio.promedioSistolica} mmHg`, icon: '💓' },
                { label: 'PA Diastólica', value: `${presionPromedio.promedioDiastolica} mmHg`, icon: '💓' },
                { label: 'Temperatura', value: `${presionPromedio.promedioTemperatura}°C`, icon: '🌡️' },
                { label: 'Pulso', value: `${presionPromedio.promedioPulso} lpm`, icon: '脈' },
                { label: 'Saturación O2', value: `${presionPromedio.promedioSaturacion}%`, icon: '🫁' },
              ].map((item) => (
                <div key={item.label} style={{ padding: 12, background: '#f7fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#2d3748' }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {resumen?.topPaciente && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', color: '#2d3748' }}>Paciente Más Atendido</h3>
          <p style={{ margin: 0, color: '#4a5568' }}>
            <strong>{resumen.topPaciente.nombre} {resumen.topPaciente.apellido}</strong> — DNI: {resumen.topPaciente.dni} — {resumen.topPaciente.departamento}
          </p>
        </div>
      )}
    </div>
  );
};

export default EstadisticasPage;
