import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pacientesService } from '../api/pacientes.service';
import { createPdf, addHeader, addFooter, drawTable, drawLabelValue, formatDate } from '../utils/pdf';
import type { Paciente } from '../types';

const PacienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'datos' | 'controles' | 'recetas' | 'remisiones'>('datos');

  useEffect(() => {
    loadPaciente();
  }, [id]);

  const loadPaciente = async () => {
    try {
      const data = await pacientesService.findOne(Number(id));
      setPaciente(data);
    } catch (error) {
      toast.error('Error al cargar paciente');
      navigate('/pacientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (!paciente) return null;

  const generateHistoriaClinica = () => {
    const doc = createPdf('Historia Clinica');
    let y = addHeader(doc, 'Historia Clinica', `${paciente.nombre} ${paciente.apellido} - DNI: ${paciente.dni}`);

    addFooter(doc, 1);

    drawLabelValue(doc, 14, y, 'Nombre:', `${paciente.nombre} ${paciente.apellido}`);
    drawLabelValue(doc, 14, y + 5, 'DNI:', paciente.dni);
    drawLabelValue(doc, 14, y + 10, 'Fecha Nacimiento:', formatDate(paciente.fechaNacimiento));
    drawLabelValue(doc, 110, y, 'Departamento:', paciente.departamento || '-');
    drawLabelValue(doc, 110, y + 5, 'Puesto:', paciente.puesto || '-');
    drawLabelValue(doc, 110, y + 10, 'Telefono:', paciente.telefono || '-');
    drawLabelValue(doc, 14, y + 15, 'Email:', paciente.email || '-');
    drawLabelValue(doc, 14, y + 20, 'Contacto Emergencia:', paciente.contactoEmergencia || '-');
    drawLabelValue(doc, 14, y + 25, 'Alergias:', paciente.alergias || 'Ninguna');

    y += 35;

    if (paciente.controles && paciente.controles.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Controles', 14, y);
      y += 3;

      const controlesBody = paciente.controles.map((c) => [
        formatDate(c.fecha),
        c.tipo,
        `${c.enfermera?.nombre || ''} ${c.enfermera?.apellido || ''}`.trim(),
        `${c.presionSistolica || '-'}/${c.presionDiastolica || '-'}`,
        `${c.temperatura || '-'} C`,
        `${c.pulso || '-'}`,
        `${c.saturacionO2 || '-'}%`,
      ]);
      y = drawTable(doc, y, [['Fecha', 'Tipo', 'Enfermera', 'Presion', 'Temp.', 'Pulso', 'O2']], controlesBody);
      y += 5;
    }

    if (paciente.recetas && paciente.recetas.length > 0) {
      if (y > 220) { doc.addPage(); addFooter(doc, 2); y = 35; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recetas', 14, y);
      y += 3;

      const recetasBody = paciente.recetas.map((r) => [
        r.medicamento?.nombre || '-',
        r.dosis,
        r.frecuencia,
        formatDate(r.fechaInicio),
        formatDate(r.fechaFin),
        r.medico,
      ]);
      y = drawTable(doc, y, [['Medicamento', 'Dosis', 'Frecuencia', 'Inicio', 'Fin', 'Medico']], recetasBody);
      y += 5;
    }

    if (paciente.remisiones && paciente.remisiones.length > 0) {
      if (y > 220) { doc.addPage(); addFooter(doc, 2); y = 35; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Remisiones', 14, y);
      y += 3;

      const remisionesBody = paciente.remisiones.map((r) => [
        formatDate(r.fechaRemision),
        r.tipo,
        r.destino,
        r.motivo,
        r.estado,
      ]);
      y = drawTable(doc, y, [['Fecha', 'Tipo', 'Destino', 'Motivo', 'Estado']], remisionesBody);
    }

    doc.save(`historia_clinica_${paciente.dni}.pdf`);
    toast.success('PDF generado');
  };

  const tabs = [
    { key: 'datos', label: 'Datos Personales' },
    { key: 'controles', label: `Controles (${paciente.controles?.length || 0})` },
    { key: 'recetas', label: `Recetas (${paciente.recetas?.length || 0})` },
    { key: 'remisiones', label: `Remisiones (${paciente.remisiones?.length || 0})` },
  ];

  const tipoColors: Record<string, string> = {
    RUTINARIO: '#48bb78', URGENTE: '#e53e3e', SEGUIMIENTO: '#ed8936',
    INGRESO: '#4299e1', PERIODICO: '#9f7aea',
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: '#ed8936', EN_CURSO: '#4299e1', FINALIZADO: '#48bb78',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/pacientes')} style={{ padding: '8px 16px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          ← Volver
        </button>
        <button onClick={generateHistoriaClinica} style={{ padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          PDF Historia Clinica
        </button>
      </div>

      {paciente.alergias && (
        <div style={{ padding: '12px 16px', background: '#fed7d7', color: '#c53030', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
          ⚠️ ALERTA ALERGIAS: {paciente.alergias}
        </div>
      )}

      <h1 style={{ margin: '0 0 24px', color: '#2d3748' }}>{paciente.nombre} {paciente.apellido}</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 20px', border: 'none', background: 'transparent',
              borderBottom: activeTab === tab.key ? '2px solid #4299e1' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#4299e1' : '#718096',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'datos' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'DNI', value: paciente.dni },
              { label: 'Nombre', value: paciente.nombre },
              { label: 'Apellido', value: paciente.apellido },
              { label: 'Fecha Nacimiento', value: paciente.fechaNacimiento?.split('T')[0] || '-' },
              { label: 'Departamento', value: paciente.departamento || '-' },
              { label: 'Puesto', value: paciente.puesto || '-' },
              { label: 'Fecha Ingreso', value: paciente.fechaIngreso?.split('T')[0] || '-' },
              { label: 'Teléfono', value: paciente.telefono || '-' },
              { label: 'Email', value: paciente.email || '-' },
              { label: 'Contacto Emergencia', value: paciente.contactoEmergencia || '-' },
              { label: 'Alergias', value: paciente.alergias || 'Ninguna' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'controles' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {(!paciente.controles || paciente.controles.length === 0) ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Sin controles registrados</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  {['Fecha', 'Tipo', 'Enfermera', 'Presión', 'Temp.', 'Pulso', 'O2', 'Observaciones'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paciente.controles.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px 16px' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', background: tipoColors[c.tipo] + '20', color: tipoColors[c.tipo], borderRadius: 4, fontSize: '0.8rem' }}>
                        {c.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{c.enfermera?.nombre} {c.enfermera?.apellido}</td>
                    <td style={{ padding: '12px 16px' }}>{c.presionSistolica}/{c.presionDiastolica}</td>
                    <td style={{ padding: '12px 16px' }}>{c.temperatura}°C</td>
                    <td style={{ padding: '12px 16px' }}>{c.pulso}</td>
                    <td style={{ padding: '12px 16px' }}>{c.saturacionO2}%</td>
                    <td style={{ padding: '12px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'recetas' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {(!paciente.recetas || paciente.recetas.length === 0) ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Sin recetas registradas</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  {['Medicamento', 'Dosis', 'Frecuencia', 'Inicio', 'Fin', 'Médico', 'Observaciones'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paciente.recetas.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px 16px' }}>{r.medicamento?.nombre}</td>
                    <td style={{ padding: '12px 16px' }}>{r.dosis}</td>
                    <td style={{ padding: '12px 16px' }}>{r.frecuencia}</td>
                    <td style={{ padding: '12px 16px' }}>{r.fechaInicio.split('T')[0]}</td>
                    <td style={{ padding: '12px 16px' }}>{r.fechaFin.split('T')[0]}</td>
                    <td style={{ padding: '12px 16px' }}>{r.medico}</td>
                    <td style={{ padding: '12px 16px' }}>{r.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'remisiones' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {(!paciente.remisiones || paciente.remisiones.length === 0) ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Sin remisiones registradas</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#edf2f7' }}>
                  {['Fecha', 'Tipo', 'Destino', 'Motivo', 'Estado', 'Observaciones'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paciente.remisiones.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px 16px' }}>{r.fechaRemision.split('T')[0]}</td>
                    <td style={{ padding: '12px 16px' }}>{r.tipo}</td>
                    <td style={{ padding: '12px 16px' }}>{r.destino}</td>
                    <td style={{ padding: '12px 16px' }}>{r.motivo}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', background: estadoColors[r.estado] + '20', color: estadoColors[r.estado], borderRadius: 4, fontSize: '0.8rem' }}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{r.observaciones || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PacienteDetailPage;
