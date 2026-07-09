import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Briefcase,
  FileDown,
  Mail,
  Phone,
  Plus,
  Send,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { pacientesService } from '../api/pacientes.service';
import { createPdf, addHeader, addFooter, drawTable, drawLabelValue, formatDate } from '../utils/pdf';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Tabs, TabPanel } from '../ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import { PatientHeader } from '../components/patient/PatientHeader';
import { AllergyBanner } from '../components/patient/AllergyBanner';
import { VitalsStrip } from '../components/patient/VitalsStrip';
import { ActivityTimeline } from '../components/patient/ActivityTimeline';
import type { Paciente } from '../types';

const tipoControlTone: Record<string, 'accent' | 'crit' | 'warn' | 'ok' | 'neutral'> = {
  RUTINARIO: 'accent',
  URGENTE: 'crit',
  SEGUIMIENTO: 'warn',
  INGRESO: 'ok',
  PERIODICO: 'neutral',
};

const estadoRemisionTone: Record<string, 'accent' | 'crit' | 'warn' | 'ok' | 'neutral'> = {
  PENDIENTE: 'warn',
  EN_CURSO: 'accent',
  FINALIZADO: 'ok',
};

const PacienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

  const loadPaciente = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await pacientesService.findOne(Number(id));
      setPaciente(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPaciente();
  }, [loadPaciente]);

  const generateHistoriaClinica = () => {
    if (!paciente) return;
    const doc = createPdf('Historia Clinica');
    let y = addHeader(doc, 'Historia Clinica', `${paciente.nombre} ${paciente.apellido} - DNI: ${paciente.dni}`);

    addFooter(doc, 1);

    drawLabelValue(doc, 14, y, 'Nombre:', `${paciente.nombre} ${paciente.apellido}`);
    drawLabelValue(doc, 14, y + 5, 'DNI:', paciente.dni);
    drawLabelValue(doc, 14, y + 10, 'Fecha Nacimiento:', formatDate(paciente.fechaNacimiento));
    drawLabelValue(doc, 110, y, 'Departamento:', paciente.departamento || '-');
    drawLabelValue(doc, 110, y + 5, 'Puesto:', paciente.puesto || '-');
    drawLabelValue(doc, 110, y + 10, 'Telefono:', paciente.telefono || '-');
    drawLabelValue(doc, 14, y + 15, 'Email:', paciente.email || '-');
    drawLabelValue(doc, 14, y + 20, 'Contacto Emergencia:', paciente.contactoEmergencia || '-');
    drawLabelValue(doc, 14, y + 25, 'Alergias:', paciente.alergias || 'Ninguna');

    y += 35;

    if (paciente.controles && paciente.controles.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Controles', 14, y);
      y += 3;

      const controlesBody = paciente.controles.map((c) => [
        formatDate(c.fecha),
        c.tipo,
        `${c.enfermera?.nombre || ''} ${c.enfermera?.apellido || ''}`.trim(),
        `${c.presionSistolica || '-'}/${c.presionDiastolica || '-'}`,
        `${c.temperatura || '-'} C`,
        `${c.pulso || '-'}`,
        `${c.saturacionO2 || '-'}%`,
      ]);
      y = drawTable(doc, y, [['Fecha', 'Tipo', 'Enfermera', 'Presion', 'Temp.', 'Pulso', 'O2']], controlesBody);
      y += 5;
    }

    if (paciente.recetas && paciente.recetas.length > 0) {
      if (y > 220) { doc.addPage(); addFooter(doc, 2); y = 35; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recetas', 14, y);
      y += 3;

      const recetasBody = paciente.recetas.map((r) => [
        r.medicamento?.nombre || '-',
        r.dosis,
        r.frecuencia,
        formatDate(r.fechaInicio),
        formatDate(r.fechaFin),
        r.medico,
      ]);
      y = drawTable(doc, y, [['Medicamento', 'Dosis', 'Frecuencia', 'Inicio', 'Fin', 'Medico']], recetasBody);
      y += 5;
    }

    if (paciente.remisiones && paciente.remisiones.length > 0) {
      if (y > 220) { doc.addPage(); addFooter(doc, 2); y = 35; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Remisiones', 14, y);
      y += 3;

      const remisionesBody = paciente.remisiones.map((r) => [
        formatDate(r.fechaRemision),
        r.tipo,
        r.destino,
        r.motivo,
        r.estado,
      ]);
      y = drawTable(doc, y, [['Fecha', 'Tipo', 'Destino', 'Motivo', 'Estado']], remisionesBody);
    }

    doc.save(`historia_clinica_${paciente.dni}.pdf`);
    toast.success('PDF generado');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No se pudo cargar el paciente"
        description="Verifica tu conexión e intenta de nuevo."
        action={<Button onClick={loadPaciente}>Reintentar</Button>}
      />
    );
  }

  const disabledTitle = 'Disponible en la siguiente tarea';

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/pacientes')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft size={15} />
        Pacientes
      </button>

      <PatientHeader paciente={paciente} />
      <AllergyBanner paciente={paciente} />

      <VitalsStrip controles={paciente.controles} themeKey={theme} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="primary" disabled title={disabledTitle}>
          <Plus size={16} /> Registrar signos vitales
        </Button>
        <Button disabled title={disabledTitle}>
          <Stethoscope size={16} /> Formular receta
        </Button>
        <Button disabled title={disabledTitle}>
          <Send size={16} /> Remitir
        </Button>
        <Button variant="ghost" className="ml-auto" onClick={generateHistoriaClinica}>
          <FileDown size={16} /> Historia clínica · PDF
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { value: 'resumen', label: 'Resumen' },
          { value: 'controles', label: 'Controles', count: paciente.controles?.length ?? 0 },
          { value: 'recetas', label: 'Recetas', count: paciente.recetas?.length ?? 0 },
          { value: 'remisiones', label: 'Remisiones', count: paciente.remisiones?.length ?? 0 },
        ]}
      >
        <TabPanel value="resumen">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text">Actividad reciente</h3>
              </CardHeader>
              <CardBody className="p-2">
                <ActivityTimeline paciente={paciente} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text">Ficha ocupacional</h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-1 p-2">
                <div className="flex items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Briefcase size={15} className="text-faint" /> Área · cargo
                  </span>
                  <span className="font-semibold text-text">
                    {[paciente.departamento, paciente.puesto].filter(Boolean).join(' · ') || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <UserRound size={15} className="text-faint" /> Contacto emerg.
                  </span>
                  <span className="font-semibold text-text">{paciente.contactoEmergencia || '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Phone size={15} className="text-faint" /> Teléfono
                  </span>
                  <span className="font-semibold text-text tabular-nums">{paciente.telefono || '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <Mail size={15} className="text-faint" /> Email
                  </span>
                  <span className="font-semibold text-text">{paciente.email || '-'}</span>
                </div>
              </CardBody>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="controles">
          <Card>
            {!paciente.controles || paciente.controles.length === 0 ? (
              <EmptyState icon={Stethoscope} title="Sin controles registrados" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Fecha</TH>
                    <TH>Tipo</TH>
                    <TH>PA</TH>
                    <TH>FC</TH>
                    <TH>Temp</TH>
                    <TH>SpO₂</TH>
                    <TH>Enfermera</TH>
                  </TR>
                </THead>
                <TBody>
                  {paciente.controles.map((c) => (
                    <TR key={c.id}>
                      <TD className="tabular-nums">{formatDate(c.fecha)}</TD>
                      <TD>
                        <Badge tone={tipoControlTone[c.tipo] ?? 'neutral'}>{c.tipo}</Badge>
                      </TD>
                      <TD className="tabular-nums">
                        {c.presionSistolica ?? '-'}/{c.presionDiastolica ?? '-'}
                      </TD>
                      <TD className="tabular-nums">{c.pulso ?? '-'}</TD>
                      <TD className="tabular-nums">{c.temperatura ?? '-'}°</TD>
                      <TD className="tabular-nums">{c.saturacionO2 ?? '-'}%</TD>
                      <TD>{[c.enfermera?.nombre, c.enfermera?.apellido].filter(Boolean).join(' ') || '-'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </TabPanel>

        <TabPanel value="recetas">
          <Card>
            {!paciente.recetas || paciente.recetas.length === 0 ? (
              <EmptyState icon={Stethoscope} title="Sin recetas registradas" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Medicamento</TH>
                    <TH>Dosis</TH>
                    <TH>Frecuencia</TH>
                    <TH>Duración</TH>
                    <TH>Médico</TH>
                  </TR>
                </THead>
                <TBody>
                  {paciente.recetas.map((r) => (
                    <TR key={r.id}>
                      <TD>{r.medicamento?.nombre || '-'}</TD>
                      <TD>{r.dosis}</TD>
                      <TD>{r.frecuencia}</TD>
                      <TD className="tabular-nums">{r.duracionDias} días</TD>
                      <TD>{r.medico}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </TabPanel>

        <TabPanel value="remisiones">
          <Card>
            {!paciente.remisiones || paciente.remisiones.length === 0 ? (
              <EmptyState icon={Send} title="Sin remisiones registradas" />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Fecha</TH>
                    <TH>Tipo</TH>
                    <TH>Destino</TH>
                    <TH>Motivo</TH>
                    <TH>Estado</TH>
                  </TR>
                </THead>
                <TBody>
                  {paciente.remisiones.map((r) => (
                    <TR key={r.id}>
                      <TD className="tabular-nums">{formatDate(r.fechaRemision)}</TD>
                      <TD>{r.tipo}</TD>
                      <TD>{r.destino}</TD>
                      <TD>{r.motivo}</TD>
                      <TD>
                        <Badge tone={estadoRemisionTone[r.estado] ?? 'neutral'}>{r.estado}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default PacienteDetailPage;
