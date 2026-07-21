# Rediseño "Clínico Sereno" — Hito 1 · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el frontend a Vite + Tailwind + Radix con un sistema de diseño "Clínico Sereno" de colores configurables, y convertir la ficha del paciente en el centro de acción (registrar signos/recetas/remisiones en contexto, con tendencias de signos vitales).

**Architecture:** Toolchain Vite (reemplaza CRA) conservando `build/` como salida y la variable `REACT_APP_API_URL` para no tocar Dockerfile/nginx/compose; un dev-proxy de Vite enruta `/api` al backend. La paleta vive en un único `src/theme/tokens.css` (variables CSS) que Tailwind consume vía `var(--...)`. Primitivas accesibles con Radix. La ficha del paciente reusa los `*.service.ts` existentes.

**Tech Stack:** Vite 5, React 18, TypeScript, TailwindCSS 3, Radix UI, lucide-react, Vitest + React Testing Library, chart.js (ya presente) para sparklines.

## Global Constraints

- Estética "Clínico Sereno": acento desaturado `#3B7A70` (claro) / `#5AA79B` (oscuro). Verbatim del mockup aprobado `scratchpad/ficha-paciente-mockup.html` (fuente visual de verdad).
- **Colores configurables desde un solo archivo:** toda la paleta en `src/theme/tokens.css`; cambiar el look = editar ese archivo. Ningún hex hardcodeado en componentes.
- Checklist anti-slop (vinculante): sin sombras "glow" de color, sin gradientes decorativos, sin puntos de estado decorativos, **sin em dashes** en copy (usar `:` o `·`), iconos **lucide** (nunca emoji), números `tabular-nums` en datos clínicos.
- No tocar backend, nginx, ni la ruta relativa `/api`. Salida de build en `build/` (Dockerfile intacto).
- Copy en es_CO, voz activa. Código en inglés.
- Responsive hasta móvil; foco de teclado visible; `prefers-reduced-motion` respetado.

## Estructura de archivos (nuevos/afectados)

```
frontend/
  index.html                      (MOVER desde public/ a raíz; Vite lo requiere en root)
  vite.config.ts                  (NUEVO)
  tailwind.config.ts              (NUEVO)
  postcss.config.js               (NUEVO)
  vitest.config.ts / setup        (NUEVO)
  package.json                    (MODIFICAR deps + scripts)
  tsconfig.json                   (MODIFICAR para Vite/bundler)
  src/
    main.tsx                      (RENOMBRAR de index.tsx; importa tokens.css + index.css)
    theme/
      tokens.css                  (NUEVO — paleta única configurable)
      index.css                   (NUEVO — @tailwind + base)
    lib/
      cn.ts                       (NUEVO — helper clsx/tailwind-merge)
      format.ts                   (NUEVO — calcAge, formatFecha, vitalsDelta)
    ui/                           (NUEVO — primitivas)
      Button.tsx Card.tsx Input.tsx Select.tsx Textarea.tsx Badge.tsx
      Table.tsx Skeleton.tsx EmptyState.tsx Modal.tsx Tabs.tsx Dropdown.tsx
    components/
      AppShell.tsx Sidebar.tsx CommandPalette.tsx
      patient/PatientHeader.tsx patient/AllergyBanner.tsx
      patient/VitalsStrip.tsx patient/Sparkline.tsx patient/ActivityTimeline.tsx
      patient/NuevoControlModal.tsx patient/NuevaRecetaModal.tsx patient/NuevaRemisionModal.tsx
    pages/LoginPage.tsx PacienteDetailPage.tsx  (REDISEÑAR)
```

Firmas existentes que se reutilizan (no cambian):
- `pacientesService.findOne(id: number): Promise<Paciente>` — devuelve `controles/recetas/remisiones` anidados.
- `controlesService.create(dto: Partial<Control>): Promise<Control>`
- `recetasService.create(dto: Partial<Receta>): Promise<Receta>`, `medicamentosService.findAll(params?): Promise<Medicamento[]>`
- `remisionesService.create(dto: Partial<Remision>): Promise<Remision>`
- `useAuth(): { user, isAdmin, ... }`
- Tipos en `src/types/index.ts` (`Paciente`, `Control` con enum `tipo`, `Receta`, `Remision`, etc.).

---

### Task 1: Migrar toolchain CRA → Vite

**Files:**
- Create: `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`
- Move: `frontend/public/index.html` → `frontend/index.html`
- Rename: `frontend/src/index.tsx` → `frontend/src/main.tsx`
- Modify: `frontend/package.json`, `frontend/tsconfig.json`

**Interfaces:**
- Consumes: nada.
- Produces: app corriendo en Vite; `import.meta.env`/`process.env.REACT_APP_API_URL` inyectado; scripts `dev`/`build`/`preview`/`test`.

- [ ] **Step 1: Instalar dependencias de build/test**

Run:
```bash
cd frontend
npm install -D vite@^5 @vitejs/plugin-react@^4 vitest@^1 jsdom@^24 \
  @testing-library/react@^14 @testing-library/jest-dom@^6 @testing-library/user-event@^14
npm uninstall react-scripts
```
Expected: instala sin errores; `react-scripts` desaparece de `package.json`.

- [ ] **Step 2: Mover `index.html` a la raíz y adaptarlo**

Mueve `frontend/public/index.html` a `frontend/index.html`. Reemplaza el `<style>` inline y el cierre por el punto de montaje de Vite:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#3B7A70" />
  <meta name="description" content="Sistema de Control de Enfermería" />
  <title>Enfermería · Sistema de Control</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 3: Renombrar `index.tsx` → `main.tsx`**

`git mv src/index.tsx src/main.tsx`. Contenido igual (aún sin imports de CSS; se añaden en Task 2).

- [ ] **Step 4: Crear `vite.config.ts` (proxy /api, outDir build, env)**

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // carga todas las vars, sin filtro de prefijo
  return {
    plugins: [react()],
    // Mantiene el nombre REACT_APP_API_URL para no tocar Dockerfile/compose.
    // Por defecto '' => baseURL relativa '/api' (proxy en dev, nginx en prod).
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL ?? ''),
    },
    server: {
      port: 3000,
      proxy: { '/api': 'http://localhost:3001' }, // dev: enruta /api al backend
    },
    build: { outDir: 'build' }, // conserva la salida que el Dockerfile ya copia
  };
});
```

- [ ] **Step 5: Actualizar scripts y tsconfig**

En `frontend/package.json` reemplaza el bloque `scripts` por:
```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
```
En `frontend/tsconfig.json`, asegura `"moduleResolution": "bundler"` (o `"node"`), `"module": "ESNext"`, `"target": "ES2020"`, `"jsx": "react-jsx"`, `"types": ["vite/client", "@testing-library/jest-dom"]`, y `"skipLibCheck": true`.

- [ ] **Step 6: Configurar Vitest**

`frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts' },
});
```
`frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Verificar dev y build**

Run: `npm run dev` → abre en http://localhost:3000, la app carga con las páginas actuales (estilos viejos) y el login funciona contra el backend vía proxy.
Run (detén dev con Ctrl+C, luego): `npm run build`
Expected: compila sin errores de TS y genera `frontend/build/`.

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "build(frontend): migra de CRA a Vite (conserva build/ y REACT_APP_API_URL)"
```

---

### Task 2: Sistema de tema — tokens configurables + Tailwind + Inter

**Files:**
- Create: `frontend/src/theme/tokens.css`, `frontend/src/theme/index.css`, `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/src/lib/cn.ts`
- Modify: `frontend/src/main.tsx` (importar CSS)

**Interfaces:**
- Consumes: Task 1 (Vite).
- Produces: clases Tailwind mapeadas a tokens (`bg-surface`, `text-muted`, `text-accent`, etc.); helper `cn(...classes)`.

- [ ] **Step 1: Instalar Tailwind, Inter y utilidades de clases**

Run:
```bash
cd frontend
npm install -D tailwindcss@^3 postcss@^8 autoprefixer@^10
npm install clsx tailwind-merge @fontsource/inter
```

- [ ] **Step 2: `postcss.config.js`**

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 3: `src/theme/tokens.css` — paleta ÚNICA configurable**

Copia los tokens del mockup aprobado (valores verbatim de `scratchpad/ficha-paciente-mockup.html`):
```css
:root {
  --bg:#EDF3F1; --surface:#FFFFFF; --surface-2:#F5F9F7; --border:#DCE6E3; --border-strong:#C6D4D0;
  --text:#15302B; --muted:#5C716C; --faint:#8A949E;
  --accent:#3B7A70; --accent-strong:#2C5E56; --accent-soft:#E7EFEC;
  --ok:#2E9E6A; --ok-soft:#DBF0E4; --warn:#C7890B; --warn-soft:#F7ECCE; --crit:#D9564F; --crit-soft:#FBE3E1;
  --radius:16px; --radius-sm:10px;
  --shadow-sm:0 1px 2px rgba(19,48,43,.05);
  --shadow:0 1px 2px rgba(19,48,43,.04), 0 6px 20px rgba(19,48,43,.06);
}
:root[data-theme="dark"], html.dark {
  --bg:#0C1614; --surface:#11201D; --surface-2:#152925; --border:#223A34; --border-strong:#2C4841;
  --text:#E7F0ED; --muted:#9DB2AC; --faint:#6D827C;
  --accent:#5AA79B; --accent-strong:#7CBEB2; --accent-soft:#18322E;
  --ok:#46B681; --ok-soft:#123528; --warn:#E0A62A; --warn-soft:#352C11; --crit:#E87066; --crit-soft:#35201E;
  --shadow-sm:0 1px 2px rgba(0,0,0,.3);
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.35);
}
```

- [ ] **Step 4: `tailwind.config.ts` mapeando a los tokens**

```ts
import type { Config } from 'tailwindcss';
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
        border: 'var(--border)', 'border-strong': 'var(--border-strong)',
        text: 'var(--text)', muted: 'var(--muted)', faint: 'var(--faint)',
        accent: 'var(--accent)', 'accent-strong': 'var(--accent-strong)', 'accent-soft': 'var(--accent-soft)',
        ok: 'var(--ok)', 'ok-soft': 'var(--ok-soft)', warn: 'var(--warn)', 'warn-soft': 'var(--warn-soft)',
        crit: 'var(--crit)', 'crit-soft': 'var(--crit-soft)',
      },
      borderRadius: { DEFAULT: 'var(--radius)', sm: 'var(--radius-sm)' },
      boxShadow: { sm: 'var(--shadow-sm)', DEFAULT: 'var(--shadow)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: `src/theme/index.css`**

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  html { font-feature-settings: "cv05","ss01"; }
  body { @apply bg-bg text-text font-sans antialiased; }
  .tnum { font-variant-numeric: tabular-nums; }
}
```

- [ ] **Step 6: `src/lib/cn.ts` y wire en main.tsx**

`src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
```
En `src/main.tsx` añade al inicio: `import './theme/tokens.css'; import './theme/index.css';`

- [ ] **Step 7: Verificar tokens y configurabilidad**

Run: `npm run dev`. Añade temporalmente `<div className="bg-accent text-surface p-4 rounded">Prueba</div>` en `App.tsx`; confirma el color teal.
Prueba de configurabilidad: cambia `--accent` en `tokens.css` a `#8844AA`; el bloque cambia sin tocar componentes. Revierte el cambio y borra el div de prueba.

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "feat(theme): tokens de color configurables + Tailwind + Inter"
```

---

### Task 3: Primitivas UI base (Button, Card, Input, Select, Textarea, Badge, Table, Skeleton, EmptyState)

**Files:**
- Create: `frontend/src/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Badge.tsx`, `Table.tsx`, `Skeleton.tsx`, `EmptyState.tsx`
- Test: `frontend/src/ui/Button.test.tsx`, `frontend/src/ui/Badge.test.tsx`

**Interfaces:**
- Consumes: `cn` (Task 2), tokens.
- Produces:
  - `Button({ variant?: 'primary'|'default'|'ghost'; size?: 'sm'|'md'; ...ButtonHTMLAttributes })`
  - `Card`, `CardHeader`, `CardBody` (div wrappers con estilo token)
  - `Input`, `Textarea`, `Select` (con `label?`, `error?`)
  - `Badge({ tone: 'accent'|'ok'|'warn'|'crit'|'neutral' })`
  - `Skeleton({ className? })`, `EmptyState({ icon, title, description?, action? })`

- [ ] **Step 1: Test de `Button` (variantes + click)**

`src/ui/Button.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('renderiza y dispara onClick', async () => {
  const onClick = vi.fn();
  render(<Button variant="primary" onClick={onClick}>Guardar</Button>);
  const btn = screen.getByRole('button', { name: 'Guardar' });
  expect(btn.className).toContain('bg-accent');
  await userEvent.click(btn);
  expect(onClick).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Ejecutar test (debe fallar)**

Run: `npx vitest run src/ui/Button.test.tsx`
Expected: FAIL (no existe `./Button`).

- [ ] **Step 3: Implementar `Button.tsx`**

```tsx
import { cn } from '../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'ghost';
  size?: 'sm' | 'md';
};

const variants = {
  primary: 'bg-accent text-white border border-accent hover:bg-accent-strong',
  default: 'bg-surface text-text border border-border hover:border-border-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface-2 hover:text-text',
};

export function Button({ variant = 'default', size = 'md', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        size === 'sm' ? 'text-[13px] px-3 py-2' : 'text-sm px-4 py-2.5',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Verificar test de Button pasa**

Run: `npx vitest run src/ui/Button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implementar Card, Input, Select, Textarea, Skeleton, EmptyState y Badge**

Cada uno estilizado con clases-token (sin hex). Guía visual: el mockup aprobado. Requisitos por componente:
- `Card`: `rounded bg-surface border border-border shadow-sm`; `CardHeader` con `border-b border-border p-4`; `CardBody` `p-4`.
- `Input`/`Textarea`/`Select`: `w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-accent`; con `label` en `<label class="text-xs uppercase tracking-wide text-faint font-medium">` y `error` en `text-crit text-xs`.
- `Badge`: mapa `tone → 'bg-<tone>-soft text-<tone>'`; `rounded-sm px-2 py-0.5 text-xs font-semibold`. SIN puntos decorativos.
- `Table`: wrapper de `<table class="w-full border-collapse">` dentro de `<div class="overflow-x-auto">`; `<thead>` con `th` `text-xs uppercase tracking-wide text-faint border-b border-border`; `td` `text-sm border-b border-border py-3`; fila `hover:bg-surface-2`. Exporta `Table, THead, TR, TH, TD` o un `Table` que reciba `columns`/`rows` — elige el patrón más simple y úsalo consistente en Task 7.
- `Skeleton`: `animate-pulse rounded bg-surface-2` (respeta `prefers-reduced-motion` vía Tailwind `motion-reduce:animate-none`).
- `EmptyState`: centrado, `icon` (lucide) en `text-faint`, `title` `text-text font-semibold`, `description` `text-muted text-sm`, `action` opcional.

`Badge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
test('aplica el tono', () => {
  render(<Badge tone="crit">Urgente</Badge>);
  expect(screen.getByText('Urgente').className).toContain('text-crit');
});
```

- [ ] **Step 6: Ejecutar toda la suite de ui**

Run: `npx vitest run src/ui`
Expected: PASS (Button + Badge).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/ui frontend/src/lib
git commit -m "feat(ui): primitivas base (Button, Card, Input, Badge, Skeleton, EmptyState)"
```

---

### Task 4: Primitivas de superposición Radix (Modal, Tabs, Dropdown) + Toast

**Files:**
- Create: `frontend/src/ui/Modal.tsx`, `Tabs.tsx`, `Dropdown.tsx`, `Toast.tsx`
- Modify: `frontend/src/App.tsx` (usar el Toaster estilizado)
- Test: `frontend/src/ui/Modal.test.tsx`

**Interfaces:**
- Consumes: primitivas Task 3, `cn`.
- Produces:
  - `Modal({ open, onOpenChange, title, children, footer? })` (Radix Dialog).
  - `Tabs({ tabs: {value,label,count?}[], value, onValueChange, children })` + `TabPanel({ value })` (Radix Tabs).
  - `Dropdown` (Radix DropdownMenu) para menús de fila.
  - `toast` reexport estilizado (se mantiene `react-hot-toast`).

- [ ] **Step 1: Instalar Radix**

Run: `cd frontend && npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-dropdown-menu`

- [ ] **Step 2: Test de Modal (abre/cierra por prop)**

`src/ui/Modal.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';
test('muestra el contenido cuando open=true', () => {
  render(<Modal open onOpenChange={() => {}} title="Nuevo control"><p>Formulario</p></Modal>);
  expect(screen.getByText('Nuevo control')).toBeInTheDocument();
  expect(screen.getByText('Formulario')).toBeInTheDocument();
});
```

- [ ] **Step 3: Ejecutar test (falla)**

Run: `npx vitest run src/ui/Modal.test.tsx` → FAIL (no existe `./Modal`).

- [ ] **Step 4: Implementar Modal con Radix Dialog**

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ open, onOpenChange, title, children, footer }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in motion-reduce:animate-none" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(560px,92vw)] max-h-[88vh] overflow-auto -translate-x-1/2 -translate-y-1/2 rounded bg-surface border border-border shadow p-5 focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-text">{title}</Dialog.Title>
            <Dialog.Close className="text-muted hover:text-text"><X size={18} /></Dialog.Close>
          </div>
          {children}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 5: Verificar Modal pasa; implementar Tabs, Dropdown, Toast**

Run: `npx vitest run src/ui/Modal.test.tsx` → PASS.
Luego implementa `Tabs.tsx` (Radix Tabs; trigger activo `text-accent-strong border-b-2 border-accent`, count en `Badge tone="neutral"`), `Dropdown.tsx` (Radix DropdownMenu con items `hover:bg-surface-2`), y `Toast.tsx` que reexporta `toast` de react-hot-toast y un `<AppToaster/>` con estilos token. En `App.tsx` reemplaza `<Toaster position="top-right" />` por `<AppToaster />`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/ui frontend/src/App.tsx
git commit -m "feat(ui): Modal/Tabs/Dropdown Radix + Toaster estilizado"
```

---

### Task 5: App shell (Sidebar + topbar), tema claro/oscuro y Login rediseñado

**Files:**
- Create: `frontend/src/components/AppShell.tsx`, `Sidebar.tsx`, `frontend/src/hooks/useTheme.ts`
- Modify: `frontend/src/components/layout/Layout.tsx` (o reemplazar su uso por `AppShell`), `frontend/src/pages/LoginPage.tsx`
- Test: `frontend/src/hooks/useTheme.test.ts`

**Interfaces:**
- Consumes: primitivas (Tasks 3-4), `useAuth`.
- Produces: `<AppShell>` con `<Outlet/>`; `useTheme(): { theme, toggle }` que fija `data-theme` en `<html>` y respeta `prefers-color-scheme`.

- [ ] **Step 1: Test de useTheme (alterna y persiste)**

`src/hooks/useTheme.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
test('alterna el tema y lo escribe en <html>', () => {
  const { result } = renderHook(() => useTheme());
  const inicial = result.current.theme;
  act(() => result.current.toggle());
  expect(result.current.theme).not.toBe(inicial);
  expect(document.documentElement.getAttribute('data-theme')).toBe(result.current.theme);
});
```

- [ ] **Step 2: Ejecutar (falla) → implementar `useTheme.ts`**

Run: `npx vitest run src/hooks/useTheme.test.ts` → FAIL.
Implementa `useTheme` leyendo `localStorage['theme']` o `matchMedia('(prefers-color-scheme: dark)')`, aplicando `document.documentElement.setAttribute('data-theme', theme)` y persistiendo. `toggle()` invierte. Run de nuevo → PASS.

- [ ] **Step 3: Implementar Sidebar + AppShell**

`Sidebar.tsx`: navegación con iconos **lucide** (LayoutDashboard, Users, Activity, Pill, Send, Stethoscope, BarChart3, UserCog), item activo `bg-accent-soft text-accent-strong`, ocultar "Personal" si `!isAdmin`, chip de usuario abajo, botón cerrar sesión (`logout`). Marca textual sin gradiente. Estructura/estilo verbatim del mockup (sin emojis).
`AppShell.tsx`: grid `sidebar + main`; topbar con disparador de CommandPalette (Task 6 lo conecta; por ahora un botón "Buscar ⌘K" inerte), toggle de tema (`useTheme`), y `<Outlet/>`. Responsive: sidebar colapsa en móvil.

- [ ] **Step 4: Cablear AppShell en el router**

En `App.tsx`, sustituye `<Layout />` por `<AppShell />` en la ruta padre `/`. Verifica que todas las páginas siguen renderizando dentro del shell.

- [ ] **Step 5: Rediseñar LoginPage con primitivas**

Reescribe `LoginPage.tsx` usando `Card`, `Input`, `Button`. Mantén la lógica: `useAuth().login(usuario, password)` → `navigate('/dashboard')`; estado `loading`; error inline con `text-crit` (mensaje `err.response?.data?.message ?? 'Credenciales inválidas'`). Fondo sereno con tokens (sin gradiente neón). Copy sin em dashes.

- [ ] **Step 6: Verificar**

Run: `npm run dev`. Confirma: login rediseñado entra al sistema; el shell muestra sidebar + topbar; el toggle claro/oscuro cambia toda la UI; navegación entre páginas funciona.
Run: `npx vitest run` → toda la suite PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat(shell): AppShell + Sidebar + tema claro/oscuro + Login rediseñado"
```

---

### Task 6: CommandPalette (⌘K) — saltar a paciente o acción

**Files:**
- Create: `frontend/src/components/CommandPalette.tsx`
- Modify: `frontend/src/components/AppShell.tsx` (montar y abrir con ⌘K)
- Test: `frontend/src/components/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `pacientesService.findAll({ q })`, `useNavigate`, Modal.
- Produces: `<CommandPalette open onOpenChange />` que busca pacientes (server-side `q`) y ofrece acciones de navegación; al elegir, navega (`/pacientes/:id` o rutas fijas).

- [ ] **Step 1: Test (abre con Ctrl/⌘+K y filtra)**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

test('muestra acciones fijas al abrir', () => {
  render(<MemoryRouter><CommandPalette open onOpenChange={() => {}} /></MemoryRouter>);
  expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  expect(screen.getByText(/Ir a Pacientes/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Ejecutar (falla) → implementar CommandPalette**

Usa `Modal` como contenedor, un `Input` de búsqueda con debounce (250ms) que llama `pacientesService.findAll({ q })`, lista resultados (nombre + DNI, mono) y una sección de acciones fijas ("Ir a Pacientes", "Ir a Controles", "Ir a Estadística"). Navegación con teclado (flechas + Enter). Al seleccionar paciente: `navigate('/pacientes/'+id)` y cierra.

- [ ] **Step 3: Montar en AppShell con atajo global**

En `AppShell.tsx`, `useEffect` con listener `keydown`: si `(e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'` → `e.preventDefault(); setOpen(true)`. El botón "Buscar ⌘K" del topbar también abre.

- [ ] **Step 4: Verificar**

Run: `npx vitest run src/components/CommandPalette.test.tsx` → PASS.
Run: `npm run dev` → ⌘K abre el buscador, escribir filtra pacientes, Enter navega.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(shell): CommandPalette global (⌘K) para saltar a paciente/acción"
```

---

### Task 7: Ficha del paciente — cabecera, signos con sparklines, tabs y datos

**Files:**
- Create: `frontend/src/lib/format.ts`, `frontend/src/components/patient/Sparkline.tsx`, `PatientHeader.tsx`, `AllergyBanner.tsx`, `VitalsStrip.tsx`, `ActivityTimeline.tsx`
- Modify: `frontend/src/pages/PacienteDetailPage.tsx`
- Test: `frontend/src/lib/format.test.ts`

**Interfaces:**
- Consumes: `pacientesService.findOne(id)` (nested), primitivas, `Tabs`.
- Produces:
  - `calcAge(fechaNacimiento?: string): number | null`
  - `vitalsSeries(controles: Control[]): { sistolica: number[]; diastolica: number[]; pulso: number[]; ... }` (orden cronológico asc)
  - `lastVsPrev(values: number[]): { last: number|null; delta: number|null }`
  - Componentes de presentación de la ficha.

- [ ] **Step 1: Test de utilidades (`format.ts`)**

```ts
import { calcAge, lastVsPrev, vitalsSeries } from './format';
import type { Control } from '../types';

test('calcAge devuelve años', () => {
  expect(calcAge('1985-05-15')).toBeGreaterThanOrEqual(39);
  expect(calcAge(undefined)).toBeNull();
});
test('lastVsPrev calcula el delta', () => {
  expect(lastVsPrev([120, 128])).toEqual({ last: 128, delta: 8 });
  expect(lastVsPrev([])).toEqual({ last: null, delta: null });
});
test('vitalsSeries ordena ascendente por fecha', () => {
  const c = [
    { fecha: '2024-06-21', presionSistolica: 128 },
    { fecha: '2024-05-05', presionSistolica: 124 },
  ] as Control[];
  expect(vitalsSeries(c).sistolica).toEqual([124, 128]);
});
```

- [ ] **Step 2: Ejecutar (falla) → implementar `format.ts`**

Run: `npx vitest run src/lib/format.test.ts` → FAIL. Implementa `calcAge` (diferencia de años con `new Date`), `vitalsSeries` (ordena `controles` por `fecha` asc y proyecta arrays por métrica, ignorando `undefined`), `lastVsPrev` (último vs penúltimo). Run → PASS.

- [ ] **Step 3: Implementar Sparkline (canvas)**

`Sparkline.tsx`: canvas con `devicePixelRatio`, dibuja área + línea + endpoint, color por prop (`accent` | `warn`), lee color desde `getComputedStyle(document.documentElement).getPropertyValue('--accent'|'--warn')` para respetar el tema. Reusa la lógica del `drawSparks` del mockup aprobado. Redibuja en `resize` y cuando cambie el tema (prop `themeKey`).

- [ ] **Step 4: Implementar PatientHeader, AllergyBanner, VitalsStrip, ActivityTimeline**

Guía visual: mockup aprobado (verbatim de estructura). Requisitos:
- `PatientHeader`: nombre, `calcAge`+fechaNacimiento, área/cargo/turno (departamento/puesto), DNI y datos ocupacionales; chips de estado con `Badge` (sin puntos).
- `AllergyBanner`: se muestra solo si `paciente.alergias`; `bg-crit-soft`, borde `crit`, icono lucide `AlertTriangle`, copy `Alergia: <texto>` (dos puntos, no em dash).
- `VitalsStrip`: 5 tarjetas (PA/FC/Temp/SpO₂/Peso) con valor `tnum`, delta vs previo (usar `lastVsPrev`; sube=warn, baja=accent, igual=muted, texto sin em dash) y `Sparkline` por métrica (datos de `vitalsSeries`).
- `ActivityTimeline`: lista cronológica de controles/recetas/remisiones con icono lucide por tipo; copy con `:`/`·`.

- [ ] **Step 5: Reescribir `PacienteDetailPage.tsx`**

Carga con `pacientesService.findOne(id)` (estado `loading` → `Skeleton`; error → `EmptyState` con acción "Reintentar"). Compone `PatientHeader` + `AllergyBanner` + fila de acciones (botones que en Task 8 abrirán modales; por ahora deshabilitados con tooltip "en la siguiente tarea") + `VitalsStrip` + `Tabs` (Resumen=Timeline+ficha ocupacional; Controles/Recetas/Remisiones = tablas con `Table`). Botón "Historia clínica · PDF" reusa el `generateHistoriaClinica` existente (mover su lógica a `src/lib/pdf` si hace falta, sin cambiar el contenido del PDF).

- [ ] **Step 6: Verificar**

Run: `npx vitest run src/lib/format.test.ts` → PASS.
Run: `npm run dev` → abre `/pacientes/1`: cabecera rica, banner de alergia, signos con sparklines de tendencia, tabs con datos. Alterna tema y confirma que los sparklines se redibujan con el color correcto.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat(ficha): cabecera, signos con sparklines y tabs de la ficha del paciente"
```

---

### Task 8: Acciones en contexto — registrar signos / receta / remisión sin salir

**Files:**
- Create: `frontend/src/components/patient/NuevoControlModal.tsx`, `NuevaRecetaModal.tsx`, `NuevaRemisionModal.tsx`
- Modify: `frontend/src/pages/PacienteDetailPage.tsx` (conectar acciones + refetch)
- Test: `frontend/src/components/patient/NuevoControlModal.test.tsx`

**Interfaces:**
- Consumes: `controlesService.create`, `recetasService.create` + `medicamentosService.findAll`, `remisionesService.create`, `Modal`, primitivas.
- Produces: modales que crean el registro con `pacienteId` **preseleccionado** y llaman `onCreated()` para refrescar la ficha.

- [ ] **Step 1: Test — el modal de control envía con el pacienteId fijo**

```tsx
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
```

- [ ] **Step 2: Ejecutar (falla) → implementar `NuevoControlModal.tsx`**

Formulario dentro de `Modal`: `tipo` (Select con el enum de `Control`), fecha (`datetime-local`, por defecto ahora), y signos vitales opcionales (sistólica, diastólica, temperatura, pulso, saturación, peso, talla, motivo, observaciones). No pide `enfermeraId` (el backend lo infiere del JWT). Al enviar: construye `dto: Partial<Control>` con `pacienteId` de la prop y solo los campos numéricos rellenos; `await controlesService.create(dto)`; `toast.success('Control registrado')`; `onCreated()`; `onOpenChange(false)`. Errores → `toast.error(e.response?.data?.message ?? 'No se pudo registrar')`. Run test → PASS.

- [ ] **Step 3: Implementar `NuevaRecetaModal.tsx` y `NuevaRemisionModal.tsx`**

- Receta: carga `medicamentosService.findAll()` para el Select; campos dosis, frecuencia, duracionDias, fechaInicio, fechaFin, medico (prefill con `useAuth().user` nombre), observaciones; `recetasService.create({ pacienteId, medicamentoId, ... })`.
- Remisión: `tipo` (enum `Remision`), destino, fecha, motivo (requerido), diagnostico, observaciones; `remisionesService.create({ pacienteId, ... })`. No pide `enfermeraId` (inferido del JWT).
Ambos: `toast` + `onCreated()` + cierre.

- [ ] **Step 4: Conectar en `PacienteDetailPage.tsx`**

Estado `open: 'control'|'receta'|'remision'|null`. Los botones de acción (fila superior y "+ Nuevo" de cada tab) abren el modal correspondiente con `pacienteId={paciente.id}`. `onCreated` vuelve a llamar `pacientesService.findOne(id)` para refrescar cabecera, signos y tablas sin recargar la página.

- [ ] **Step 5: Verificar el flujo estrella**

Run: `npx vitest run src/components/patient/NuevoControlModal.test.tsx` → PASS.
Run: `npm run dev`. En `/pacientes/1`: "Registrar signos vitales" abre el modal con el paciente ya fijo; al guardar, la ficha se actualiza (nuevo control en la tabla y en los sparklines) **sin cambiar de página ni re-buscar**. Repite con Receta y Remisión.
Run: `npm run build` → compila a `build/` sin errores.

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(ficha): registrar signos/receta/remision en contexto desde la ficha"
```

---

## Self-Review

**Cobertura del spec:**
- Vite + Tailwind + Radix + lucide → Tasks 1,2,3,4. ✓
- Colores configurables en un solo archivo (`tokens.css`) → Task 2 (verificado en Step 7). ✓
- Primitivas (Button/Card/Input/Badge/Table/Skeleton/EmptyState/Modal/Tabs/Toast/Dropdown) → Tasks 3,4. ✓
- AppShell/Sidebar/tema/Login → Task 5. CommandPalette ⌘K → Task 6. ✓
- Ficha: PatientHeader, AllergyBanner, VitalsStrip+sparklines, Timeline, tabs → Task 7. ✓
- Acciones en contexto sin re-buscar → Task 8. ✓
- Checklist anti-slop (sin em dashes/glow/gradientes/puntos/emoji, tnum, lucide) → Global Constraints + requisitos por componente. ✓
- Estados skeleton/empty/error → Task 3 (primitivas) + Task 7 (Step 5). ✓
- No tocar backend/nginx/proxy; salida `build/` → Task 1 (Step 4, `outDir: build` + proxy). ✓
- `Table` primitiva: se usa en Task 7 Step 5; **añadido** su requisito a Task 3 Step 5 (Card/Table family). Nota: crear `Table.tsx` como parte de Task 3 (wrapper de `<table>` con estilos token) — incluido en la lista de Files de Task 3.

**Placeholders:** sin TBD/TODO; cada paso trae comando y salida esperada, o código concreto. Los componentes visuales referencian el mockup aprobado como fuente y detallan clases-token requeridas (no "estilízalo bonito"). ✓

**Consistencia de tipos/nombres:** `calcAge/vitalsSeries/lastVsPrev` (Task 7) usados consistentes; services y tipos citados con firmas reales de `src/types` y `src/api/*`; `useTheme` fija `data-theme` igual que `tokens.css` (`[data-theme="dark"]`); `REACT_APP_API_URL` coherente entre Vite `define`, proxy y el `axios.ts` existente. ✓

## Nota de despliegue

`outDir: 'build'` conserva la ruta que copia `frontend/Dockerfile` (`COPY --from=builder /app/build ...`), por lo que **no** se toca Dockerfile, nginx ni composes. El proxy `/api` de Vite es solo para `npm run dev`; en el contenedor sigue sirviendo nginx.
