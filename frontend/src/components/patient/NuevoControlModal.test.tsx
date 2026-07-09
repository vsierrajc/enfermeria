import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuevoControlModal } from './NuevoControlModal';
import { controlesService } from '../../api/controles.service';

vi.spyOn(controlesService, 'create').mockResolvedValue({ id: 99 } as any);

test('crea el control con el pacienteId preseleccionado', async () => {
  const onCreated = vi.fn();
  render(<NuevoControlModal open pacienteId={7} onOpenChange={() => {}} onCreated={onCreated} />);
  await userEvent.selectOptions(screen.getByLabelText(/tipo/i), 'RUTINARIO');
  await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
  expect(controlesService.create).toHaveBeenCalledWith(expect.objectContaining({ pacienteId: 7, tipo: 'RUTINARIO' }));
  expect(onCreated).toHaveBeenCalled();
});
