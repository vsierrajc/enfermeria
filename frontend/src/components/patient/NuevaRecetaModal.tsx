import { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { recetasService } from '../../api/recetas.service';
import { medicamentosService } from '../../api/medicamentos.service';
import { useAuth } from '../../hooks/useAuth';
import { PatientPicker } from './PatientPicker';
import type { Medicamento, Paciente, Receta } from '../../types';

type Props = {
  open: boolean;
  pacienteId?: number;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NuevaRecetaModal({ open, pacienteId, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [pickedPaciente, setPickedPaciente] = useState<Paciente | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicamentoId, setMedicamentoId] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [duracionDias, setDuracionDias] = useState('7');
  const [fechaInicio, setFechaInicio] = useState(today());
  const [fechaFin, setFechaFin] = useState('');
  const [medico, setMedico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    medicamentosService
      .findAll()
      .then(setMedicamentos)
      .catch(() => toast.error('No se pudieron cargar los medicamentos'));
  }, [open]);

  useEffect(() => {
    if (open && user) {
      setMedico(`${user.nombre} ${user.apellido}`.trim());
    }
  }, [open, user]);

  const reset = () => {
    setPickedPaciente(null);
    setMedicamentoId('');
    setDosis('');
    setFrecuencia('');
    setDuracionDias('7');
    setFechaInicio(today());
    setFechaFin('');
    setObservaciones('');
  };

  // Limpia el formulario al cerrar, para no reabrir con valores viejos.
  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleSubmit = async () => {
    const targetPacienteId = pacienteId ?? pickedPaciente?.id;
    if (!targetPacienteId) {
      toast.error('Selecciona un paciente');
      return;
    }
    if (!medicamentoId || !dosis.trim() || !frecuencia.trim() || !fechaInicio || !fechaFin) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const dto: Partial<Receta> = {
        pacienteId: targetPacienteId,
        medicamentoId: Number(medicamentoId),
        dosis,
        frecuencia,
        duracionDias: Number(duracionDias),
        fechaInicio,
        fechaFin,
        medico,
      };
      if (observaciones) dto.observaciones = observaciones;

      await recetasService.create(dto);
      toast.success('Receta formulada');
      onCreated();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'No se pudo formular');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Formular receta"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {pacienteId === undefined && (
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-faint font-medium">Paciente</span>
            <PatientPicker value={pickedPaciente} onChange={setPickedPaciente} />
          </div>
        )}
        <Select
          label="Medicamento"
          value={medicamentoId}
          onChange={(e) => setMedicamentoId(e.target.value)}
          className="col-span-2"
        >
          <option value="">Seleccionar...</option>
          {medicamentos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </Select>
        <Input label="Dosis" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="ej. 500 mg" />
        <Input
          label="Frecuencia"
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
          placeholder="ej. cada 8 horas"
        />
        <Input
          label="Duración (días)"
          type="number"
          value={duracionDias}
          onChange={(e) => setDuracionDias(e.target.value)}
        />
        <Input label="Médico" value={medico} onChange={(e) => setMedico(e.target.value)} />
        <Input label="Fecha inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        <Input label="Fecha fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        <Textarea
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="col-span-2"
        />
      </div>
    </Modal>
  );
}
