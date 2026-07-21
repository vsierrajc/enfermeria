import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { controlesService } from '../api/controles.service';
import { useAuth } from '../hooks/useAuth';
import { createPdf, addHeader, addFooter, drawTable, formatDateTime } from '../utils/pdf';
import { fetchAllPages } from '../lib/fetchAllPages';
import { toast } from '../ui/Toast';
import { ListPage } from '../components/list/ListPage';
import { FilterBar } from '../components/list/FilterBar';
import { usePagedList } from '../components/list/usePagedList';
import { NuevoControlModal } from '../components/patient/NuevoControlModal';
import { PatientPicker } from '../components/patient/PatientPicker';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Control, Paciente } from '../types';

const PAGE_SIZE = 20;

const TIPOS: Control['tipo'][] = ['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'];

const tipoControlTone: Record<string, 'accent' | 'crit' | 'warn' | 'ok' | 'neutral'> = {
  RUTINARIO: 'accent',
  URGENTE: 'crit',
  SEGUIMIENTO: 'warn',
  INGRESO: 'ok',
  PERIODICO: 'neutral',
};

type ControlesFilters = { pacienteId?: number; desde?: string; hasta?: string; tipo?: string };

type FilterState = { paciente: Paciente | null; tipo: string; desde: string; hasta: string };

const emptyFilterState: FilterState = { paciente: null, tipo: '', desde: '', hasta: '' };

const fetchControles = (params: ControlesFilters & { page: number; limit: number }) =>
  controlesService.findAll(params);

const ControlesPage: React.FC = () => {
  // Deep-link desde el dashboard ("Controles de hoy" -> ?desde=hoy&hasta=hoy):
  // se lee UNA vez al montar para sembrar tanto el filtro inicial como los
  // inputs de fecha del FilterBar.
  const [searchParams] = useSearchParams();
  const initialDesde = searchParams.get('desde') || '';
  const initialHasta = searchParams.get('hasta') || '';

  const {
    items: controles,
    total,
    page,
    loading,
    error,
    setPage,
    setFilters,
    filters,
    reload,
    afterDelete,
  } = usePagedList<Control, ControlesFilters>({
    fetcher: fetchControles,
    initialFilters: { desde: initialDesde || undefined, hasta: initialHasta || undefined },
    pageSize: PAGE_SIZE,
  });

  const [filterState, setFilterState] = useState<FilterState>({
    ...emptyFilterState,
    desde: initialDesde,
    hasta: initialHasta,
  });
  const [showModal, setShowModal] = useState(false);
  const [deletingControl, setDeletingControl] = useState<Control | null>(null);
  const [exporting, setExporting] = useState(false);

  const { canWrite } = useAuth();

  // Cada control de filtro aplica de inmediato (no son texto libre): se mergea
  // con el resto del estado local y se empuja a `setFilters`, que resetea a
  // página 1 de forma atómica (mismo patrón que Pacientes, ver usePagedList).
  const applyFilters = (patch: Partial<FilterState>) => {
    const next = { ...filterState, ...patch };
    setFilterState(next);
    setFilters({
      pacienteId: next.paciente?.id,
      tipo: next.tipo || undefined,
      desde: next.desde || undefined,
      hasta: next.hasta || undefined,
    });
  };

  const handleDelete = async () => {
    if (!deletingControl) return;
    try {
      await controlesService.remove(deletingControl.id);
      toast.success('Control eliminado');
      afterDelete();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingControl(null);
    }
  };

  const generatePdf = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(fetchControles, filters);
      if (rows.length === 0) {
        toast.error('No hay registros para exportar');
        return;
      }

      const doc = createPdf('Reporte de Controles');
      const y = addHeader(doc, 'Reporte de Controles', `Total: ${rows.length} registros`);
      addFooter(doc, 1);

      const body = rows.map((c) => [
        formatDateTime(c.fecha),
        `${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''}`.trim(),
        `${c.enfermera?.nombre || ''}`,
        c.tipo,
        `${c.presionSistolica || '-'}/${c.presionDiastolica || '-'}`,
        `${c.temperatura || '-'} C`,
        `${c.pulso || '-'}`,
        `${c.saturacionO2 || '-'}%`,
      ]);

      drawTable(doc, y, [['Fecha', 'Paciente', 'Enfermera', 'Tipo', 'Presion', 'Temp.', 'Pulso', 'O2']], body);

      doc.save('controles.pdf');
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
        title="Controles"
        actions={
          <>
            <Button variant="ghost" onClick={generatePdf} disabled={exporting}>
              <FileDown size={16} /> PDF
            </Button>
            {canWrite && (
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Nuevo control
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
              label="Tipo"
              value={filterState.tipo}
              onChange={(e) => applyFilters({ tipo: e.target.value })}
              className="w-40"
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
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
        isEmpty={!loading && !error && controles.length === 0}
        emptyMessage="Sin resultados"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }}
      >
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Paciente</TH>
              <TH>Enfermera</TH>
              <TH>Tipo</TH>
              <TH>PA</TH>
              <TH>FC</TH>
              <TH>Temp</TH>
              <TH>SpO₂</TH>
              {canWrite && <TH>Acciones</TH>}
            </TR>
          </THead>
          <TBody>
            {controles.map((c) => (
              <TR key={c.id}>
                <TD className="tabular-nums">{formatDateTime(c.fecha)}</TD>
                <TD>{[c.paciente?.nombre, c.paciente?.apellido].filter(Boolean).join(' ') || '-'}</TD>
                <TD>{[c.enfermera?.nombre, c.enfermera?.apellido].filter(Boolean).join(' ') || '-'}</TD>
                <TD>
                  <Badge tone={tipoControlTone[c.tipo] ?? 'neutral'}>{c.tipo}</Badge>
                </TD>
                <TD className="tabular-nums">
                  {c.presionSistolica ?? '-'}/{c.presionDiastolica ?? '-'}
                </TD>
                <TD className="tabular-nums">{c.pulso ?? '-'}</TD>
                <TD className="tabular-nums">{c.temperatura ?? '-'}°</TD>
                <TD className="tabular-nums">{c.saturacionO2 ?? '-'}%</TD>
                {canWrite && (
                  <TD>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingControl(c)}>
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </ListPage>

      <NuevoControlModal open={showModal} onOpenChange={setShowModal} onCreated={reload} />

      <ConfirmDialog
        open={!!deletingControl}
        onOpenChange={(open) => !open && setDeletingControl(null)}
        title="Eliminar control"
        description={deletingControl ? `¿Confirmas eliminar este control del ${formatDateTime(deletingControl.fecha)}?` : undefined}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
};

export default ControlesPage;
