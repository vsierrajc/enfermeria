import { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { remisionesService } from '../../api/remisiones.service';
import { motivosService } from '../../api/motivos.service';
import { cie10Service } from '../../api/cie10.service';
import { PatientPicker } from './PatientPicker';
import { SuggestInput } from '../SuggestInput';
import { SearchSelect } from '../SearchSelect';
import type { Remision, Paciente, Cie10 } from '../../types';

type Props = {
  open: boolean;
  pacienteId?: number;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const TIPOS: Remision['tipo'][] = ['ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NuevaRemisionModal({ open, pacienteId, onOpenChange, onCreated }: Props) {
  const [pickedPaciente, setPickedPaciente] = useState<Paciente | null>(null);
  const [tipo, setTipo] = useState<Remision['tipo']>('ESPECIALISTA');
  const [destino, setDestino] = useState('');
  const [fechaRemision, setFechaRemision] = useState(today());
  const [motivo, setMotivo] = useState('');
  const [cie10, setCie10] = useState<Cie10 | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPickedPaciente(null);
    setTipo('ESPECIALISTA');
    setDestino('');
    setFechaRemision(today());
    setMotivo('');
    setCie10(null);
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
    if (!motivo.trim()) {
      toast.error('El motivo es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const dto: Partial<Remision> = { pacienteId: targetPacienteId, tipo, destino, fechaRemision, motivo };
      if (cie10) dto.cie10Codigo = cie10.codigo;
      if (observaciones) dto.observaciones = observaciones;

      await remisionesService.create(dto);
      toast.success('Remisión creada');
      onCreated();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'No se pudo remitir');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Remitir paciente"
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
        <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Remision['tipo'])}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input label="Destino" value={destino} onChange={(e) => setDestino(e.target.value)} />
        <Input
          label="Fecha"
          type="date"
          value={fechaRemision}
          onChange={(e) => setFechaRemision(e.target.value)}
        />
        <div />
        <SuggestInput
          label="Motivo"
          value={motivo}
          onChange={setMotivo}
          fetcher={(q) => motivosService.search(q)}
          required
          className="col-span-2"
        />
        <div className="col-span-2 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-faint font-medium">Diagnóstico (CIE-10)</span>
          <SearchSelect<Cie10>
            value={cie10}
            onChange={setCie10}
            fetcher={(q) => cie10Service.search(q)}
            getLabel={(c) => `${c.codigo} — ${c.descripcion}`}
            getKey={(c) => c.codigo}
            placeholder="Buscar por código o descripción"
          />
        </div>
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
