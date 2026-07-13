import { useState } from 'react';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { remisionesService } from '../api/remisiones.service';
import { useAuth } from '../hooks/useAuth';
import { createPdf, addHeader, addFooter, drawTable, formatDate } from '../utils/pdf';
import { fetchAllPages } from '../lib/fetchAllPages';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { usePagedList } from '../components/list/usePagedList';
import { NuevaRemisionModal } from '../components/patient/NuevaRemisionModal';
import { PatientPicker } from '../components/patient/PatientPicker';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Remision, Paciente } from '../types';

const PAGE_SIZE = 20;

const ESTADOS: Remision['estado'][] = ['PENDIENTE', 'EN_CURSO', 'FINALIZADO'];

const estadoTone: Record<string, 'accent' | 'crit' | 'warn' | 'ok' | 'neutral'> = {
  PENDIENTE: 'warn',
  EN_CURSO: 'accent',
  FINALIZADO: 'ok',
};

const tipoRemisionTone: Record<string, 'accent' | 'crit' | 'warn' | 'ok' | 'neutral'> = {
  ESPECIALISTA: 'accent',
  EPS: 'accent',
  INCAPACIDAD: 'crit',
  EXAMEN_EXTERNO: 'ok',
  OTRO: 'neutral',
};

type RemisionesFilters = { pacienteId?: number; estado?: string; desde?: string; hasta?: string };

type FilterState = { paciente: Paciente | null; estado: string; desde: string; hasta: string };

const emptyFilterState: FilterState = { paciente: null, estado: '', desde: '', hasta: '' };

const fetchRemisiones = (params: RemisionesFilters & { page: number; limit: number }) =>
  remisionesService.findAll(params);

const RemisionesPage: React.FC = () => {
  const {
    items: remisiones,
    total,
    page,
    loading,
    error,
    setPage,
    setFilters,
    filters,
    reload,
    afterDelete,
  } = usePagedList<Remision, RemisionesFilters>({
    fetcher: fetchRemisiones,
    initialFilters: {},
    pageSize: PAGE_SIZE,
  });

  const [filterState, setFilterState] = useState<FilterState>(emptyFilterState);
  const [showModal, setShowModal] = useState(false);
  const [deletingRemision, setDeletingRemision] = useState<Remision | null>(null);
  const [exporting, setExporting] = useState(false);

  const { canWrite, isAdmin } = useAuth();

  // Cada control de filtro aplica de inmediato: se mergea con el resto del
  // estado local y se empuja a `setFilters`, que resetea a página 1 de forma
  // atómica (mismo patrón que Pacientes/Controles/Recetas, ver usePagedList).
  const applyFilters = (patch: Partial<FilterState>) => {
    const next = { ...filterState, ...patch };
    setFilterState(next);
    setFilters({
      pacienteId: next.paciente?.id,
      estado: next.estado || undefined,
      desde: next.desde || undefined,
      hasta: next.hasta || undefined,
    });
  };

  const handleEstadoChange = async (id: number, estado: string) => {
    try {
      await remisionesService.update(id, { estado: estado as Remision['estado'] });
      toast.success('Estado actualizado');
      reload();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!deletingRemision) return;
    try {
      await remisionesService.remove(deletingRemision.id);
      toast.success('Remisión eliminada');
      afterDelete();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingRemision(null);
    }
  };

  const generatePdf = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(fetchRemisiones, filters);
      if (rows.length === 0) {
        toast.error('No hay registros para exportar');
        return;
      }

      const doc = createPdf('Reporte de Remisiones');
      const y = addHeader(doc, 'Reporte de Remisiones', `Total: ${rows.length} registros`);
      addFooter(doc, 1);

      const body = rows.map((r) => [
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
    } catch {
      toast.error('Error al generar el PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <ListPage
        title="Remisiones"
        actions={
          <>
            <Button variant="ghost" onClick={generatePdf} disabled={exporting}>
              <FileDown size={16} /> PDF
            </Button>
            {canWrite && (
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Nueva remisión
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
            <Select
              label="Estado"
              value={filterState.estado}
              onChange={(e) => applyFilters({ estado: e.target.value })}
              className="w-40"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
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
        isEmpty={!loading && !error && remisiones.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Paciente</TH>
              <TH>Destino</TH>
              <TH>Motivo</TH>
              <TH>Tipo</TH>
              <TH>Estado</TH>
              {isAdmin && <TH>Acciones</TH>}
            </TR>
          </THead>
          <TBody>
            {remisiones.map((r) => (
              <TR key={r.id}>
                <TD className="tabular-nums">{formatDate(r.fechaRemision)}</TD>
                <TD>{[r.paciente?.nombre, r.paciente?.apellido].filter(Boolean).join(' ') || '-'}</TD>
                <TD>{r.destino}</TD>
                <TD className="max-w-xs truncate">{r.motivo}</TD>
                <TD>
                  <Badge tone={tipoRemisionTone[r.tipo] ?? 'neutral'}>{r.tipo}</Badge>
                </TD>
                <TD>
                  {canWrite ? (
                    <Select
                      aria-label={`Estado de la remisión de ${r.paciente?.nombre ?? 'paciente'}`}
                      value={r.estado}
                      onChange={(e) => handleEstadoChange(r.id, e.target.value)}
                      className="w-40"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Badge tone={estadoTone[r.estado] ?? 'neutral'}>{r.estado}</Badge>
                  )}
                </TD>
                {isAdmin && (
                  <TD>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingRemision(r)}>
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </ListPage>

      <NuevaRemisionModal open={showModal} onOpenChange={setShowModal} onCreated={reload} />

      <ConfirmDialog
        open={!!deletingRemision}
        onOpenChange={(open) => !open && setDeletingRemision(null)}
        title="Eliminar remisión"
        description={
          deletingRemision
            ? `¿Confirmas eliminar la remisión a ${deletingRemision.destino}?`
            : undefined
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
};

export default RemisionesPage;
