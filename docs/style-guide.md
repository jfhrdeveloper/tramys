# TRAMYS — Guía de Estilo

Referencia única para mantener consistencia visual, tipográfica, de código y de UX en todo el proyecto. Si algo de aquí entra en conflicto con `totalproject.md`, gana `totalproject.md` — esta guía resume y operacionaliza esas reglas.

---

## 1. Paleta

### Marca

| Token         | Light       | Uso                                 |
|---------------|-------------|-------------------------------------|
| `brand`       | `#C41A3A`   | CTA principal, énfasis, sede SA     |
| `brand-light` | `#e8304d`   | Hover/active de CTA, gradientes     |
| `brand-dark`  | `#a01530`   | Pressed, bordes intensos            |

### Modo claro (default)

| Token       | Valor       | Uso                              |
|-------------|-------------|----------------------------------|
| `--bg`      | `#f8f7f4`   | Fondo de la app                  |
| `--card`    | `#ffffff`   | Superficies elevadas             |
| `--text`    | `#1a1917`   | Texto principal                  |
| `--text-muted` | `#6b6966` | Texto secundario, etiquetas     |
| `--border`  | `#e5e2dc`   | Bordes neutros                   |
| `--hover`   | `#f3f1ee`   | Hover en filas/items             |

### Modo oscuro (`.dark`)

| Token       | Valor       |
|-------------|-------------|
| `--bg`      | `#0e1117`   |
| `--card`    | `#161b22`   |
| `--text`    | `#e8eaf0`   |
| `--text-muted` | `#8b8fa8` |
| `--border`  | `#21262d`   |
| `--hover`   | `#1c2128`   |

### Sedes

| Sede           | Color       |
|----------------|-------------|
| Santa Anita    | `#C41A3A` (`sede-sa`) |
| Puente Piedra  | `#1d6fa4` (`sede-pp`) |
| Otras          | Configurable en `Sede.color` desde admin |

### Estados de asistencia (paleta canónica)

**Importar siempre desde `src/lib/constants/estados.ts`**. Nunca redefinir estos colores localmente.

| Estado     | bg                            | fg/dot      | Label       |
|------------|-------------------------------|-------------|-------------|
| presente   | `rgba(34,197,94,0.12)`        | `#16a34a`   | Presente    |
| tardanza   | `rgba(245,158,11,0.12)`       | `#d97706` / `#f59e0b` | Tardanza |
| ausente    | `rgba(139,143,168,0.15)`      | `#6b6966` / `#8b8fa8` | Ausente  |
| permiso    | `rgba(217,119,6,0.12)`        | `#d97706`   | Permiso     |
| feriado    | `rgba(99,102,241,0.12)`       | `#6366f1`   | Feriado     |
| vacaciones | `rgba(6,182,212,0.12)`        | `#0891b2` / `#06b6d4` | Vacaciones |

> **Vacaciones** no es un `EstadoAsist` propio: es un `permiso` cuyo `motivoEdit` empieza con "Vacaciones". Detectar con `esVacaciones(rec)` y resolver el estilo con `estiloEstado(rec)`.

---

## 2. Tipografía

| Familia               | Uso                                            |
|-----------------------|------------------------------------------------|
| Bricolage Grotesque   | UI general, headings, body                     |
| DM Mono               | Código, fechas, montos, etiquetas numéricas    |

### Escala responsiva

Nunca usar tamaños fijos. Patrón obligatorio `text-{base} md:text-{md} xl:text-{xl}`:

| Rol                        | Patrón                                  |
|----------------------------|------------------------------------------|
| Título de página           | `text-xl md:text-2xl xl:text-3xl`        |
| Título de sección/card     | `text-base md:text-lg xl:text-xl`        |
| Body                       | `text-sm md:text-base`                   |
| Label / metadato           | `text-xs md:text-sm font-mono`           |
| KPI numérico               | `text-2xl md:text-3xl xl:text-4xl font-mono` |

### Pesos

400 (cuerpo) · 500 (énfasis ligero) · 600 (subtítulos) · 700 (títulos) · 800 (display).

---

## 3. Espaciado y layout

### Contenedor principal

`.page-main` está centrado y tiene `max-width: 1440px` a partir de `2xl`. Doble candado anti-overflow horizontal: `html { overflow-x: hidden }` en `globals.css` + `min-w-0` en flex children.

### Padding por breakpoint

| Breakpoint | Padding lateral del page-main |
|------------|-------------------------------|
| base       | `px-4`                        |
| md         | `px-6`                        |
| xl         | `px-8`                        |
| 2xl        | `px-10`                       |

### Anchos

- **Sidebar PC:** `w-64` (default) / `w-72` (expandido). Fijo, no flexible.
- **Contenido:** `flex-1 min-w-0`. Nunca anchos fijos en px.
- **Imágenes:** `w-full h-auto` u `object-cover` + ratio explícito (`aspect-square`, `aspect-video`).
- **Avatares:** ratio 1:1 cuadrable (`PhotoUpload` recorta vía canvas a base64).

### Touch targets

Mínimo **44×44px** en mobile. Botones inline con icono usan `min-h-[44px] min-w-[44px]` cuando son la única acción.

### Radios

| Componente            | Radio       |
|-----------------------|-------------|
| Cards                 | `rounded-2xl` |
| Inputs / botones      | `rounded-xl`  |
| Chips / badges        | `rounded-full` |
| Dot / indicadores     | `rounded-full` |

### Sombras

Preferir bordes (`border border-[var(--border)]`) sobre sombras pesadas. Para elevación usar `shadow-sm` en hover, `shadow-md` solo en modales.

---

## 4. Breakpoints (mobile-first)

| Nivel    | Breakpoint   | Dispositivo                  | Layout base                                                 |
|----------|--------------|------------------------------|-------------------------------------------------------------|
| base     | `<640px`     | Móvil (360–430)              | 1 col, bottom-nav o hamburguesa, touch ≥44px                |
| sm       | `≥640px`     | Móvil grande / paisaje       | 1 col con márgenes holgados                                 |
| md       | `≥768px`     | Tablet (768–1024)            | Grid 2 col. Sidebar overlay/colapsable                      |
| lg       | `≥1024px`    | Laptop 13–14"                | Sidebar fijo. Grid 2–3 col                                  |
| xl       | `≥1280px`    | Laptop 15–16"                | Grid ≥3 col, sin scroll horizontal                          |
| 2xl      | `≥1536px`    | Monitor / PC 17"+            | `max-w-[1440px]` centrado. Layouts no estirados al 100%     |

### Reglas

- **Mobile-first siempre:** definir base sin prefijo, escalar con `md:`/`lg:`/`xl:`.
- **No `overflow-x-auto` global** en page-main; resolver overflow con grid responsivo o tabla con wrapper específico.
- **Inputs:** `font-size: max(16px, 1em)` (ya en `globals.css`) para evitar zoom iOS.

---

## 5. Componentes UI base

Todos en `src/components/ui/`. Reusar antes de crear:

| Componente            | Uso                                                          |
|-----------------------|--------------------------------------------------------------|
| `Avatar`              | Foto circular del worker (con fallback a iniciales)          |
| `Badge`               | Estado/etiqueta corta. Aceptar variant del `ESTADO_COLOR`    |
| `StatCard`            | KPI numérico con label + valor + delta opcional              |
| `Modal`               | Wrapper accesible (cierre por overlay/Esc)                   |
| `MiPerfilModal`       | Edición global del usuario activo (foto + datos + password)  |
| `PhotoUpload`         | Upload + crop 1:1 → base64                                   |
| `Preloader`           | Bienvenida post-login (saluda con apodo > nombre, nunca email) |
| `Skeleton` / `SkeletonStats` / `SkeletonCard` / `SkeletonTable` / `SkeletonText` | Loading states |
| `HydrationGate`       | Cubre la hidratación inicial mientras `DataProvider.ready && SessionProvider.ready` no estén listos |
| `ImpersonationBanner` | Banda superior cuando hay sesión impersonada                 |
| `Pagination`          | Paginación numérica con flechas                              |
| `ProgressBar`         | Barra de progreso lineal                                     |
| `HideableAmount`      | Monto con toggle ojo (privacy)                               |
| `MultiverseCalendar` / `CalendarMultiView` / `CalendarEvents` | Calendarios mensuales (asistencia, eventos) |
| `Icons.tsx`           | SVG inline, **única fuente** para iconos del proyecto        |

> Iconos: usar siempre `Icons.tsx` o `lucide-react`. No incrustar SVG inline en páginas.

---

## 6. Estados de UI

| Estado     | Patrón                                                             |
|------------|--------------------------------------------------------------------|
| Loading    | Skeleton específico (`SkeletonStats` para grids de KPIs, `SkeletonTable` para listas) |
| Empty      | Texto + ilustración mínima + CTA primario                          |
| Error      | Card con borde `border-red-500/30`, fondo `bg-red-500/5`, mensaje y reintento |
| Success    | Toast efímero o badge inline con `ESTADO_COLOR.presente`           |
| Disabled   | `opacity-50 cursor-not-allowed pointer-events-none`                |

---

## 7. Animación

- **Librería:** `framer-motion`. Para transiciones simples preferir clases Tailwind (`transition-all`, `duration-200`).
- **Durations:** 150ms (hover/foco), 200–250ms (mount/unmount), 400ms (modales). Nunca >500ms para UI funcional.
- **Easings:** preferir `ease-out` para entradas, `ease-in` para salidas. En framer-motion: `[0.16, 1, 0.3, 1]` para "spring" suave.
- **Fade-in global** ya implementado en el layout. No duplicar a nivel de página.
- **Reduced motion:** respetar `prefers-reduced-motion` desactivando `motion` props con condicional.

---

## 8. Convenciones de código

### Comentarios — jerarquía visual

```ts
/* ================= BLOQUE PRINCIPAL ================= */
/* ====== Sección secundaria ====== */
/* ==== Subsección ==== */
// Nota específica de una línea
```

> **Regla crítica de JSX:** dentro del `return` usar **EXCLUSIVAMENTE** `{/* */}`. Un `//` dentro de JSX rompe la app.

### TypeScript

- `strict: true`. No introducir `any` salvo necesidad puntual justificada con comentario.
- Tipos compartidos del dominio: `src/components/providers/DataProvider.tsx` (Sede, Worker, AsistenciaRec, Adelanto, Permiso, Evento, Jalador, AccesoTemporal, etc.) y `src/types/index.ts` (shapes Supabase).
- `unknown` + narrowing antes que `any` cuando se reciben datos externos.

### Nombres

- Archivos `PascalCase.tsx` para componentes, `camelCase.ts` para utilidades.
- Páginas Next.js: siempre `page.tsx` / `layout.tsx`.
- Variables y funciones en español cuando son del dominio (`workersDeSede`, `calcularSueldoMes`); en inglés para términos técnicos genéricos (`onClick`, `useEffect`).

### Imports

Orden:

1. React / Next
2. Librerías externas
3. `@/components/...`
4. `@/lib/...`
5. `@/hooks/...`
6. `@/types/...`
7. Estilos

### Estructura recomendada de un componente de página

```tsx
"use client";

/* ================= IMPORTS ================= */
import { ... } from "...";

/* ================= TIPOS LOCALES ================= */
type Filtro = "...";

/* ================= PÁGINA ================= */
export default function MiPagina() {
  /* ====== Hooks de datos ====== */
  const d = useData();
  const s = useSession();

  /* ====== Estado local ====== */
  const [filtro, setFiltro] = useState<Filtro>("...");

  /* ====== Derivados ====== */
  const lista = useMemo(() => ..., [...]);

  /* ====== Handlers ====== */
  const handleX = useCallback(() => ..., []);

  /* ====== Render ====== */
  return (
    <div className="page-main">
      {/* ==== Hero ==== */}
      ...
    </div>
  );
}
```

---

## 9. Reglas de dominio que afectan la UI

> Reglas **de comportamiento/arquitectura** (sueldo dinámico, multi-sede por día, scope del encargado, ciclo de accesos temporales) viven en `CLAUDE.md` y en `totalproject.md` §2/§10. Aquí solo lo que cambia el render.

- **Nunca mostrar "sueldo base"** en ninguna vista. El sueldo se renderiza como desglose por tipo de día (`diaNormal | tardanza | finSemana | feriado`) + overrides manuales etiquetados con badge `MANUAL`.
- **Saludo:** Preloader y headers usan `apodo` con fallback a primer nombre. **Nunca mostrar el email** como nombre del usuario.
- **Visita entre sedes:** cuando `sedeIdDia && sedeIdDia !== worker.sedeId`, mostrar badge `🔁 Visita: <Sede>` en la fila/celda del registro.
- **Cumpleaños:** SVG `cake` de `Icons.tsx`. No reemplazar por emoji.
- **Cerrar sesión / Mi perfil:** botón "Cerrar sesión" siempre debajo del email/sede en sidebar y bottom-nav (ícono SVG). "Mi perfil" justo **arriba** de "Cerrar sesión" en todas las sesiones (owner/encargado/trabajador), tanto en sidebar PC como en bottom-nav móvil.

---

## 10. Accesibilidad

- Contraste mínimo **AA** (4.5:1 texto normal, 3:1 texto grande). Verificar especialmente combinaciones sobre `--bg` y `--card` en ambos modos.
- Focus visible en todos los interactivos: `focus-visible:ring-2 ring-brand/40 ring-offset-2`.
- Labels asociados (`<label htmlFor>`) en todos los inputs.
- `aria-label` en botones icon-only.
- Modales: trap de foco, cierre por Escape, restauración de foco al cerrar.
- Imágenes informativas con `alt`; decorativas con `alt=""`.

---

## 11. Anti-patrones (no hacer)

- ❌ Anchos fijos en px para contenedores (`w-[400px]`).
- ❌ `//` dentro de JSX.
- ❌ Redefinir paleta de estados en componente local.
- ❌ Mostrar el email como nombre del usuario.
- ❌ Mostrar "sueldo base" en cualquier vista.
- ❌ Tamaños de texto fijos sin escala responsiva.
- ❌ `prompt()`/`alert()`/`confirm()` nativos: siempre `Modal`.
- ❌ Estado paralelo por rol; siempre consumir `useData()` + `useSession()`.
- ❌ SVG inline ad-hoc en páginas; usar `Icons.tsx` o `lucide-react`.
- ❌ Animaciones >500ms en UI funcional.
- ❌ Scroll horizontal en page-main.
