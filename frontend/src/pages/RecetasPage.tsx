import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { recetasService } from '../api/recetas.service';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/pdf';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { usePagedList } from '../components/list/usePagedList';
import { NuevaRecetaModal } from '../components/patient/NuevaRecetaModal';
import { PatientPicker } from '../components/patient/PatientPicker';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Receta, Paciente } from '../types';

const PAGE_SIZE = 20;

type RecetasFilters = { pacienteId?: number; desde?: string; hasta?: string };

type FilterState = { paciente: Paciente | null; desde: string; hasta: string };

const emptyFilterState: FilterState = { paciente: null, desde: '', hasta: '' };

const fetchRecetas = (params: RecetasFilters & { page: number; limit: number }) =>
  recetasService.findAll(params);

const RecetasPage: React.FC = () => {
  const {
    items: recetas,
    total,
    page,
    loading,
    error,
    setPage,
    setFilters,
    reload,
    afterDelete,
  } = usePagedList<Receta, RecetasFilters>({
    fetcher: fetchRecetas,
    initialFilters: {},
    pageSize: PAGE_SIZE,
  });

  const [filterState, setFilterState] = useState<FilterState>(emptyFilterState);
  const [showModal, setShowModal] = useState(false);
  const [deletingReceta, setDeletingReceta] = useState<Receta | null>(null);

  const { canWrite } = useAuth();

  // Cada control de filtro aplica de inmediato: se mergea con el resto del
  // estado local y se empuja a `setFilters`, que resetea a página 1 de forma
  // atómica (mismo patrón que Pacientes/Controles, ver usePagedList).
  const applyFilters = (patch: Partial<FilterState>) => {
    const next = { ...filterState, ...patch };
    setFilterState(next);
    setFilters({
      pacienteId: next.paciente?.id,
      desde: next.desde || undefined,
      hasta: next.hasta || undefined,
    });
  };

  const handleDelete = async () => {
    if (!deletingReceta) return;
    try {
      await recetasService.remove(deletingReceta.id);
      toast.success('Receta eliminada');
      afterDelete();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingReceta(null);
    }
  };

  return (
    <>
      <ListPage
        title="Recetas"
        actions={
          <>
            {canWrite && (
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Nueva receta
              </Button>
            )}
          </>
        }
        filters={
          <FilterBar>
            <div className="flex min-w-[220px] flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-faint font-medium">Paciente</span>
              <PatientPicker value={filterState.paciente} onChange={(p) => applyFilters({ paciente: p })} />
            </div>
            <Input
              label="Desde"
              type="date"
              value={filterState.desde}
              onChange={(e) => applyFilters({ desde: e.target.value })}
            />
            <Input
              label="Hasta"
              type="date"
              value={filterState.hasta}
              onChange={(e) => applyFilters({ hasta: e.target.value })}
            />
          </FilterBar>
        }
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && recetas.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>Paciente</TH>
              <TH>Medicamento</TH>
              <TH>Dosis</TH>
              <TH>Frecuencia</TH>
              <TH>Duración</TH>
              <TH>Fecha inicio</TH>
              <TH>Fecha fin</TH>
              <TH>Médico</TH>
              {canWrite && <TH>Acciones</TH>}
            </TR>
          </THead>
          <TBody>
            {recetas.map((r) => (
              <TR key={r.id}>
                <TD>{[r.paciente?.nombre, r.paciente?.apellido].filter(Boolean).join(' ') || '-'}</TD>
                <TD>{r.medicamento?.nombre ?? '-'}</TD>
                <TD>{r.dosis}</TD>
                <TD>{r.frecuencia}</TD>
                <TD className="tabular-nums">{r.duracionDias} días</TD>
                <TD className="tabular-nums">{formatDate(r.fechaInicio)}</TD>
                <TD className="tabular-nums">{formatDate(r.fechaFin)}</TD>
                <TD>{r.medico}</TD>
                {canWrite && (
                  <TD>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingReceta(r)}>
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </ListPage>

      <NuevaRecetaModal open={showModal} onOpenChange={setShowModal} onCreated={reload} />

      <ConfirmDialog
        open={!!deletingReceta}
        onOpenChange={(open) => !open && setDeletingReceta(null)}
        title="Eliminar receta"
        description={
          deletingReceta
            ? `¿Confirmas eliminar la receta de ${deletingReceta.medicamento?.nombre ?? 'este medicamento'}?`
            : undefined
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
};

export default RecetasPage;
