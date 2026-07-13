import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { medicamentosService } from '../api/medicamentos.service';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { usePagedList } from '../components/list/usePagedList';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Medicamento } from '../types';

const PAGE_SIZE = 20;

const PRESENTACIONES = ['COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA'] as const;

type MedicamentosFilters = { q?: string; soloStockBajo?: boolean };

const fetchMedicamentos = (params: MedicamentosFilters & { page: number; limit: number }) =>
  medicamentosService.findAll(params);

const emptyForm = {
  nombre: '',
  presentacion: 'COMPRIMIDO',
  unidad: '',
  descripcion: '',
  stock: 0,
  stockMinimo: 10,
};

const MedicamentosPage: React.FC = () => {
  const {
    items: medicamentos,
    total,
    page,
    loading,
    error,
    setPage,
    setFilters,
    reload,
    afterDelete,
  } = usePagedList<Medicamento, MedicamentosFilters>({
    fetcher: fetchMedicamentos,
    initialFilters: {},
    pageSize: PAGE_SIZE,
  });

  const [q, setQ] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingMedicamento, setEditingMedicamento] = useState<Medicamento | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingMedicamento, setDeletingMedicamento] = useState<Medicamento | null>(null);

  const { isAdmin } = useAuth();

  // Debounce (250ms) de la búsqueda: al asentarse, `setFilters` resetea a página 1
  // atómicamente. Se omite el primer render para no disparar un fetch redundante
  // (el hook ya carga la página 1 al montarse). Ver PacientesPage.
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    const t = setTimeout(() => setFilters({ q: q.trim() || undefined, soloStockBajo: soloStockBajo || undefined }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleStockBajo = () => {
    const next = !soloStockBajo;
    setSoloStockBajo(next);
    setFilters({ q: q.trim() || undefined, soloStockBajo: next || undefined });
  };

  useEffect(() => {
    if (showModal) {
      if (editingMedicamento) {
        setFormData({
          nombre: editingMedicamento.nombre,
          presentacion: editingMedicamento.presentacion,
          unidad: editingMedicamento.unidad,
          descripcion: editingMedicamento.descripcion || '',
          stock: editingMedicamento.stock,
          stockMinimo: editingMedicamento.stockMinimo,
        });
      } else {
        setFormData(emptyForm);
      }
    }
  }, [showModal, editingMedicamento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingMedicamento) {
        await medicamentosService.update(editingMedicamento.id, formData);
        toast.success('Medicamento actualizado');
      } else {
        await medicamentosService.create(formData);
        toast.success('Medicamento creado');
      }
      setShowModal(false);
      setEditingMedicamento(null);
      reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedicamento) return;
    try {
      await medicamentosService.remove(deletingMedicamento.id);
      toast.success('Medicamento dado de baja');
      afterDelete();
    } catch {
      toast.error('Error al dar de baja');
    } finally {
      setDeletingMedicamento(null);
    }
  };

  return (
    <>
      <ListPage
        title="Medicamentos"
        actions={
          isAdmin && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingMedicamento(null);
                setShowModal(true);
              }}
            >
              <Plus size={16} /> Nuevo
            </Button>
          )
        }
        filters={
          <FilterBar>
            <Input
              label="Buscar"
              placeholder="Nombre del medicamento"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-[240px]"
            />
            <Button
              type="button"
              variant={soloStockBajo ? 'primary' : 'default'}
              onClick={toggleStockBajo}
              aria-pressed={soloStockBajo}
            >
              Solo stock bajo
            </Button>
          </FilterBar>
        }
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && medicamentos.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>Nombre</TH>
              <TH>Presentación</TH>
              <TH>Unidad</TH>
              <TH>Stock</TH>
              <TH>Stock mínimo</TH>
              <TH>Estado</TH>
              {isAdmin && <TH>Acciones</TH>}
            </TR>
          </THead>
          <TBody>
            {medicamentos.map((m) => {
              const stockBajo = m.stock <= m.stockMinimo;
              return (
                <TR key={m.id}>
                  <TD>{m.nombre}</TD>
                  <TD>{m.presentacion}</TD>
                  <TD>{m.unidad}</TD>
                  <TD className="tabular-nums">
                    {stockBajo ? <Badge tone="crit">{m.stock}</Badge> : m.stock}
                  </TD>
                  <TD className="tabular-nums">{m.stockMinimo}</TD>
                  <TD>
                    <Badge tone={m.activo ? 'ok' : 'neutral'}>{m.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </TD>
                  {isAdmin && (
                    <TD>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMedicamento(m);
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingMedicamento(m)}>
                          <Trash2 size={14} /> Baja
                        </Button>
                      </div>
                    </TD>
                  )}
                </TR>
              );
            })}
          </TBody>
        </Table>
      </ListPage>

      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingMedicamento ? 'Editar medicamento' : 'Nuevo medicamento'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="medicamento-form" variant="primary" disabled={saving}>
              {editingMedicamento ? 'Actualizar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="medicamento-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
          <Select
            label="Presentación"
            value={formData.presentacion}
            onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
          >
            {PRESENTACIONES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input
            label="Unidad"
            required
            placeholder="ej: 500 mg"
            value={formData.unidad}
            onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
          />
          <Input
            label="Stock"
            type="number"
            min={0}
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
          />
          <Input
            label="Stock mínimo"
            type="number"
            min={0}
            value={formData.stockMinimo}
            onChange={(e) => setFormData({ ...formData, stockMinimo: Number(e.target.value) })}
          />
          <Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="col-span-2"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingMedicamento}
        onOpenChange={(open) => !open && setDeletingMedicamento(null)}
        title="Dar de baja medicamento"
        description={deletingMedicamento ? `¿Confirmas dar de baja a ${deletingMedicamento.nombre}?` : undefined}
        confirmLabel="Dar de baja"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
};

export default MedicamentosPage;
