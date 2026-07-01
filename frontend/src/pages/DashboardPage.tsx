import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Line, Doughnut } from 'react-chartjs-2';
import { estadisticasService } from '../api/estadisticas.service';
import type { EstadisticasResumen, ControlesPorMes } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const DashboardPage: React.FC = () => {
  const [resumen, setResumen] = useState<EstadisticasResumen | null>(null);
  const [controlesPorMes, setControlesPorMes] = useState<ControlesPorMes[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resumenData, mesData] = await Promise.all([
        estadisticasService.getResumen(),
        estadisticasService.getControlesPorMes(),
      ]);
      setResumen(resumenData);
      setControlesPorMes(mesData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>;
  }

  const kpiCards = [
    { label: 'Pacientes Activos', value: resumen?.totalPacientes || 0, color: '#4299e1', icon: '👥' },
    { label: 'Controles Totales', value: resumen?.totalControles || 0, color: '#48bb78', icon: '🩺' },
    { label: 'Recetas Activas', value: resumen?.totalRecetas || 0, color: '#ed8936', icon: '💊' },
    { label: 'Remisiones', value: resumen?.totalRemisiones || 0, color: '#9f7aea', icon: '📋' },
  ];

  const controlesChartData = {
    labels: controlesPorMes.map((c) => c.mes),
    datasets: [
      {
        label: 'Controles por Mes',
        data: controlesPorMes.map((c) => c.cantidad),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const tipoColors = ['#4299e1', '#48bb78', '#ed8936', '#e53e3e', '#9f7aea'];
  const tipoData = {
    labels: resumen?.controlesPorTipo.map((c) => c.tipo) || [],
    datasets: [
      {
        data: resumen?.controlesPorTipo.map((c) => c.cantidad) || [],
        backgroundColor: tipoColors.slice(0, resumen?.controlesPorTipo.length || 0),
      },
    ],
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 30px', color: '#2d3748' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        {kpiCards.map((card) => (
          <div
            key={card.label}
            onClick={() => {
              if (card.label.includes('Pacientes')) navigate('/pacientes');
              if (card.label.includes('Controles')) navigate('/controles');
              if (card.label.includes('Recetas')) navigate('/recetas');
              if (card.label.includes('Remisiones')) navigate('/remisiones');
            }}
            style={{
              background: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>{card.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2d3748' }}>{card.value}</div>
              </div>
              <span style={{ fontSize: '2rem' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px', color: '#2d3748' }}>Controles por Mes</h3>
          {controlesPorMes.length > 0 ? (
            <Line data={controlesChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : (
            <p style={{ color: '#718096', textAlign: 'center', padding: 40 }}>Sin datos disponibles</p>
          )}
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px', color: '#2d3748' }}>Controles por Tipo</h3>
          {resumen?.controlesPorTipo && resumen.controlesPorTipo.length > 0 ? (
            <Doughnut
              data={tipoData}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          ) : (
            <p style={{ color: '#718096', textAlign: 'center', padding: 40 }}>Sin datos disponibles</p>
          )}
        </div>
      </div>

      {resumen?.topPaciente && (
        <div
          style={{
            marginTop: 20,
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 10px', color: '#2d3748' }}>Paciente Más Atendido</h3>
          <p style={{ margin: 0, color: '#4a5568' }}>
            <strong>{resumen.topPaciente.nombre} {resumen.topPaciente.apellido}</strong> — DNI: {resumen.topPaciente.dni}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
