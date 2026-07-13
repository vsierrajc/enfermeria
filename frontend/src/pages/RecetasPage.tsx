import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { recetasService } from '../api/recetas.service';
import { pacientesService } from '../api/pacientes.service';
import { medicamentosService } from '../api/medicamentos.service';
import { useAuth } from '../hooks/useAuth';
import type { Receta, Paciente, Medicamento } from '../types';

const RecetasPage: React.FC = () => {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const [filters, setFilters] = useState({ pacienteId: '', desde: '', hasta: '' });
  const [formData, setFormData] = useState({
    pacienteId: '', medicamentoId: '', dosis: '', frecuencia: '',
    duracionDias: 7, fechaInicio: '', fechaFin: '', medico: '', observaciones: '',
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [r, p, m] = await Promise.all([
        recetasService.findAll(),
        pacientesService.findAll(),
        medicamentosService.findAll(),
      ]);
      setRecetas(r.items);
      setPacientes(p.items);
      setMedicamentos(m);
    } catch (error) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const handleFilter = async () => {
    try {
      const params: any = {};
      if (filters.pacienteId) params.pacienteId = filters.pacienteId;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      const data = await recetasService.findAll(params);
      setRecetas(data.items);
    } catch (error) { toast.error('Error al filtrar'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recetasService.create({
        pacienteId: Number(formData.pacienteId),
        medicamentoId: Number(formData.medicamentoId),
        dosis: formData.dosis,
        frecuencia: formData.frecuencia,
        duracionDias: formData.duracionDias,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        medico: formData.medico,
        observaciones: formData.observaciones || undefined,
      });
      toast.success('Receta creada');
      setShowModal(false);
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    try {
      await recetasService.remove(id);
      toast.success('Receta eliminada');
      loadAll();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Recetas</h1>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#48bb78', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          + Nueva Receta
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} style={inputStyle} />
        <input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} style={inputStyle} />
        <button onClick={handleFilter} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Filtrar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table style={{ width: '100%', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              {['Paciente', 'Medicamento', 'Dosis', 'Frecuencia', 'Inicio', 'Fin', 'Médico', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recetas.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '12px' }}>{r.paciente?.nombre} {r.paciente?.apellido}</td>
                <td style={{ padding: '12px' }}>{r.medicamento?.nombre}</td>
                <td style={{ padding: '12px' }}>{r.dosis}</td>
                <td style={{ padding: '12px' }}>{r.frecuencia}</td>
                <td style={{ padding: '12px' }}>{r.fechaInicio.split('T')[0]}</td>
                <td style={{ padding: '12px' }}>{r.fechaFin.split('T')[0]}</td>
                <td style={{ padding: '12px' }}>{r.medico}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 8px', background: '#fed7d7', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 20px' }}>Nueva Receta</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Paciente *</label>
                  <select required value={formData.pacienteId} onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Medicamento *</label>
                  <select required value={formData.medicamentoId} onChange={(e) => setFormData({ ...formData, medicamentoId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Dosis *</label><input required value={formData.dosis} onChange={(e) => setFormData({ ...formData, dosis: e.target.value })} placeholder="ej: 500 mg" style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Frecuencia *</label><input required value={formData.frecuencia} onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })} placeholder="ej: cada 8 h" style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Duración (días) *</label><input type="number" required value={formData.duracionDias} onChange={(e) => setFormData({ ...formData, duracionDias: Number(e.target.value) })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Médico *</label><input required value={formData.medico} onChange={(e) => setFormData({ ...formData, medico: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Fecha Inicio *</label><input type="date" required value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Fecha Fin *</label><input type="date" required value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Observaciones</label><textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#48bb78', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecetasPage;
