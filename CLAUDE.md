# CLAUDE.md

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

### Backend único: Supabase

La app corre **siempre contra Supabase** (auth + Realtime + RLS). No hay modo demo ni flag de conmutación — fue eliminado en el lanzamiento.

- `src/components/providers/DataProvider.tsx` mantiene el store global. `cargar()` fetchea las 13 tablas en paralelo y se suscribe a `postgres_changes` en todo el schema `public`. Cualquier escritura va por la función correspondiente (`addX`, `updateX`, `deleteX`); Realtime re-fetchea y todos los componentes que consumen `useData()` se actualizan.
- `src/components/providers/SessionProvider.tsx` resuelve el worker activo desde `auth.uid()` de Supabase y se suscribe a `onAuthStateChange`. La impersonación (`switchTo`) guarda un `tramys_impersonate_id` en localStorage que prevalece sobre auth.uid hasta `restoreSession()` o `signOut()`.
- `src/middleware.ts` valida `auth.users` + `profiles.rol` y redirige por rol antes de servir cualquier página privada. Si las env vars de Supabase no están seteadas, el middleware deja pasar (la página mostrará error del cliente Supabase).
- `src/lib/data/mappers.ts` convierte filas Supabase (snake_case) ↔ shapes camelCase del store. Mantener un par `rowTo*`/`*ToRow` por entidad — añadir aquí cualquier campo nuevo de DB.

### Fuente única de verdad: DataProvider

`DataProvider` es el store global compartido entre los tres roles (owner / encargado / trabajador). Cualquier cambio (asistencia, adelanto, permiso, tarifa, sede, acceso temporal, cuadre personal, pago de planilla) se persiste en Supabase y Realtime sincroniza todas las vistas. **Nunca mantener estado paralelo por rol.**

### Route groups por rol

```
src/app/
  (admin)/   layout con Sidebar + BottomNav admin (owner + encargado)
  (worker)/  layout con SidebarWorker + BottomNavWorker
  login/     pública
```

Ambos layouts envuelven en `<Providers>` y `<HydrationGate>` (skeleton mientras `DataProvider.ready && SessionProvider.ready` no estén listos). `<ImpersonationBanner>` aparece cuando el owner está "viendo como" otro usuario.

### Reglas de dominio críticas (no infringir)

- **NO existe sueldo base.** El sueldo del trabajador es siempre `Σ (asistencia × tarifa del día) + override manual`. Las tarifas viven en `Worker.tarifas` (`diaNormal`, `tardanza`, `finSemana`, `feriado`) → en Supabase, `profiles.tarifa_normal/tardanza/finsem/feriado`.
- **Multi-sede por día.** `Worker.sedeId`/`Worker.turno` son lo "habitual"; el día concreto vive en `AsistenciaRec.sedeIdDia`/`turnoEntrada`/`turnoSalida` (override). Usar helpers `sedeDelDia(rec, worker)` y `turnoDelDia(rec, worker)` del `DataProvider` — no leer `worker.sedeId` directo en lógica de planilla/asistencia.
- **Scope de encargado.** Owner ve todo. Encargado ve un registro si `worker.sedeId === sedeActor.id` **OR** `sedeDelDia(rec, worker) === sedeActor.id`. En Supabase, las RLS (`is_encargado() and sede_id = current_sede()`) hacen lo mismo en el servidor.
- **Paleta canónica de estados.** `src/lib/constants/estados.ts` (`ESTADO_COLOR`, `VACACIONES_COLOR`, `estiloEstado(rec)`). **Nunca redefinir colores de estado** en componentes — siempre importar de aquí. Vacaciones = `permiso` con `motivoEdit` que empieza con "Vacaciones" (detectar con `esVacaciones(rec)`).
- **Accesos temporales.** Crear acceso aplica `rolOtorgado` al worker y guarda `rolOriginal`; al expirar/revocar restaura `rolOriginal`. Hay un ticker cada 30s en `DataProvider` (defensa en profundidad) y un `pg_cron` cada minuto en Supabase (`expirar_accesos_temporales()`).
- **Feriados Perú.** `src/lib/utils/peruHolidays.ts` precarga los fijos. Toggle global `mostrarFeriadosOficiales` en `ajustes` (singleton id=1) controla su visibilidad.
- **Caja por sede.** `Sede` ya **no almacena** agregados; los movimientos viven en `MovimientoCaja` (line items con `fecha`, `tipo: ingreso | gasto-personal | gasto-fijo | gasto-manual`, `categoria` para gastos fijos: `luz/agua/internet/local/otro`, opcional `cantidad × unitario` para ingresos). Los totales por periodo se calculan con `agregadoCaja(state, sedeId, desdeISO, hastaISO)`. **Las ganancias del cuadre incluyen también los ingresos de jaladores** de esa sede — usar `ingresosJaladoresEnRango(state, sedeId, desde, hasta)` (cruza `ingresosJaladores × jaladores.sedeId`) y sumarlo a `agregadoCaja().ingresos`. **Owner** opera todas las sedes; **Encargado** solo la suya — la página de Sedes lo redirige al detalle de su sede y RLS (`sede_id = current_sede()`) lo enforce en Supabase.
- **Periodo del cuadre.** Tipo y rango centralizados en `src/lib/utils/periodos.ts`: `Periodo = "diario" | "semanal" | "quincenal" | "mensual"`, `PERIODOS`, `PERIODO_LABEL`, `rangoPeriodo(p)`. **Quincenal** = si hoy ≤ 15 → desde día 1; si hoy ≥ 16 → desde día 16, siempre hasta hoy. **No definir el rango en cada página** — todos los toggles (sedes, caja, jaladores) consumen este util.
- **Modal de movimiento de caja.** Componente único `src/components/sedes/ModalMovimiento.tsx` con prop `modo: "todos" | "gastos" | "ingresos"` (filtra el selector de tipo) y `tipoInicial` (preselecciona). Reutilizado por `/sedes` (modo "todos") y `PanelCaja` (modos "gastos" / "ingresos" según el botón). No duplicar el modal en otras vistas.
- **Cuadres personales del trabajador (sandbox).** Tabla `cuadres_personales` con RLS estricta `cp_self` (solo el dueño lee/escribe). Ni owner ni encargado pueden leer estos registros — son anotaciones privadas que el trabajador usa para comparar con la asistencia oficial. La pestaña "Cuadrar días" en `/mi-asistencia` es la única UI que los toca.
- **Pagos de planilla.** Tabla `pagos_planilla` registra los pagos efectivamente realizados (no calculados). Lleva `desde_iso`/`hasta_iso` (rango cubierto), `fecha_pago`, `monto_neto`, `metodo_pago` (efectivo/yape/transferencia), `periodo` opcional. La presencia del registro es la verdad de "ese rango ya fue pagado". Owner y encargado escriben (encargado scope sede); el trabajador solo lee los suyos en `/mi-sueldo`.
- **Convención de namespaces.** El prefijo `mi-*` / `mis-*` es **exclusivo del portal del trabajador**. El admin usa nombres de dominio (`/caja`, `/sedes`, `/planilla`). Si añades una ruta admin, **no uses `mis-*`** aunque el contexto sugiera "lo mío del owner".

## Convenciones

- **Estilo visual, tipografía, paleta, breakpoints, jerarquía de comentarios y reglas de JSX:** en `docs/style-guide.md` (fuente única; no duplicar aquí).
- **TypeScript `strict: true`, `noEmit: true`.** No introducir `any` salvo necesidad puntual justificada con comentario.
- Al añadir un campo a una entidad del `DataProvider`, actualizar también `src/lib/data/mappers.ts` (ambos sentidos) y `docs/supabase-schema.sql` (la tabla y, si aplica, la RLS).

## Roles y rutas

| Rol         | Acceso                                             | Layout group |
|-------------|----------------------------------------------------|--------------|
| owner       | Todo                                               | (admin)      |
| encargado   | `/dashboard`, `/sedes` (solo su sede), `/trabajadores`, `/asistencia`, `/adelantos`, `/eventos`, `/caja` (solo su sede) | (admin) |
| trabajador  | Solo `/mi-*` y `/mis-*`                            | (worker)     |

Listas exactas de rutas y reglas de redirección por rol en `src/middleware.ts`.

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # solo server-side / SQL editor
```

(El flag `NEXT_PUBLIC_USE_SUPABASE` que existió en pre-lanzamiento ya no aplica — la app es 100% Supabase.)

## Setup inicial (proyecto nuevo)

1. Crear proyecto Supabase y copiar URL + anon key + service role a `.env.local`.
2. Pegar y ejecutar `docs/supabase-schema.sql` en SQL Editor → New Query → Run.
3. Habilitar Realtime en Database → Replication para todas las tablas de `public.*`.
4. Registrar el primer usuario por Authentication → Users → Invite. Promoverlo a owner:
   ```sql
   update public.profiles set rol = 'owner' where id = '<uuid-del-user>';
   ```
5. Desde la UI: crear sedes, luego invitar al resto del equipo, asignarles sede y rol.

## Documentos relacionados

- **`docs/style-guide.md`** — Estilo visual, tipografía, paleta, breakpoints, componentes UI, animación, accesibilidad, anti-patrones de UI, convenciones de código (comentarios/JSX/imports/estructura de página).
- **`docs/supabase-schema.sql`** — **Fuente única ejecutable** del schema. Script idempotente para pegar en el SQL Editor al inicializar un proyecto nuevo. Cualquier cambio al modelo de datos se hace aquí (no duplicar SQL en los `.md`).
- **`totalproject.md`** y **`.claude/PROGRESS.md`** — Roadmap operativo, backlog detallado por vista y decisiones arquitectónicas. El §6 (Esquema Supabase) y §10 (multi-sede por día) documentan el **modelo** (qué hay y por qué); el SQL crudo no vive ahí.
- **`.claude/LAUNCH_PLAN.md`** — Plan de migración de pre-lanzamiento (eliminación del modo demo + reescritura del schema + code review). Conservar como histórico; los reportes de hallazgos al final tienen contexto sobre decisiones de modelado.
