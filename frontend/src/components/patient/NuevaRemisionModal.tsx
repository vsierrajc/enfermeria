import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/Toast';
import { remisionesService } from '../../api/remisiones.service';
import type { Remision } from '../../types';

type Props = {
  open: boolean;
  pacienteId: number;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const TIPOS: Remision['tipo'][] = ['ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NuevaRemisionModal({ open, pacienteId, onOpenChange, onCreated }: Props) {
  const [tipo, setTipo] = useState<Remision['tipo']>('ESPECIALISTA');
  const [destino, setDestino] = useState('');
  const [fechaRemision, setFechaRemision] = useState(today());
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTipo('ESPECIALISTA');
    setDestino('');
    setFechaRemision(today());
    setMotivo('');
    setDiagnostico('');
    setObservaciones('');
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast.error('El motivo es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const dto: Partial<Remision> = { pacienteId, tipo, destino, fechaRemision, motivo };
      if (diagnostico) dto.diagnostico = diagnostico;
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
        <Textarea
          label="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="col-span-2"
          required
        />
        <Textarea
          label="Diagnóstico"
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
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
