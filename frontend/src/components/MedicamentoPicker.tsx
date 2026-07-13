import { SearchSelect } from './SearchSelect';
import { medicamentosService } from '../api/medicamentos.service';
import type { Medicamento } from '../types';

type Props = {
  value: Medicamento | null;
  onChange: (value: Medicamento | null) => void;
  placeholder?: string;
  className?: string;
};

export function MedicamentoPicker({ value, onChange, placeholder = 'Buscar medicamento', className }: Props) {
  return (
    <SearchSelect<Medicamento>
      value={value}
      onChange={onChange}
      fetcher={(q) => medicamentosService.findAll({ q, limit: 8 }).then((r) => r.items)}
      getLabel={(m) => {
        const detalle = [m.presentacion, m.unidad].filter(Boolean).join(' ');
        return detalle ? `${m.nombre} · ${detalle}` : m.nombre;
      }}
      getKey={(m) => m.id}
      placeholder={placeholder}
      className={className}
    />
  );
}
