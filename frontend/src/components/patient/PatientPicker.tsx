import { pacientesService } from '../../api/pacientes.service';
import { formatDocumento } from '../../lib/documento';
import type { Paciente } from '../../types';
import { SearchSelect } from '../SearchSelect';

type Props = {
  value: Paciente | null;
  onChange: (value: Paciente | null) => void;
  placeholder?: string;
  className?: string;
};

export function PatientPicker({ value, onChange, placeholder = 'Buscar paciente por nombre o documento', className }: Props) {
  return (
    <SearchSelect<Paciente>
      value={value}
      onChange={onChange}
      fetcher={(q) => pacientesService.findAll({ q, limit: 8 }).then((r) => r.items)}
      getLabel={(p) => `${p.nombre} ${p.apellido} · ${formatDocumento(p)}`}
      getKey={(p) => p.id}
      placeholder={placeholder}
      className={className}
    />
  );
}
