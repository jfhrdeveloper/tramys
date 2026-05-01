ñ# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev        # Next.js dev server (Turbopack-style HMR)
npm run build      # Build de producción
npm run start      # Servir el build
npm run lint       # ESLint (next lint, config eslint-config-next)
```

No hay framework de tests configurado. El typechecking ocurre como parte de `next build`.

## Stack

Next.js 15.5.9 (App Router) · React 19 · TypeScript estricto · Tailwind CSS · Framer Motion · Supabase (`@supabase/ssr`, `@supabase/supabase-js`) · `jspdf`/`jspdf-autotable` y `xlsx` para exportes · `date-fns` · `lucide-react`. Alias de imports: `@/*` → `./src/*`.

## Arquitectura

### Dos modos de backend conmutables por flag

La app corre en **modo demo (localStorage)** o **modo Supabase** según `NEXT_PUBLIC_USE_SUPABASE`:

- `src/components/providers/Providers.tsx` selecciona en runtime entre `DataProvider`/`SessionProvider` (demo) y `DataProviderSupabase`/`SessionProviderSupabase` (real). **Toda la UI consume `useData()` y `useSession()` y es agnóstica al backend.**
- `src/middleware.ts` también es passthrough cuando la flag es false (la protección de rutas la hace el `SessionProvider` cliente leyendo `localStorage`/`sessionStorage`). Cuando es true, el middleware valida `auth.users` + `profiles.rol` y redirige por rol.
- `src/lib/data/mappers.ts` convierte filas Supabase (snake_case) ↔ shapes camelCase del store. Mantener un par `rowTo*`/`*ToRow` por entidad — añadir aquí cualquier campo nuevo de DB.
- `DataProviderSupabase` se suscribe a `postgres_changes` en todo el schema `public` y recarga el estado, sincronizando Owner/Encargado/Trabajador.

### Fuente única de verdad: DataProvider

`src/components/providers/DataProvider.tsx` es el store global compartido entre los tres roles. Cualquier cambio (asistencia, adelanto, permiso, tarifa, sede, acceso temporal) se refleja inmediatamente en todas las vistas, sin estado paralelo por rol. En demo persiste en `localStorage`; en Supabase, en la DB con realtime.

### Route groups por rol

```
src/app/
  (admin)/   layout con Sidebar + BottomNav admin (owner + encargado)
  (worker)/  layout con SidebarWorker + BottomNavWorker
  login/     pública
```

Ambos layouts envuelven en `<Providers>` y `<HydrationGate>` (skeleton mientras `DataProvider.ready && SessionProvider.ready` no estén listos). `<ImpersonationBanner>` aparece cuando el owner está "viendo como" otro usuario.

### Sesión + Impersonación + "Recuérdame"

`SessionProvider` mantiene **dos IDs**: `tramys_session_id` (sesión efectiva, decide el rol activo) y `tramys_session_real_id` (sesión real del owner cuando impersona). `switchTo(workerId)` impersona, `restoreSession()` revierte. La sesión se lee de `sessionStorage` con fallback a `localStorage`: `sessionStorage` = "no recordarme" (muere al cerrar pestaña), `localStorage` = persistente. **`/login` limpia ambos al montar** para que cada visita parta sin sesión.

### Reglas de dominio críticas (no infringir)

- **NO existe sueldo base.** El sueldo del trabajador es siempre `Σ (asistencia × tarifa del día) + override manual`. Las tarifas viven en `Worker.tarifas` (`diaNormal`, `tardanza`, `finSemana`, `feriado`) o en `profiles.tarifa_*` en Supabase.
- **Multi-sede por día.** `Worker.sedeId`/`Worker.turno` son lo "habitual"; el día concreto vive en `AsistenciaRec.sedeIdDia`/`turnoEntrada`/`turnoSalida` (override). Usar helpers `sedeDelDia(rec, worker)` y `turnoDelDia(rec, worker)` del `DataProvider` — no leer `worker.sedeId` directo en lógica de planilla/asistencia.
- **Scope de encargado.** Owner ve todo. Encargado ve un registro si `worker.sedeId === sedeActor.id` **OR** `sedeDelDia(rec, worker) === sedeActor.id`. En Supabase, las RLS (`is_encargado() and sede_id = current_sede()`) hacen lo mismo en el servidor.
- **Paleta canónica de estados.** `src/lib/constants/estados.ts` (`ESTADO_COLOR`, `VACACIONES_COLOR`, `estiloEstado(rec)`). **Nunca redefinir colores de estado** en componentes — siempre importar de aquí. Vacaciones = `permiso` con `motivoEdit` que empieza con "Vacaciones" (detectar con `esVacaciones(rec)`).
- **Accesos temporales.** Crear acceso aplica `rolOtorgado` al worker y guarda `rolOriginal`; al expirar/revocar restaura `rolOriginal`. Hay un ticker cada 30s en `DataProvider` (defensa en profundidad) y un `pg_cron` cada minuto en Supabase (`expirar_accesos_temporales()`).
- **Feriados Perú.** `src/lib/utils/peruHolidays.ts` precarga los fijos. Toggle global `mostrarFeriadosOficiales` controla su visibilidad.
- **Caja por sede.** `Sede` ya **no almacena** agregados; los movimientos viven en `MovimientoCaja` (line items con `fecha`, `tipo: ingreso | gasto-personal | gasto-fijo | gasto-manual`, `categoria` para gastos fijos: `luz/agua/internet/local/otro`, opcional `cantidad × unitario` para ingresos). Los totales por periodo se calculan con `agregadoCaja(state, sedeId, desdeISO, hastaISO)`. **Las ganancias del cuadre incluyen también los ingresos de jaladores** de esa sede — usar `ingresosJaladoresEnRango(state, sedeId, desde, hasta)` (cruza `ingresosJaladores × jaladores.sedeId`) y sumarlo a `agregadoCaja().ingresos`. Lo aplican `CajaBlock` (`/sedes`) y `PanelMisGastos` (`/mis-gastos`). **Owner** opera todas las sedes; **Encargado** solo la suya — la página de Sedes lo redirige al detalle de su sede y RLS (`sede_id = current_sede()`) lo enforce en Supabase.
- **Periodo del cuadre.** Tipo y rango centralizados en `src/lib/utils/periodos.ts`: `Periodo = "diario" | "semanal" | "quincenal" | "mensual"`, `PERIODOS`, `PERIODO_LABEL`, `rangoPeriodo(p)`. **Quincenal** = si hoy ≤ 15 → desde día 1; si hoy ≥ 16 → desde día 16, siempre hasta hoy. **No definir el rango en cada página** — todos los toggles (sedes, mis-gastos, jaladores) consumen este util; añadir un periodo nuevo aquí lo propaga a toda la UI.
- **Modal de movimiento de caja.** Componente único `src/components/sedes/ModalMovimiento.tsx` con prop `modo: "todos" | "gastos" | "ingresos"` (filtra el selector de tipo) y `tipoInicial` (preselecciona). Reutilizado por `/sedes` (modo "todos") y `PanelMisGastos` (modos "gastos" / "ingresos" según el botón). No duplicar el modal en otras vistas.

## Convenciones

- **Estilo visual, tipografía, paleta, breakpoints, jerarquía de comentarios y reglas de JSX:** en `docs/style-guide.md` (fuente única; no duplicar aquí).
- **TypeScript `strict: true`, `noEmit: true`.** No introducir `any` salvo necesidad puntual justificada con comentario.
- Al añadir un campo a una entidad del `DataProvider`, actualizar también `src/lib/data/mappers.ts` (ambos sentidos) y, si afecta DB, el SQL en `totalproject.md` §6.

## Roles y rutas

| Rol         | Acceso                                             | Layout group |
|-------------|----------------------------------------------------|--------------|
| owner       | Todo                                               | (admin)      |
| encargado   | `/dashboard`, `/sedes` (solo su sede), `/trabajadores`, `/asistencia`, `/adelantos`, `/eventos` | (admin) |
| trabajador  | Solo `/mi-*` y `/mis-*`                            | (worker)     |

Listas exactas de rutas y reglas de redirección por rol en `src/middleware.ts`.

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # solo server / SQL editor
NEXT_PUBLIC_USE_SUPABASE=true      # opcional; activa modo Supabase + middleware real
```

Sin `NEXT_PUBLIC_USE_SUPABASE=true` la app funciona offline contra `localStorage` (útil para iterar UI rápido).

## Documentos relacionados

- **`docs/style-guide.md`** — Estilo visual, tipografía, paleta, breakpoints, componentes UI, animación, accesibilidad, anti-patrones de UI, convenciones de código (comentarios/JSX/imports/estructura de página).
- **`totalproject.md`** y **`.claude/PROGRESS.md`** — Roadmap operativo, backlog detallado por vista, decisiones arquitectónicas, y el **schema SQL completo** de Supabase (tablas, enums, triggers, RLS, pg_cron, storage). Antes de cambiar el modelo de datos, leer §6 (Esquema Supabase) y §10 (multi-sede por día).
- **`supabase-schema.sql`** — Script idempotente para pegar en el SQL Editor al inicializar un proyecto nuevo.
