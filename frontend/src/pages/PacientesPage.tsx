import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pacientesService } from '../api/pacientes.service';
import { useAuth } from '../hooks/useAuth';
import { createPdf, addHeader, addFooter, drawTable, formatDate } from '../utils/pdf';
import type { Paciente } from '../types';

const PacientesPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dni: '', nombre: '', apellido: '', fechaNacimiento: '',
    departamento: '', puesto: '', fechaIngreso: '', alergias: '',
    contactoEmergencia: '', telefono: '', email: '',
  });

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      const data = await pacientesService.findAll();
      setPacientes(data.items);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await pacientesService.findAll({ q: search });
      setPacientes(data.items);
    } catch (error) {
      toast.error('Error al buscar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPaciente) {
        await pacientesService.update(editingPaciente.id, formData);
        toast.success('Paciente actualizado');
      } else {
        await pacientesService.create(formData);
        toast.success('Paciente creado');
      }
      setShowModal(false);
      setEditingPaciente(null);
      resetForm();
      loadPacientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEdit = (p: Paciente) => {
    setEditingPaciente(p);
    setFormData({
      dni: p.dni, nombre: p.nombre, apellido: p.apellido,
      fechaNacimiento: p.fechaNacimiento?.split('T')[0] || '',
      departamento: p.departamento || '', puesto: p.puesto || '',
      fechaIngreso: p.fechaIngreso?.split('T')[0] || '',
      alergias: p.alergias || '', contactoEmergencia: p.contactoEmergencia || '',
      telefono: p.telefono || '', email: p.email || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este paciente?')) return;
    try {
      await pacientesService.remove(id);
      toast.success('Paciente eliminado');
      loadPacientes();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const generatePdf = () => {
    const doc = createPdf('Reporte de Pacientes');
    const y = addHeader(doc, 'Reporte de Pacientes', `Total: ${pacientes.length} registros`);

    const body = pacientes.map((p) => [
      p.dni,
      `${p.nombre} ${p.apellido}`,
      p.departamento || '-',
      p.puesto || '-',
      formatDate(p.fechaNacimiento),
      p.telefono || '-',
      p.alergias || '-',
      p.activo ? 'Activo' : 'Inactivo',
    ]);

    addFooter(doc, 1);
    drawTable(doc, y, [['DNI', 'Nombre', 'Departamento', 'Puesto', 'F. Nacimiento', 'Telefono', 'Alergias', 'Estado']], body);

    doc.save('pacientes.pdf');
    toast.success('PDF generado');
  };

  const resetForm = () => {
    setFormData({
      dni: '', nombre: '', apellido: '', fechaNacimiento: '',
      departamento: '', puesto: '', fechaIngreso: '', alergias: '',
      contactoEmergencia: '', telefono: '', email: '',
    });
  };

  const inputStyle = {
    width: '100%', padding: '10px', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: '0.9rem', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>Pacientes</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={generatePdf} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            PDF
          </button>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setEditingPaciente(null); setShowModal(true); }}
              style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              + Nuevo Paciente
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Buscar por nombre, apellido o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ ...inputStyle, maxWidth: 400 }}
        />
        <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Buscar
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: '100%', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr style={{ background: '#edf2f7' }}>
              {['DNI', 'Nombre', 'Departamento', 'Puesto', 'Alergias', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '12px 16px' }}>{p.dni}</td>
                <td style={{ padding: '12px 16px' }}>{p.nombre} {p.apellido}</td>
                <td style={{ padding: '12px 16px' }}>{p.departamento || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{p.puesto || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {p.alergias ? <span style={{ color: '#e53e3e', fontWeight: 600 }}>⚠️ {p.alergias}</span> : '-'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => navigate(`/pacientes/${p.id}`)} style={{ marginRight: 8, padding: '4px 12px', background: '#edf2f7', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Ver
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEdit(p)} style={{ marginRight: 8, padding: '4px 12px', background: '#fefcbf', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: '4px 12px', background: '#fed7d7', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                        Baja
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 20px' }}>{editingPaciente ? 'Editar' : 'Nuevo'} Paciente</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'dni', label: 'DNI', required: true },
                  { key: 'nombre', label: 'Nombre', required: true },
                  { key: 'apellido', label: 'Apellido', required: true },
                  { key: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date' },
                  { key: 'departamento', label: 'Departamento' },
                  { key: 'puesto', label: 'Puesto' },
                  { key: 'fechaIngreso', label: 'Fecha Ingreso', type: 'date' },
                  { key: 'telefono', label: 'Teléfono' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'contactoEmergencia', label: 'Contacto Emergencia' },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', color: '#4a5568' }}>
                      {field.label} {field.required && '*'}
                    </label>
                    <input
                      type={field.type || 'text'}
                      required={field.required}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', color: '#4a5568' }}>Alergias</label>
                  <textarea
                    value={formData.alergias}
                    onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                    style={{ ...inputStyle, height: 60 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#edf2f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#4299e1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  {editingPaciente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PacientesPage;
