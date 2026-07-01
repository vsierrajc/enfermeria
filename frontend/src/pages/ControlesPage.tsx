import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { controlesService } from '../api/controles.service';
import { pacientesService } from '../api/pacientes.service';
import { enfermerasService } from '../api/enfermeras.service';
import { useAuth } from '../hooks/useAuth';
import { createPdf, addHeader, addFooter, drawTable, formatDateTime } from '../utils/pdf';
import type { Control, Paciente, Enfermera } from '../types';

const ControlesPage: React.FC = () => {
  const [controles, setControles] = useState<Control[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [enfermeras, setEnfermeras] = useState<Enfermera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const [filters, setFilters] = useState({ pacienteId: '', desde: '', hasta: '', tipo: '' });
  const [formData, setFormData] = useState({
    pacienteId: '', fecha: '', tipo: 'RUTINARIO',
    presionSistolica: '', presionDiastolica: '', temperatura: '', pulso: '',
    saturacionO2: '', peso: '', talla: '', motivo: '', observaciones: '',
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [c, p, e] = await Promise.all([
        controlesService.findAll(),
        pacientesService.findAll(),
        enfermerasService.findAll(),
      ]);
      setControles(c);
      setPacientes(p);
      setEnfermeras(e);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally { setLoading(false); }
  };

  const handleFilter = async () => {
    try {
      const params: any = {};
      if (filters.pacienteId) params.pacienteId = filters.pacienteId;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      if (filters.tipo) params.tipo = filters.tipo;
      const data = await controlesService.findAll(params);
      setControles(data);
    } catch (error) { toast.error('Error al filtrar'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        pacienteId: Number(formData.pacienteId),
        enfermeraId: user?.id,
        fecha: formData.fecha,
        tipo: formData.tipo,
      };
      if (formData.presionSistolica) payload.presionSistolica = Number(formData.presionSistolica);
      if (formData.presionDiastolica) payload.presionDiastolica = Number(formData.presionDiastolica);
      if (formData.temperatura) payload.temperatura = Number(formData.temperatura);
      if (formData.pulso) payload.pulso = Number(formData.pulso);
      if (formData.saturacionO2) payload.saturacionO2 = Number(formData.saturacionO2);
      if (formData.peso) payload.peso = Number(formData.peso);
      if (formData.talla) payload.talla = Number(formData.talla);
      if (formData.motivo) payload.motivo = formData.motivo;
      if (formData.observaciones) payload.observaciones = formData.observaciones;

      await controlesService.create(payload);
      toast.success('Control registrado');
      setShowModal(false);
      resetForm();
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este control?')) return;
    try {
      await controlesService.remove(id);
      toast.success('Control eliminado');
      loadAll();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const resetForm = () => {
    setFormData({
      pacienteId: '', fecha: '', tipo: 'RUTINARIO',
      presionSistolica: '', presionDiastolica: '', temperatura: '', pulso: '',
      saturacionO2: '', peso: '', talla: '', motivo: '', observaciones: '',
    });
  };

  const generatePdf = () => {
    const doc = createPdf('Reporte de Controles');
    const y = addHeader(doc, 'Reporte de Controles', `Total: ${controles.length} registros`);
    addFooter(doc, 1);

    const body = controles.map((c) => [
      formatDateTime(c.fecha),
      `${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''}`.trim(),
      `${c.enfermera?.nombre || ''}`,
      c.tipo,
      `${c.presionSistolica || '-'}/${c.presionDiastolica || '-'}`,
      `${c.temperatura || '-'} C`,
      `${c.pulso || '-'}`,
      `${c.saturacionO2 || '-'}%`,
    ]);

    drawTable(doc, y, [['Fecha', 'Paciente', 'Enfermera', 'Tipo', 'Presion', 'Temp.', 'Pulso', 'O2']], body);

    doc.save('controles.pdf');
    toast.success('PDF generado');
  };

  const tipoColors: Record<string, string> = {
    RUTINARIO: '#48bb78', URGENTE: '#e53e3e', SEGUIMIENTO: '#ed8936',
    INGRESO: '#4299e1', PERIODICO: '#9f7aea',
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Controles</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={generatePdf} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            PDF
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            + Nuevo Control
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })} style={{ ...inputStyle, width: 160 }}>
          <option value="">Todos los tipos</option>
          {['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} style={inputStyle} />
        <input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} style={inputStyle} />
        <button onClick={handleFilter} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Filtrar
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table style={{ width: '100%', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              {['Fecha', 'Paciente', 'Enfermera', 'Tipo', 'Presión', 'Temp.', 'Pulso', 'O2', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px 12px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {controles.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>{c.paciente?.nombre} {c.paciente?.apellido}</td>
                <td style={{ padding: '10px 12px' }}>{c.enfermera?.nombre}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', background: tipoColors[c.tipo] + '20', color: tipoColors[c.tipo], borderRadius: 4, fontSize: '0.8rem' }}>
                    {c.tipo}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>{c.presionSistolica}/{c.presionDiastolica}</td>
                <td style={{ padding: '10px 12px' }}>{c.temperatura}°</td>
                <td style={{ padding: '10px 12px' }}>{c.pulso}</td>
                <td style={{ padding: '10px 12px' }}>{c.saturacionO2}%</td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 8px', background: '#fed7d7', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 700, maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 20px' }}>Nuevo Control</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Paciente *</label>
                  <select required value={formData.pacienteId} onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Fecha y Hora *</label>
                  <input type="datetime-local" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Tipo *</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} style={inputStyle}>
                    {['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>PA Sistólica</label><input type="number" value={formData.presionSistolica} onChange={(e) => setFormData({ ...formData, presionSistolica: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>PA Diastólica</label><input type="number" value={formData.presionDiastolica} onChange={(e) => setFormData({ ...formData, presionDiastolica: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Temperatura</label><input type="number" step="0.1" value={formData.temperatura} onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Pulso</label><input type="number" value={formData.pulso} onChange={(e) => setFormData({ ...formData, pulso: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Saturación O2</label><input type="number" value={formData.saturacionO2} onChange={(e) => setFormData({ ...formData, saturacionO2: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Peso (kg)</label><input type="number" step="0.1" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Talla (cm)</label><input type="number" step="0.1" value={formData.talla} onChange={(e) => setFormData({ ...formData, talla: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Motivo</label><input value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Observaciones</label><textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlesPage;
