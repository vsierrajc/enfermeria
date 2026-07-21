# Diseño: búsqueda case-insensitive + UX de autocompletes

**Fecha:** 2026-07-14
**Estado:** Aprobado por Omar

## Contexto

Los formularios de recetas y controles ya usan autocompletes
(`PatientPicker`, `MedicamentoPicker`, ambos sobre `SearchSelect`), pero se
sienten rotos por dos causas:

1. **Bug:** las búsquedas del backend usan `contains` sin
   `mode: 'insensitive'`. En PostgreSQL eso es case-sensitive: `q=juan`
   devuelve 0 resultados aunque exista "Juan" (verificado contra la API).
2. **Vacíos de UX** en `SearchSelect`: no muestra opciones al enfocar con el
   input vacío, no tiene estados de carga ni de "sin resultados", no hay
   botón para limpiar, y la selección no tiene indicador visual.

## Backend

Agregar `mode: 'insensitive'` a todos los filtros `contains`:

- `empleados/pacientes.service.ts` — nombre, apellido, dni (o
  `numeroDocumento` tras el cambio de documento).
- `enfermeras/enfermeras.service.ts` — usuario, nombre, apellido, matricula.
- `medicamentos/medicamentos.service.ts` — nombre.

Insensibilidad a tildes (unaccent) queda fuera de alcance.

## Frontend — `SearchSelect`

Mejoras conservando la estructura, el debounce (250 ms) y la accesibilidad
(roles combobox/listbox, aria-activedescendant) existentes:

1. **Browse al enfocar:** con el input vacío, al recibir foco se ejecuta
   `fetcher('')` y se muestran las primeras opciones (los servicios ya
   devuelven la primera página cuando `q` está vacío). Deja de ser
   obligatorio adivinar qué escribir.
2. **Estado de carga:** fila "Buscando…" en el dropdown mientras hay un
   fetch pendiente.
3. **Estado vacío:** fila "Sin resultados" cuando la búsqueda termina sin
   matches (dropdown abierto, no cerrado en silencio).
4. **Botón limpiar (×):** visible cuando hay selección o texto; resetea
   `value` y `query` y devuelve el foco al input.
5. **Indicador de selección:** icono de check (lucide) a la derecha del
   input cuando hay un valor seleccionado; desaparece al teclear (la
   des-selección deja de ser invisible).

Sin cambios de API en los consumidores: `PatientPicker`, `MedicamentoPicker`
y los filtros de páginas siguen funcionando igual.

## Tests

- `SearchSelect.test.tsx`: casos nuevos — browse al enfocar, "Buscando…",
  "Sin resultados", botón limpiar, indicador de selección.
- `MedicamentoPicker.test.tsx` / páginas: ajustar mocks si aplica.

## Verificación

1. `npm run test` (frontend) en verde.
2. End-to-end real: en "Nueva receta", buscar paciente en minúsculas
   (ej. "juan") y ver resultados; enfocar el picker de medicamento sin
   escribir y ver el catálogo; limpiar con × y re-seleccionar.

## Fuera de alcance

- Búsqueda insensible a tildes (extensión `unaccent` / normalización).
- Reemplazo de `SearchSelect` por librería externa.
- Virtualización o paginación dentro del dropdown.
