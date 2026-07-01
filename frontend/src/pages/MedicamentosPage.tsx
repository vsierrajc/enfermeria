import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { medicamentosService } from '../api/medicamentos.service';
import { useAuth } from '../hooks/useAuth';
import type { Medicamento } from '../types';

const MedicamentosPage: React.FC = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '', presentacion: 'COMPRIMIDO', unidad: '', descripcion: '', stock: 0, stockMinimo: 10,
  });

  useEffect(() => { loadMedicamentos(); }, []);

  const loadMedicamentos = async () => {
    try {
      const data = await medicamentosService.findAll();
      setMedicamentos(data);
    } catch (error) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    try {
      const data = await medicamentosService.findAll({ q: search });
      setMedicamentos(data);
    } catch (error) { toast.error('Error al buscar'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await medicamentosService.create(formData);
      toast.success('Medicamento creado');
      setShowModal(false);
      setFormData({ nombre: '', presentacion: 'COMPRIMIDO', unidad: '', descripcion: '', stock: 0, stockMinimo: 10 });
      loadMedicamentos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este medicamento?')) return;
    try {
      await medicamentosService.remove(id);
      toast.success('Medicamento eliminado');
      loadMedicamentos();
    } catch (error) { toast.error('Error al eliminar'); }
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Medicamentos</h1>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            + Nuevo Medicamento
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ ...inputStyle, maxWidth: 400 }} />
        <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Buscar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {medicamentos.map((m) => (
            <div key={m.id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', color: '#2d3748' }}>{m.nombre}</h3>
                  <p style={{ margin: '0 0 4px', color: '#718096', fontSize: '0.85rem' }}>{m.presentacion} - {m.unidad}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(m.id)} style={{ padding: '4px 8px', background: '#fed7d7', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Eliminar
                  </button>
                )}
              </div>
              {m.descripcion && <p style={{ margin: '8px 0', color: '#4a5568', fontSize: '0.85rem' }}>{m.descripcion}</p>}
              <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                <span style={{ fontSize: '0.85rem' }}>
                  Stock: <strong style={{ color: m.stock <= m.stockMinimo ? '#e53e3e' : '#48bb78' }}>{m.stock}</strong>
                </span>
                <span style={{ fontSize: '0.85rem', color: '#718096' }}>Mín: {m.stockMinimo}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 500 }}>
            <h2 style={{ margin: '0 0 20px' }}>Nuevo Medicamento</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Nombre *</label><input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Presentación *</label>
                  <select value={formData.presentacion} onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })} style={inputStyle}>
                    {['COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Unidad *</label><input required value={formData.unidad} onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} placeholder="ej: 500 mg" style={inputStyle} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Stock</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} style={inputStyle} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Descripción</label><textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} style={{ ...inputStyle, height: 60 }} /></div>
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

export default MedicamentosPage;
