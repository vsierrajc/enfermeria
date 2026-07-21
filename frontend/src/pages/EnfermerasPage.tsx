import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { enfermerasService } from '../api/enfermeras.service';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { usePagedList } from '../components/list/usePagedList';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Enfermera } from '../types';

const PAGE_SIZE = 20;

const TURNOS = ['MANANA', 'TARDE', 'NOCHE'] as const;

const ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Enfermera/o' },
  { id: 3, nombre: 'Consulta/Auditoría' },
];

type EnfermerasFilters = { q?: string };

const fetchEnfermeras = (params: EnfermerasFilters & { page: number; limit: number }) =>
  enfermerasService.findAll(params);

const emptyCreateForm = {
  usuario: '',
  password: '',
  nombre: '',
  apellido: '',
  matricula: '',
  turno: 'MANANA',
  roleId: 2,
};

type EditForm = {
  nombre: string;
  apellido: string;
  matricula: string;
  turno: string;
  roleId: number;
  activo: boolean;
};

const emptyEditForm: EditForm = {
  nombre: '',
  apellido: '',
  matricula: '',
  turno: 'MANANA',
  roleId: 2,
  activo: true,
};

const EnfermerasPage: React.FC = () => {
  const {
    items: enfermeras,
    total,
    page,
    loading,
    error,
    setPage,
    setFilters,
    reload,
  } = usePagedList<Enfermera, EnfermerasFilters>({
    fetcher: fetchEnfermeras,
    initialFilters: {},
    pageSize: PAGE_SIZE,
  });

  const [q, setQ] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const [editingEnfermera, setEditingEnfermera] = useState<Enfermera | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const [deactivatingEnfermera, setDeactivatingEnfermera] = useState<Enfermera | null>(null);

  const { isAdmin } = useAuth();

  // Debounce (250ms) de la búsqueda: al asentarse, `setFilters` resetea a página 1
  // atómicamente. Se omite el primer render para no disparar un fetch redundante
  // (el hook ya carga la página 1 al montarse). Mismo patrón que Pacientes/Controles.
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    const t = setTimeout(() => setFilters({ q: q.trim() || undefined }), 250);
    return () => clearTimeout(t);
  }, [q, setFilters]);

  const openCreateModal = () => {
    setCreateForm(emptyCreateForm);
    setShowCreateModal(true);
  };

  const openEditModal = (u: Enfermera) => {
    setEditingEnfermera(u);
    setEditForm({
      nombre: u.nombre,
      apellido: u.apellido,
      matricula: u.matricula,
      turno: u.turno,
      roleId: u.role?.id ?? 2,
      activo: u.activo,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await enfermerasService.create(createForm);
      toast.success('Usuario creado');
      setShowCreateModal(false);
      reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnfermera) return;
    setSaving(true);
    try {
      await enfermerasService.update(editingEnfermera.id, editForm);
      toast.success('Usuario actualizado');
      setEditingEnfermera(null);
      reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: Enfermera) => {
    try {
      await enfermerasService.update(u.id, { activo: !u.activo });
      toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
      reload();
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleActivarDesactivar = (u: Enfermera) => {
    if (u.activo) {
      setDeactivatingEnfermera(u);
    } else {
      toggleActivo(u);
    }
  };

  const handleConfirmDeactivate = () => {
    if (!deactivatingEnfermera) return;
    toggleActivo(deactivatingEnfermera);
  };

  return (
    <>
      <ListPage
        title="Usuarios"
        actions={
          isAdmin && (
            <Button variant="primary" onClick={openCreateModal}>
              <Plus size={16} /> Nuevo usuario
            </Button>
          )
        }
        filters={
          <FilterBar>
            <Input
              label="Buscar"
              placeholder="Usuario, nombre o matrícula"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-[240px]"
            />
          </FilterBar>
        }
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && enfermeras.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>Usuario</TH>
              <TH>Nombre</TH>
              <TH>Matrícula</TH>
              <TH>Turno</TH>
              <TH>Rol</TH>
              <TH>Estado</TH>
              {isAdmin && <TH>Acciones</TH>}
            </TR>
          </THead>
          <TBody>
            {enfermeras.map((u) => (
              <TR key={u.id}>
                <TD>{u.usuario}</TD>
                <TD>
                  {u.nombre} {u.apellido}
                </TD>
                <TD>{u.matricula}</TD>
                <TD>{u.turno}</TD>
                <TD>
                  <Badge tone="accent">{u.role?.nombre ?? 'ENFERMERA'}</Badge>
                </TD>
                <TD>
                  <Badge tone={u.activo ? 'ok' : 'neutral'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                </TD>
                {isAdmin && (
                  <TD>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(u)}>
                        <Pencil size={14} /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleActivarDesactivar(u)}>
                        {u.activo ? (
                          <>
                            <PowerOff size={14} /> Desactivar
                          </>
                        ) : (
                          <>
                            <Power size={14} /> Activar
                          </>
                        )}
                      </Button>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </ListPage>

      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Nuevo usuario"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="enfermera-create-form" variant="primary" disabled={creating}>
              Crear
            </Button>
          </>
        }
      >
        <form id="enfermera-create-form" onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-3">
          <Input
            label="Usuario"
            required
            value={createForm.usuario}
            onChange={(e) => setCreateForm({ ...createForm, usuario: e.target.value })}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <Input
            label="Nombre"
            required
            value={createForm.nombre}
            onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
          />
          <Input
            label="Apellido"
            required
            value={createForm.apellido}
            onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
          />
          <Input
            label="Matrícula"
            required
            value={createForm.matricula}
            onChange={(e) => setCreateForm({ ...createForm, matricula: e.target.value })}
          />
          <Select
            label="Turno"
            value={createForm.turno}
            onChange={(e) => setCreateForm({ ...createForm, turno: e.target.value })}
          >
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            label="Rol"
            value={createForm.roleId}
            onChange={(e) => setCreateForm({ ...createForm, roleId: Number(e.target.value) })}
            className="col-span-2"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Select>
        </form>
      </Modal>

      <Modal
        open={!!editingEnfermera}
        onOpenChange={(open) => !open && setEditingEnfermera(null)}
        title="Editar usuario"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingEnfermera(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="enfermera-edit-form" variant="primary" disabled={saving}>
              Actualizar
            </Button>
          </>
        }
      >
        <form id="enfermera-edit-form" onSubmit={handleEditSubmit} className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            required
            value={editForm.nombre}
            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
          />
          <Input
            label="Apellido"
            required
            value={editForm.apellido}
            onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
          />
          <Input
            label="Matrícula"
            required
            value={editForm.matricula}
            onChange={(e) => setEditForm({ ...editForm, matricula: e.target.value })}
          />
          <Select
            label="Turno"
            value={editForm.turno}
            onChange={(e) => setEditForm({ ...editForm, turno: e.target.value })}
          >
            {TURNOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            label="Rol"
            value={editForm.roleId}
            onChange={(e) => setEditForm({ ...editForm, roleId: Number(e.target.value) })}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={editForm.activo ? 'true' : 'false'}
            onChange={(e) => setEditForm({ ...editForm, activo: e.target.value === 'true' })}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactivatingEnfermera}
        onOpenChange={(open) => !open && setDeactivatingEnfermera(null)}
        title="Desactivar usuario"
        description={
          deactivatingEnfermera
            ? `¿Confirmas desactivar a ${deactivatingEnfermera.nombre} ${deactivatingEnfermera.apellido}? No podrá iniciar sesión hasta que se reactive.`
            : undefined
        }
        confirmLabel="Desactivar"
        onConfirm={handleConfirmDeactivate}
        destructive
      />
    </>
  );
};

export default EnfermerasPage;
