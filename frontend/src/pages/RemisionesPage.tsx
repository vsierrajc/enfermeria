import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { remisionesService } from '../api/remisiones.service';
import { pacientesService } from '../api/pacientes.service';
import { createPdf, addHeader, addFooter, drawTable, formatDate } from '../utils/pdf';
import type { Remision, Paciente } from '../types';

const RemisionesPage: React.FC = () => {
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [filters, setFilters] = useState({ estado: '', desde: '', hasta: '' });
  const [formData, setFormData] = useState({
    pacienteId: '', tipo: 'ESPECIALISTA', destino: '', motivo: '',
    diagnostico: '', fechaRemision: '', observaciones: '',
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [r, p] = await Promise.all([remisionesService.findAll(), pacientesService.findAll()]);
      setRemisiones(r.items);
      setPacientes(p.items);
    } catch (error) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const handleFilter = async () => {
    try {
      const params: any = {};
      if (filters.estado) params.estado = filters.estado;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      const data = await remisionesService.findAll(params);
      setRemisiones(data.items);
    } catch (error) { toast.error('Error al filtrar'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await remisionesService.create({
        pacienteId: Number(formData.pacienteId),
        tipo: formData.tipo as any,
        destino: formData.destino,
        motivo: formData.motivo,
        diagnostico: formData.diagnostico || undefined,
        fechaRemision: formData.fechaRemision,
        observaciones: formData.observaciones || undefined,
      });
      toast.success('Remisión creada');
      setShowModal(false);
      loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleUpdateEstado = async (id: number, estado: string) => {
    try {
      await remisionesService.update(id, { estado: estado as any });
      toast.success('Estado actualizado');
      loadAll();
    } catch (error) { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta remisión?')) return;
    try {
      await remisionesService.remove(id);
      toast.success('Remisión eliminada');
      loadAll();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const generatePdf = () => {
    const doc = createPdf('Reporte de Remisiones');
    const y = addHeader(doc, 'Reporte de Remisiones', `Total: ${remisiones.length} registros`);
    addFooter(doc, 1);

    const body = remisiones.map((r) => [
      formatDate(r.fechaRemision),
      `${r.paciente?.nombre || ''} ${r.paciente?.apellido || ''}`.trim(),
      r.tipo,
      r.destino,
      r.motivo,
      r.estado,
    ]);

    drawTable(doc, y, [['Fecha', 'Paciente', 'Tipo', 'Destino', 'Motivo', 'Estado']], body);

    doc.save('remisiones.pdf');
    toast.success('PDF generado');
  };

  const estadoColors: Record<string, string> = {
    PENDIENTE: '#ed8936', EN_CURSO: '#4299e1', FINALIZADO: '#48bb78',
  };

  const tipoColors: Record<string, string> = {
    ESPECIALISTA: '#9f7aea', EPS: '#4299e1', INCAPACIDAD: '#e53e3e',
    EXAMEN_EXTERNO: '#48bb78', OTRO: '#718096',
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Remisiones</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={generatePdf} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            PDF
          </button>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#9f7aea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            + Nueva Remisión
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })} style={{ ...inputStyle, width: 160 }}>
          <option value="">Todos los estados</option>
          {['PENDIENTE', 'EN_CURSO', 'FINALIZADO'].map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} style={inputStyle} />
        <input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} style={inputStyle} />
        <button onClick={handleFilter} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Filtrar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <table style={{ width: '100%', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              {['Fecha', 'Paciente', 'Tipo', 'Destino', 'Motivo', 'Estado', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {remisiones.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '12px' }}>{r.fechaRemision.split('T')[0]}</td>
                <td style={{ padding: '12px' }}>{r.paciente?.nombre} {r.paciente?.apellido}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '2px 8px', background: (tipoColors[r.tipo] || '#718096') + '20', color: tipoColors[r.tipo] || '#718096', borderRadius: 4, fontSize: '0.8rem' }}>
                    {r.tipo}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{r.destino}</td>
                <td style={{ padding: '12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.motivo}</td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={r.estado}
                    onChange={(e) => handleUpdateEstado(r.id, e.target.value)}
                    style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: (estadoColors[r.estado] || '#718096') + '20', color: estadoColors[r.estado] || '#718096', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {['PENDIENTE', 'EN_CURSO', 'FINALIZADO'].map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
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
            <h2 style={{ margin: '0 0 20px' }}>Nueva Remisión</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Paciente *</label>
                  <select required value={formData.pacienteId} onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Tipo *</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} style={inputStyle}>
                    {['ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Destino *</label><input required value={formData.destino} onChange={(e) => setFormData({ ...formData, destino: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Fecha *</label><input type="date" required value={formData.fechaRemision} onChange={(e) => setFormData({ ...formData, fechaRemision: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Motivo *</label><textarea required value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Diagnóstico</label><textarea value={formData.diagnostico} onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Observaciones</label><textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#9f7aea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemisionesPage;
