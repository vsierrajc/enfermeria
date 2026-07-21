import { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { controlesService } from '../../api/controles.service';
import { motivosService } from '../../api/motivos.service';
import { PatientPicker } from './PatientPicker';
import { SuggestInput } from '../SuggestInput';
import type { Control, Paciente } from '../../types';

type Props = {
  open: boolean;
  pacienteId?: number;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const TIPOS: Control['tipo'][] = ['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'];

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NuevoControlModal({ open, pacienteId, onOpenChange, onCreated }: Props) {
  const [pickedPaciente, setPickedPaciente] = useState<Paciente | null>(null);
  const [tipo, setTipo] = useState<Control['tipo']>('RUTINARIO');
  const [fecha, setFecha] = useState(nowLocal());
  const [presionSistolica, setPresionSistolica] = useState('');
  const [presionDiastolica, setPresionDiastolica] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [pulso, setPulso] = useState('');
  const [saturacionO2, setSaturacionO2] = useState('');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setPickedPaciente(null);
    setTipo('RUTINARIO');
    setFecha(nowLocal());
    setPresionSistolica('');
    setPresionDiastolica('');
    setTemperatura('');
    setPulso('');
    setSaturacionO2('');
    setPeso('');
    setTalla('');
    setMotivo('');
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
    setSaving(true);
    try {
      const dto: Partial<Control> = { pacienteId: targetPacienteId, tipo, fecha };
      if (presionSistolica) dto.presionSistolica = Number(presionSistolica);
      if (presionDiastolica) dto.presionDiastolica = Number(presionDiastolica);
      if (temperatura) dto.temperatura = Number(temperatura);
      if (pulso) dto.pulso = Number(pulso);
      if (saturacionO2) dto.saturacionO2 = Number(saturacionO2);
      if (peso) dto.peso = Number(peso);
      if (talla) dto.talla = Number(talla);
      if (motivo) dto.motivo = motivo;
      if (observaciones) dto.observaciones = observaciones;

      await controlesService.create(dto);
      toast.success('Control registrado');
      onCreated();
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar signos vitales"
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
        <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Control['tipo'])}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input label="Fecha" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Input
          label="Presión sistólica"
          type="number"
          value={presionSistolica}
          onChange={(e) => setPresionSistolica(e.target.value)}
        />
        <Input
          label="Presión diastólica"
          type="number"
          value={presionDiastolica}
          onChange={(e) => setPresionDiastolica(e.target.value)}
        />
        <Input
          label="Temperatura (°C)"
          type="number"
          step="0.1"
          value={temperatura}
          onChange={(e) => setTemperatura(e.target.value)}
        />
        <Input label="Pulso (lpm)" type="number" value={pulso} onChange={(e) => setPulso(e.target.value)} />
        <Input
          label="Saturación O₂ (%)"
          type="number"
          value={saturacionO2}
          onChange={(e) => setSaturacionO2(e.target.value)}
        />
        <Input label="Peso (kg)" type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <Input label="Talla (cm)" type="number" value={talla} onChange={(e) => setTalla(e.target.value)} />
        <SuggestInput
          label="Motivo"
          value={motivo}
          onChange={setMotivo}
          fetcher={(q) => motivosService.search(q)}
          className="col-span-2"
        />
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
