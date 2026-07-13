import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { enfermerasService } from '../api/enfermeras.service';
import type { Enfermera } from '../types';

const EnfermerasPage: React.FC = () => {
  const [enfermeras, setEnfermeras] = useState<Enfermera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    usuario: '', password: '', nombre: '', apellido: '', matricula: '', turno: 'MANANA', roleId: 2,
  });

  useEffect(() => { loadEnfermeras(); }, []);

  const loadEnfermeras = async () => {
    try {
      const data = await enfermerasService.findAll();
      setEnfermeras(data.items);
    } catch (error) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enfermerasService.create(formData);
      toast.success('Enfermera/o creado');
      setShowModal(false);
      setFormData({ usuario: '', password: '', nombre: '', apellido: '', matricula: '', turno: 'MANANA', roleId: 2 });
      loadEnfermeras();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const turnoColors: Record<string, string> = {
    MANANA: '#ed8936', TARDE: '#4299e1', NOCHE: '#9f7aea',
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Enfermeras/os</h1>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          + Nuevo
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {enfermeras.map((e) => (
            <div key={e.id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', color: '#2d3748' }}>{e.nombre} {e.apellido}</h3>
                  <p style={{ margin: '0 0 4px', color: '#718096', fontSize: '0.85rem' }}>@{e.usuario}</p>
                </div>
                <span style={{ padding: '2px 8px', background: (turnoColors[e.turno] || '#718096') + '20', color: turnoColors[e.turno] || '#718096', borderRadius: 4, fontSize: '0.8rem' }}>
                  {e.turno}
                </span>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#4a5568' }}>
                <p style={{ margin: '4px 0' }}>Matrícula: <strong>{e.matricula}</strong></p>
                <p style={{ margin: '4px 0' }}>Rol: {e.role?.nombre || 'ENFERMERA'}</p>
                <p style={{ margin: '4px 0' }}>Estado: <span style={{ color: e.activo ? '#48bb78' : '#e53e3e' }}>{e.activo ? 'Activo' : 'Inactivo'}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 500 }}>
            <h2 style={{ margin: '0 0 20px' }}>Nueva Enfermera/o</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Usuario *</label><input required value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Contraseña *</label><input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Nombre *</label><input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Apellido *</label><input required value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Matrícula *</label><input required value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Turno *</label>
                  <select value={formData.turno} onChange={(e) => setFormData({ ...formData, turno: e.target.value })} style={inputStyle}>
                    {['MANANA', 'TARDE', 'NOCHE'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Rol</label>
                  <select value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })} style={inputStyle}>
                    <option value={1}>Administrador</option>
                    <option value={2}>Enfermera/o</option>
                    <option value={3}>Consulta/Auditoría</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnfermerasPage;
