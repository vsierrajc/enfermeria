import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, FileDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { pacientesService } from '../api/pacientes.service';
import { useAuth } from '../hooks/useAuth';
import { createPdf, addHeader, addFooter, drawTable, formatDate } from '../utils/pdf';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Paciente } from '../types';

const PAGE_SIZE = 20;

const emptyForm = {
  dni: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  departamento: '',
  puesto: '',
  fechaIngreso: '',
  alergias: '',
  contactoEmergencia: '',
  telefono: '',
  email: '',
};

const PacientesPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingPaciente, setDeletingPaciente] = useState<Paciente | null>(null);

  const { canWrite } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async (searchQ: string, pageNum: number) => {
    setLoading(true);
    setError(false);
    try {
      const data = await pacientesService.findAll({
        q: searchQ || undefined,
        page: pageNum,
        limit: PAGE_SIZE,
      });
      setPacientes(data.items);
      setTotal(data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce (250ms) de la búsqueda: solo actualiza `debouncedQ`.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Al cambiar el término buscado (no en el montaje inicial), vuelve a página 1.
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    setPage(1);
  }, [debouncedQ]);

  useEffect(() => {
    load(debouncedQ, page);
  }, [debouncedQ, page, load]);

  useEffect(() => {
    if (showModal) {
      if (editingPaciente) {
        setFormData({
          dni: editingPaciente.dni,
          nombre: editingPaciente.nombre,
          apellido: editingPaciente.apellido,
          fechaNacimiento: editingPaciente.fechaNacimiento?.split('T')[0] || '',
          departamento: editingPaciente.departamento || '',
          puesto: editingPaciente.puesto || '',
          fechaIngreso: editingPaciente.fechaIngreso?.split('T')[0] || '',
          alergias: editingPaciente.alergias || '',
          contactoEmergencia: editingPaciente.contactoEmergencia || '',
          telefono: editingPaciente.telefono || '',
          email: editingPaciente.email || '',
        });
      } else {
        setFormData(emptyForm);
      }
    }
  }, [showModal, editingPaciente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      load(debouncedQ, page);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPaciente) return;
    try {
      await pacientesService.remove(deletingPaciente.id);
      toast.success('Paciente dado de baja');
      load(debouncedQ, page);
    } catch {
      toast.error('Error al dar de baja');
    } finally {
      setDeletingPaciente(null);
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

  return (
    <>
      <ListPage
        title="Pacientes"
        actions={
          <>
            <Button variant="ghost" onClick={generatePdf}>
              <FileDown size={16} /> PDF
            </Button>
            {canWrite && (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingPaciente(null);
                  setShowModal(true);
                }}
              >
                <Plus size={16} /> Nuevo
              </Button>
            )}
          </>
        }
        filters={
          <FilterBar>
            <Input
              label="Buscar"
              placeholder="Nombre, apellido o DNI"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-[240px]"
            />
          </FilterBar>
        }
        loading={loading}
        error={error}
        onRetry={() => load(debouncedQ, page)}
        isEmpty={!loading && !error && pacientes.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>DNI</TH>
              <TH>Nombre</TH>
              <TH>Departamento</TH>
              <TH>Puesto</TH>
              <TH>Alergias</TH>
              <TH>Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {pacientes.map((p) => (
              <TR key={p.id}>
                <TD className="tabular-nums">{p.dni}</TD>
                <TD>
                  <span>{p.nombre}</span> <span>{p.apellido}</span>
                </TD>
                <TD>{p.departamento || '-'}</TD>
                <TD>{p.puesto || '-'}</TD>
                <TD>
                  {p.alergias ? (
                    <Badge tone="crit" className="gap-1">
                      <AlertTriangle size={12} /> {p.alergias}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <Eye size={14} /> Ver
                    </Button>
                    {canWrite && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPaciente(p);
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingPaciente(p)}>
                          <Trash2 size={14} /> Baja
                        </Button>
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </ListPage>

      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingPaciente ? 'Editar paciente' : 'Nuevo paciente'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="paciente-form" variant="primary" disabled={saving}>
              {editingPaciente ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="paciente-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <Input
            label="DNI"
            required
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
          />
          <Input
            label="Nombre"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
          <Input
            label="Apellido"
            required
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
          />
          <Input
            label="Fecha nacimiento"
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
          />
          <Input
            label="Departamento"
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
          />
          <Input
            label="Puesto"
            value={formData.puesto}
            onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
          />
          <Input
            label="Fecha ingreso"
            type="date"
            value={formData.fechaIngreso}
            onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Contacto emergencia"
            value={formData.contactoEmergencia}
            onChange={(e) => setFormData({ ...formData, contactoEmergencia: e.target.value })}
          />
          <Textarea
            label="Alergias"
            value={formData.alergias}
            onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
            className="col-span-2"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingPaciente}
        onOpenChange={(open) => !open && setDeletingPaciente(null)}
        title="Dar de baja paciente"
        description={
          deletingPaciente ? `¿Confirmas dar de baja a ${deletingPaciente.nombre} ${deletingPaciente.apellido}?` : undefined
        }
        confirmLabel="Dar de baja"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
};

export default PacientesPage;
