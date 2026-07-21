# Rediseño UI "Clínico Sereno" — Hito 1: Fundación + Ficha del Paciente

**Fecha:** 2026-07-09
**Autor:** Omar (OAVA Solutions) + Claude
**Estado:** Aprobado (dirección visual validada con mockup)

## Contexto

El frontend actual (React CRA, 100% estilos inline, sin componentes, no
responsive) es funcional pero se siente "AI slop". La usuaria es una
**doctora-administradora que hace de todo** (atiende, registra, revisa, gestiona)
y está acostumbrada a sistemas clínicos lentos y feos. El objetivo es un
rediseño integral que la sorprenda. El pecado UX más grave hoy: la **ficha del
paciente es solo lectura**, así que registrar signos/recetas/remisiones exige
salir, ir a otra página y re-buscar al paciente (12–15 clics por encuentro).

Este es el **Hito 1**: la fundación de diseño + la ficha del paciente como
centro de acción. El resto de pantallas vienen en hitos posteriores.

## Decisiones tomadas

1. **Usuario:** administradora que hace todo → todo debe ser rápido y fluido.
2. **Estética "Clínico Sereno"** (validada con mockup): teal **apagado/desaturado**
   (acento `#3B7A70` en claro, `#5AA79B` en oscuro), neutros fríos, mucho aire,
   esquinas suaves. Serena pero con afordances de velocidad (buscador ⌘K,
   acciones rápidas).
3. **Colores configurables desde un solo lugar** (requisito explícito): la paleta
   vive como tokens centrales; cambiar el look = editar un archivo.
4. **Base técnica:** migrar CRA → **Vite + React 18 + TS**; **Tailwind** (mapeado
   a los tokens) + **Radix UI** (primitivas accesibles) + **lucide-react** (iconos).
5. **Alcance Hito 1:** sistema de diseño + shell/login + ficha del paciente.

## Principios anti-"AI slop" (checklist vinculante)

Estos son requisitos, no sugerencias — verificables en revisión:
- Acento **desaturado**; **sin** sombras "glow" de color ni gradientes decorativos.
- **Sin** puntos de estado decorativos/palpitantes en chips.
- **Sin em dashes** en la copy; usar `:` o `·`. Copy en es_CO, voz activa.
- Iconos **lucide** (nunca emojis).
- Números **tabulares** para datos clínicos (`tabular-nums`).
- Estados reales: **skeletons** al cargar, **empty states** con acción, errores
  inline claros. Nada de `window.confirm` ni fallos solo en consola.

## Arquitectura y estructura

- **Migración Vite:** nuevo `index.html`, `vite.config.ts`, scripts. El
  `frontend/Dockerfile` pasa a copiar `dist/` (salida de Vite) en vez de `build/`;
  nginx y el proxy `/api` **no cambian**.
- **Tokens de tema — fuente única de color/espaciado/radio:** `src/theme/tokens.css`
  con variables CSS en `:root` (claro) y overrides de tema oscuro. `tailwind.config`
  mapea los colores a `var(--...)`, de modo que **cambiar la paleta = editar
  `tokens.css`** (cumple el requisito de configurabilidad). Nombres semánticos:
  `--bg, --surface, --surface-2, --border, --border-strong, --text, --muted,
  --faint, --accent, --accent-strong, --accent-soft, --ok/-soft, --warn/-soft,
  --crit/-soft`, más radios/sombras/espaciado.
- **Tipografía:** Inter auto-hospedada (sin CDN, para evitar fallback silencioso),
  con escala definida.
- **Capa de primitivas `src/ui/`:** `Button, Card, Input, Select, Textarea, Badge,
  Table, Skeleton, EmptyState, Modal (Radix Dialog), Tabs (Radix Tabs),
  Toast, DropdownMenu`. Reemplaza toda la duplicación inline actual.
- **Componentes `src/components/`:** `AppShell` (sidebar + topbar), `Sidebar`,
  `CommandPalette` (⌘K), `PatientHeader`, `VitalsStrip`, `AllergyBanner`,
  `Timeline`.
- **Datos:** se reutilizan los `*.service.ts` existentes y el `axios` con su
  interceptor. `pacientes.findOne` ya devuelve `controles/recetas/remisiones`
  anidados. Los services de crear control/receta/remisión ya existen.

## Ficha del Paciente (flujo estrella)

- **PatientHeader:** nombre, DNI, edad, área/cargo/turno, chips de estado, estado
  de **apto laboral**, y **AllergyBanner** prominente cuando hay alergias.
- **VitalsStrip:** PA / FC / Temp / SpO₂ / Peso con valor tabular, delta vs. control
  previo y **sparkline de tendencia por paciente** (algo que hoy no existe).
- **Acciones en contexto:** "Registrar signos vitales", "Formular receta",
  "Remitir" abren modales Radix con **el paciente actual ya preseleccionado**
  (elimina el re-buscar). Botón "Historia clínica · PDF".
- **Tabs:** Resumen (timeline de actividad + ficha ocupacional), Controles,
  Recetas, Remisiones. Cada tab con su acción "+ Nuevo" en contexto.

## Fuera de alcance (Hito 1)

- Resto de pantallas: listas/catálogos, dashboard, estadísticas, admin → hitos
  siguientes (H2–H4).
- Cambios de backend (salvo que la migración lo exija). Sin migración de datos.
- Gating de roles completo (CONSULTA read-only) → hito admin; en H1 solo se deja
  la estructura para soportarlo.
- Dark mode se incluye a nivel de tokens (light-first, oscuro cuidado, no invertido).

## Criterios de éxito

1. La app corre en **Vite**; `npm run build` produce `dist/`; el Dockerfile del
   frontend queda actualizado y el stack sigue levantando (nginx/proxy intactos).
2. **Cambiar toda la paleta editando solo `src/theme/tokens.css`** se refleja en
   toda la UI (claro y oscuro).
3. En la ficha del paciente se puede **registrar signos/receta/remisión sin salir
   ni re-buscar** al paciente.
4. Se ven **sparklines de tendencia por paciente** en los signos vitales.
5. Estados de carga/vacío/error consistentes; sin `window.confirm`; sin emojis ni
   em dashes; iconos lucide.
6. Responsive hasta móvil; foco de teclado visible; `prefers-reduced-motion`
   respetado.
