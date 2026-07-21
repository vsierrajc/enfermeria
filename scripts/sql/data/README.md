# Datos de referencia

## `cie10.csv`

Catálogo CIE-10 (Clasificación Internacional de Enfermedades, 10.ª revisión)
usado por el selector de diagnóstico de las remisiones.

- **Fuente:** export oficial de la tabla de referencia CIE-10 de SISPRO/MinSalud
  (`TablaReferencia_CIE10__1.xlsx`, hoja `Table`). Referencia pública:
  https://web.sispro.gov.co/WebPublico/Consultas/ConsultarDetalleReferenciaBasica.aspx?Code=CIE10
- **Fecha del export (`Fecha_Actualizacion`):** 2025-11-23
- **Fecha de normalización:** 2026-07-16
- **Filas:** 12.634 códigos (todos `Habilitado='SI'`, `Tabla='CIE10'`).

### Mapeo aplicado

| Columna del export | Columna del CSV |
|--------------------|-----------------|
| `Codigo` (p. ej. `A000`, formato SISPRO sin punto, igual que RIPS) | `codigo` |
| `Nombre` (descripción diagnóstica específica) | `descripcion` |

Filtros: se conservan solo las filas con `Tabla = 'CIE10'` y
`Habilitado = 'SI'`. La descripción se recorta a 255 caracteres (la máxima real
del export es 241, así que no se pierde información).

> Nota: se mapea `Nombre`, **no** la columna `Descripcion` del export (esa es la
> etiqueta de categoría amplia, p. ej. `COLERA`).

### Regenerar

Si se actualiza el export oficial, reemplazar el `.xlsx` fuente y regenerar el
CSV con el script de normalización (SheetJS): leer la hoja `Table`, aplicar el
mapeo y los filtros de arriba, y escribir `codigo,descripcion` en CSV RFC4180.
