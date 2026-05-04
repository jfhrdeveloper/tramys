# Plan de lanzamiento TRAMYS — Eliminar demo + migrar a Supabase real

> **Propósito:** Documento autosuficiente para retomar el trabajo en cualquier sesión, incluso si el contexto se pierde. Lee este archivo entero antes de continuar.
>
> **Fecha de inicio:** 2026-05-03
> **Estado:** PENDIENTE DE EJECUCIÓN — el usuario aprobó el plan, solo se creó este documento.

---

## 0. Decisiones aprobadas por el usuario

1. **Eliminar modo demo completo.** Supabase es la única fuente de datos. La app ya no debe correr sin Supabase configurado.
2. **El usuario va a wipear su Supabase actual** y ejecutar el `docs/supabase-schema.sql` resultante de este plan (script ya rediseñado en sesión previa, ahora se le añadirán tablas faltantes).
3. **Añadir tablas faltantes al schema:** `cuadres_personales` y `pagos_planilla` (hoy en `localStorage` con `TODO(supabase)`). Con RLS y mappers.
4. **Eliminar cards demo del login** (`w_du`, `w_rp`, `w_at`). Queda solo el formulario real email/password.
5. **PROGRESS.md se conserva intacto** (bitácora histórica).
6. **Code review de interconexión completo** (los 3 roles + todas las páginas) como reporte al final del Bloque C.

---

## 1. Wipe de Supabase actual (lo ejecuta el USUARIO en su SQL Editor)

> El usuario ya tiene un proyecto Supabase con un schema previo. Antes de pegar el nuevo `docs/supabase-schema.sql`, debe limpiar todo. **Este SQL es destructivo — borra todas las tablas, datos, policies y funciones del schema `public`.** No toca `auth.users` ni `storage.objects` (esos se limpian aparte si quiere).

```sql
-- ============================================================
-- WIPE COMPLETO de schema public + pg_cron + bucket avatars
-- Pegar y ejecutar en Project -> SQL Editor -> New query
-- ============================================================

-- 1) Cancelar el cron job existente (ignora error si no existe)
do $$ begin
  perform cron.unschedule('tramys_expirar_accesos');
exception when others then null; end $$;

-- 2) Drop completo del schema public (cascade aniquila TODO)
drop schema if exists public cascade;
create schema public;

-- 3) Restaurar grants estandar de Supabase
grant usage  on schema public to anon, authenticated, service_role;
grant create on schema public to anon, authenticated, service_role;
grant all    on schema public to postgres;

-- 4) Politicas viejas del bucket avatars (si existian).
--    NOTA: las versiones recientes de Supabase BLOQUEAN `delete from storage.objects/buckets`
--    desde SQL via el trigger `storage.protect_delete()` — error 42501. Por eso el bucket en si
--    se limpia desde el Dashboard (paso manual descrito abajo). Aqui solo dropeamos las policies.
do $$ begin
  drop policy if exists "avatars_read"   on storage.objects;
  drop policy if exists "avatars_upload" on storage.objects;
  drop policy if exists "avatars_update" on storage.objects;
  drop policy if exists "avatars_delete" on storage.objects;
exception when others then null; end $$;
```

**Pasos manuales (los que SQL no puede hacer):**

5. **Bucket `avatars` (solo si existia uno previo y quieres reset):**
   - Dashboard → Storage → click en el bucket `avatars` → seleccionar todos los archivos (Ctrl+A) → Delete.
   - Volver a la lista de buckets → menu `⋮` del bucket → Delete bucket.
   - Si nunca subiste fotos o el bucket no existia, salta este paso.

6. **Usuarios en `auth.users`:** Dashboard → Authentication → Users → seleccionar y eliminar uno por uno. (Tambien existe `delete from auth.users;` pero es PELIGROSO si el proyecto comparte Auth con otros entornos.)

**Despues del wipe:** el usuario pega `docs/supabase-schema.sql` (la version que produce el Bloque A de este plan) y ejecuta. Luego registra el primer usuario via Auth y corre `update public.profiles set rol = 'owner' where id = '<uuid>';`.

---

## 2. Bloque A: Schema + tablas faltantes + analisis critico

**Objetivo:** Auditar el `docs/supabase-schema.sql` actual, añadir las 2 tablas faltantes, garantizar idempotencia y RLS sin holes. Actualizar `totalproject.md §6` con las nuevas tablas en la tabla RLS resumida.

### Pasos

- [x] **A.1** Leer `docs/supabase-schema.sql` completo (456 lineas). Identificar:
  - Holes de RLS (policies sin `with check` en `for all`/`for insert`/`for update`).
  - Tablas con FK pero sin indice en la columna FK.
  - `pg_cron` job: ¿se borra antes de re-crearse para idempotencia?
  - Triggers: ¿usan `drop trigger if exists` antes de `create`?
  - Enums: ¿usan el patron `do $$ begin ... exception when duplicate_object then null; end $$;`?

- [x] **A.2** Cruzar con `src/lib/data/mappers.ts`:
  - Para cada `rowTo*` / `*ToRow`: ¿toda columna del mapper existe en el schema?
  - Para cada columna del schema: ¿está mapeada o documentada como ignorada intencionalmente?

- [x] **A.3** Cruzar con `src/components/providers/DataProviderSupabase.tsx`:
  - ¿La suscripcion `postgres_changes` cubre todas las tablas del schema?
  - ¿El `loadAll` inicial trae todas las tablas?

- [x] **A.4** Añadir tabla `cuadres_personales` al schema:
  ```sql
  create table if not exists public.cuadres_personales (
    id          uuid primary key default gen_random_uuid(),
    worker_id   uuid not null references public.profiles(id) on delete cascade,
    fecha       date not null,
    worked      boolean not null default false,
    late        boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (worker_id, fecha)
  );
  create index if not exists idx_cp_worker on public.cuadres_personales(worker_id);
  ```
  RLS: solo el propio worker lee/escribe sus filas. Owner NO debe poder leer (es sandbox personal).
  ```sql
  alter table public.cuadres_personales enable row level security;
  create policy cp_self on public.cuadres_personales for all
    using (worker_id = auth.uid()) with check (worker_id = auth.uid());
  ```
  Trigger `updated_at` (añadir a array del trigger generico).

- [x] **A.5** Añadir tabla `pagos_planilla` al schema:
  ```sql
  do $$ begin
    create type metodo_pago as enum ('efectivo','yape','transferencia');
  exception when duplicate_object then null; end $$;

  create table if not exists public.pagos_planilla (
    id            uuid primary key default gen_random_uuid(),
    worker_id     uuid not null references public.profiles(id) on delete cascade,
    desde_iso     date not null,
    hasta_iso     date not null,
    monto_neto    numeric(12,2) not null check (monto_neto >= 0),
    metodo_pago   metodo_pago not null,
    fecha_pago    date not null,
    nota          text default '',
    registrado_por uuid references public.profiles(id) on delete set null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
  );
  create index if not exists idx_pp_worker on public.pagos_planilla(worker_id);
  create index if not exists idx_pp_fecha  on public.pagos_planilla(fecha_pago);
  ```
  RLS: owner/encargado escriben; trabajador lee solo los suyos.
  ```sql
  alter table public.pagos_planilla enable row level security;
  create policy pp_self      on public.pagos_planilla for select using (worker_id = auth.uid());
  create policy pp_team_read on public.pagos_planilla for select using (
    public.is_owner()
    or (public.is_encargado() and exists (
          select 1 from public.profiles p
          where p.id = pagos_planilla.worker_id and p.sede_id = public.current_sede()))
  );
  create policy pp_admin     on public.pagos_planilla for all
    using (public.is_owner() or public.is_encargado())
    with check (public.is_owner() or public.is_encargado());
  ```
  Añadir `'cuadres_personales','pagos_planilla'` al array del trigger `updated_at` generico.

- [x] **A.6** Eliminar el seed de §6.8 (sedes Santa Anita + Lima) — el usuario va a registrar sedes reales, no quiere placeholder.

- [x] **A.7** Añadir al script `select cron.unschedule('tramys_expirar_accesos');` antes de `cron.schedule(...)` para idempotencia. Sin esto, re-ejecutar duplica el job.

- [x] **A.8** Actualizar mappers en `src/lib/data/mappers.ts`:
  - `rowToCuadrePersonal` / `cuadrePersonalToRow`.
  - `rowToPagoPlanilla` / `pagoPlanillaToRow` (cuidado con `desdeISO`/`hastaISO` camelCase ↔ `desde_iso`/`hasta_iso` snake).

- [x] **A.9** Actualizar `DataProviderSupabase`:
  - `loadAll`: añadir fetch de `cuadres_personales` y `pagos_planilla`.
  - Suscripcion `postgres_changes`: ya cubre `public.*` con `event: '*'`, verificar que las dos tablas nuevas entran. Si la subscription es por-tabla, añadir las dos.
  - Funciones: `getCuadrePersonal`, `setCuadrePersonal`, `clearCuadrePersonal` deben escribir en Supabase (hoy escriben en estado local).
  - Funciones: `addPagoPlanilla`, `removePagoPlanilla` deben escribir en Supabase.

- [x] **A.10** Actualizar `totalproject.md §6.3` (tabla RLS resumida) con `cuadres_personales` y `pagos_planilla`.

- [x] **A.11** Producir un **reporte de holes detectados** en este bloque (en este mismo .md, al final, en la seccion "Reporte de hallazgos Bloque A"). Si hay fixes adicionales no contemplados arriba, listarlos para decision del usuario.

### Checkpoint A
- Schema actualizado: confirmar con `wc -l docs/supabase-schema.sql` (esperado: ~510-540 lineas).
- Mappers actualizados: `grep -E "rowToCuadre|rowToPago" src/lib/data/mappers.ts` debe devolver matches.
- Typecheck: `npx tsc --noEmit` pasa limpio.

---

## 3. Bloque B: Eliminar modo demo

**Objetivo:** La app ya no corre sin Supabase. Borrar todo el codigo de demo localStorage.

### Pasos

- [x] **B.1** Identificar todos los archivos a tocar (snapshot esperado):
  - **A eliminar:** `src/components/providers/DataProvider.tsx` (la version demo). Hay que verificar primero si el archivo actual es el demo o ya es el unico (renombrarlo en su lugar).
  - **A eliminar:** `src/components/providers/SessionProvider.tsx` (version demo).
  - **A renombrar:** `DataProviderSupabase.tsx` → `DataProvider.tsx`. Actualizar imports en toda la app.
  - **A renombrar:** `SessionProviderSupabase.tsx` → `SessionProvider.tsx`. Idem.
  - **A simplificar:** `src/components/providers/Providers.tsx` — quitar la conmutacion por flag, solo wrappear con los providers reales.
  - **A revisar:** `src/middleware.ts` — quitar la rama "passthrough" cuando flag es false. Solo dejar la version real con auth.
  - **A revisar:** `src/app/login/page.tsx` — quitar las cards demo (`w_du`, `w_rp`, `w_at`).
  - **A revisar:** `.env.local.example` — quitar `NEXT_PUBLIC_USE_SUPABASE` (ya no aplica).

- [x] **B.2** Antes de borrar, hacer un `grep "useData\|useSession\|DataProvider\|SessionProvider"` para mapear cuantos archivos importan estos. **Critico:** si la version demo y la real exportan diferentes shapes (camelCase vs snake_case, tipos diferentes), el rename rompera todo lo que consume.

- [x] **B.3** Verificar que `useData()` y `useSession()` exportados desde la version Supabase tienen exactamente la misma API publica que la version demo (mismas funciones, mismos shapes). Si no, conciliar antes de borrar.

- [x] **B.4** Renombrar archivos:
  - `mv src/components/providers/DataProviderSupabase.tsx src/components/providers/DataProvider.tsx` (despues de borrar el demo).
  - `mv src/components/providers/SessionProviderSupabase.tsx src/components/providers/SessionProvider.tsx` (idem).

- [x] **B.5** Actualizar imports en TODA la app:
  - `from "@/components/providers/DataProviderSupabase"` → `from "@/components/providers/DataProvider"`.
  - `from "@/components/providers/SessionProviderSupabase"` → `from "@/components/providers/SessionProvider"`.

- [x] **B.6** Simplificar `Providers.tsx`:
  ```tsx
  // Antes: switch por NEXT_PUBLIC_USE_SUPABASE
  // Despues:
  import { DataProvider } from "./DataProvider";
  import { SessionProvider } from "./SessionProvider";
  export function Providers({ children }) {
    return <SessionProvider><DataProvider>{children}</DataProvider></SessionProvider>;
  }
  ```

- [x] **B.7** Actualizar `middleware.ts`:
  - Borrar la rama passthrough.
  - Solo dejar la lógica de auth real (validar `auth.users` + `profiles.rol`, redirigir por rol).

- [x] **B.8** Login `src/app/login/page.tsx`:
  - Borrar las 3 cards demo.
  - Si las cards eran un componente separado, borrar el componente.
  - Dejar solo el formulario real con Supabase Auth.
  - Conservar el checkbox "Recuérdame en este dispositivo".

- [x] **B.9** Borrar el flag `NEXT_PUBLIC_USE_SUPABASE` de:
  - `.env.local.example` (si existe).
  - Cualquier `if (process.env.NEXT_PUBLIC_USE_SUPABASE === "true")` en el codigo.
  - `CLAUDE.md` (la seccion Variables de entorno).

- [x] **B.10** Verificar typecheck: `npx tsc --noEmit`. Si falla, revisar imports.

- [x] **B.11** `npm run build` debe pasar limpio.

### Checkpoint B
- `find src/components/providers/ -name "*.tsx"` solo debe mostrar: `DataProvider.tsx`, `SessionProvider.tsx`, `Providers.tsx`. (No mas archivos `*Supabase.tsx`.)
- Grep `NEXT_PUBLIC_USE_SUPABASE` en src/ debe devolver 0 matches.
- Build pasa.

---

## 4. Bloque C: Code review interconexion + sync docs

**Objetivo:** Verificar que ningun cambio en una vista deja a otra vista sin actualizar. Producir reporte de holes y arreglarlos. Sincronizar `CLAUDE.md`.

### Pasos

- [x] **C.1** Mapear todas las paginas:
  - Admin: `/dashboard`, `/sedes`, `/trabajadores`, `/asistencia`, `/planilla`, `/jaladores`, `/eventos`, `/adelantos`, `/permisos`, `/caja`, `/reportes`, `/accesos`.
  - Worker: `/mi-asistencia`, `/mi-sueldo`, `/mis-adelantos`, `/mis-permisos`, `/mis-alertas`, `/mi-perfil`.
  - Login + middleware.

- [x] **C.2** Para cada pagina, verificar:
  - ¿Consume `useData()` (nunca estado paralelo)?
  - ¿Si es admin: aplica scope encargado cuando `rol === "encargado"`?
  - ¿Si modifica datos: la mutacion va por `d.set*()` (no `setState` paralelo)?

- [x] **C.3** Trazar flujos cross-rol criticos:
  - **Marcar asistencia (worker)** → ¿aparece en `/asistencia` admin con badge "pendiente verificar"? → ¿al verificar, badge cambia? → ¿impacta `/planilla`?
  - **Editar asistencia (admin)** → ¿se ve en `/mi-asistencia` worker calendario oficial? → ¿impacta `/mi-sueldo`?
  - **Solicitar adelanto (worker)** → ¿aparece en `/adelantos` admin como pendiente? → ¿al aprobar, worker ve "aprobado"?
  - **Solicitar permiso (worker)** → idem.
  - **Crear acceso temporal (owner)** → ¿el rol del worker cambia inmediatamente? → ¿al expirar (cron), se restaura?
  - **Cambiar tarifas en perfil (admin)** → ¿impacta `/mi-sueldo` worker?
  - **Registrar movimiento de caja (encargado)** → ¿solo lo ve en su sede? → ¿el owner lo ve en `/sedes` y `/caja`?
  - **Registrar pago de planilla (admin)** → ¿el worker lo ve en `/mi-sueldo` "Pagos recibidos"? → ¿en `/mi-asistencia` cintillo de pagos del mes?
  - **Cuadre personal (worker)** → ¿permanece privado? ¿el owner NO debe verlo?
  - **Cambiar foto/email/password en /mi-perfil** → ¿impacta header/avatar en todas las vistas?

- [x] **C.4** Realtime: verificar que `DataProviderSupabase.tsx` (ahora `DataProvider.tsx`) se suscribe a TODAS las tablas usadas por la UI. Tablas esperadas: `sedes`, `profiles`, `asistencia`, `adelantos`, `permisos`, `eventos`, `jaladores`, `ingresos_jaladores`, `accesos_temporales`, `movimientos_caja`, `ajustes`, `cuadres_personales` (nuevo), `pagos_planilla` (nuevo).

- [x] **C.5** RLS doble-check con la realidad de la UI:
  - Si trabajador no debe ver una tabla → verificar policy + verificar que la UI worker no la fetcha (evita errores 403 en consola).
  - Si encargado solo ve su sede → verificar policy + verificar que la UI no rompe cuando el fetch devuelve []  para sedes ajenas.

- [x] **C.6** Producir **reporte de hallazgos** (en este .md, seccion "Reporte de hallazgos Bloque C"):
  - Lista de holes detectados.
  - Para cada hole: archivo, linea, descripcion, fix propuesto.
  - El usuario decide cuales fixean en esta sesion vs cuales se posponen.

- [x] **C.7** Aplicar los fixes aprobados.

- [x] **C.8** Sincronizar `CLAUDE.md`:
  - Borrar referencia al "Modo demo localStorage" (ya no existe).
  - Borrar referencia al flag `NEXT_PUBLIC_USE_SUPABASE`.
  - La seccion "Dos modos de backend conmutables por flag" pasa a "Backend Supabase (unica fuente)".
  - Ajustar Variables de entorno (quitar la flag).
  - Verificar que las secciones de Reglas de dominio criticas siguen siendo correctas.

- [x] **C.9** Añadir entrada final a `PROGRESS.md` con resumen de la sesion (que se hizo, que quedo).

### Checkpoint C
- Reporte de hallazgos completo (en este .md).
- Fixes aprobados aplicados.
- `CLAUDE.md` sin referencias al modo demo.
- `PROGRESS.md` con la entrada final.
- Typecheck + build pasan.

---

## 5. Como retomar si la sesion se corta

**Si te quedaste sin tokens y volves a empezar una conversacion:**

1. Lee este archivo entero (`.claude/LAUNCH_PLAN.md`) primero.
2. Identifica el ultimo checkbox marcado `[x]`. Continua desde el siguiente `[ ]`.
3. Si el checkbox ambiguo no aclara dónde quedamos, ejecuta:
   - `npx tsc --noEmit` (si pasa, los renames del Bloque B ya estan).
   - `wc -l docs/supabase-schema.sql` (si > 500 lineas, las tablas faltantes ya estan añadidas).
   - `grep "DataProviderSupabase" src -r` (si 0 matches, Bloque B completo).
   - `grep "useState.*demo\|w_du\|w_rp" src/app/login` (si 0 matches, login limpio).
4. **Marca los checkboxes a medida que avanzas** editando este archivo.
5. **Reportes de hallazgos:** se escriben al final de este mismo archivo. No los borres entre sesiones.

---

## 6. Reporte de hallazgos Bloque A

### Hallazgo CRITICO #1 (2026-05-03)

El `docs/supabase-schema.sql` que existia ANTES de iniciar este bloque estaba **completamente desincronizado del codigo TypeScript**. No es un schema apto para producir el modelo que la app usa. Divergencias detectadas (no exhaustivo):

- `sedes`: NO tenia `color`, `horario` (text), `encargado_id`, `activa` (era `activo`). Tenia `hora_apertura`/`hora_cierre` que el TS no usa.
- `profiles`: NO tenia `apodo`, `avatar_base64` (era `avatar_url`), `tarifa_normal/tardanza/finsem/feriado` (tenia un solo `sueldo` — el TS NO usa sueldo base), `turno_entrada`/`turno_salida` (tenia `turno` text), `dni`, `telefono`, `rol_original`.
- `asistencia`: usaba `trabajador_id` en vez de `worker_id`, `hora_entrada/salida` en vez de `entrada/salida`, `motivo_edicion` en vez de `motivo_edit`. NO tenia `override_ingreso`, `sede_id_dia`, `turno_entrada/salida` (overrides), `marcado_por`, `verificado_por`, `verificado_at`.
- `adelantos`: usaba `trabajador_id`, sin `fecha`.
- `permisos`: usaba `trabajador_id`, sin `desde`/`hasta` (tenia un solo `fecha`), sin `pagado`.
- Tablas que NO existian en el schema viejo: `eventos`, `accesos_temporales`, `movimientos_caja`, `ajustes`, `cuadres_personales`, `pagos_planilla`. Existian en su lugar `captaciones`, `audit_log`, `feriados`, `planilla` (que no se usan en el codigo actual).
- `jaladores`: usaba `meta_mensual` + `comision_unit` (modelo de captacion). El TS espera `porcentaje_comision`, `apodo`, `avatar_base64`, `fecha_ingreso`.
- Helpers RLS: tenia `get_my_rol()`/`get_my_sede()` con nombres distintos a los que la app espera (`current_rol()`, `is_owner()`, `is_encargado()`, `current_sede()`).

**Decision tomada:** reescribir `docs/supabase-schema.sql` desde cero usando como fuente de verdad las shapes de `src/components/providers/DataProvider.tsx` + columnas de `src/lib/data/mappers.ts` + queries del `DataProviderSupabase.tsx`. Esto absorbe los puntos A.4-A.7 (añadir tablas faltantes, eliminar seed, idempotencia cron) en una sola accion: el archivo se sustituye entero.

### Hallazgo #2: el modo Supabase nunca corrio en produccion

Conclusion implicita del #1: si la app hubiera intentado correr en modo Supabase con ese schema, hubiera fallado en la primera query. Toda la persistencia real probada en la app fue via `DataProvider` localStorage (modo demo). El `DataProviderSupabase` esta escrito correctamente — su problema era que el schema al que apuntaba no existia.

### Hallazgo #3: tabla pendiente y storage

- `cuadres_personales` y `pagos_planilla` quedaron como `TODO(supabase)` en `DataProviderSupabase.tsx`: las funciones `setCuadrePersonal`, `getCuadrePersonal`, `clearCuadrePersonal`, `addPagoPlanilla`, `deletePagoPlanilla` mutan estado local en vez de Supabase. Hay que refactorizarlas en este bloque.
- `MiPerfilModal` usa el bucket `avatars`. El SQL nuevo lo incluye como opcional (commentariado para skip si no se quiere Storage).

### Resultado Bloque A (2026-05-03)

- **`docs/supabase-schema.sql`** reescrito desde cero: 13 tablas, 10 enums, 4 helpers RLS, 12 triggers `updated_at`, 1 trigger `on_auth_user_created`, ~30 policies RLS, bucket `avatars`, `pg_cron` job idempotente. Total ~430 lineas correctamente alineadas con los mappers.
- **`mappers.ts`** ampliado con `rowToCuadrePersonal/cuadrePersonalToRow` y `rowToPagoPlanilla/pagoPlanillaToRow`.
- **`DataProviderSupabase.tsx`** refactorizado:
  - `cargar()` ahora hidrata `cuadres_personales` y `pagos_planilla` desde Supabase.
  - `addPagoPlanilla` / `deletePagoPlanilla`: pasan de stubs en memoria a inserts/deletes reales.
  - `setCuadrePersonal` / `clearCuadrePersonal`: upsert/delete reales con `onConflict: "worker_id,fecha"`. Read-modify-write para preservar el otro flag (`worked` o `late`) cuando el patch trae solo uno.
- **`totalproject.md §6.1/6.2/6.3`** sincronizado: lista de tablas, reglas críticas, tabla RLS resumida con `cuadres_personales` y `pagos_planilla`. Nota explicita "Sin seed".
- **Typecheck:** `npx tsc --noEmit` pasa limpio.
- **Pendiente menor:** las firmas en `DataProvider.tsx` (demo) tipan `setCuadrePersonal`/`addPagoPlanilla` como `=> void`, pero la version Supabase devuelve `Promise<void>`. TS no se queja porque `Promise<void>` es asignable a `=> void`. Esto se resuelve naturalmente en el Bloque B cuando se elimine la version demo.

## 7. Reporte de hallazgos Bloque C

### Resultado Bloque B (2026-05-03)

- **Estrategia adoptada:** fusionar (no renombrar). El `DataProvider.tsx` y `SessionProvider.tsx` originales se reemplazaron in-place con la implementacion Supabase, conservando la API publica (tipos exportados, helpers, hooks). Esto evito tocar 39 archivos consumidores.
- **Archivos eliminados:** `DataProviderSupabase.tsx`, `SessionProviderSupabase.tsx`. Verificado por `find src/components/providers/`.
- **Archivos limpiados:** `Providers.tsx` (sin flag), `middleware.ts` (sin rama passthrough), `login/page.tsx` (sin cards demo, sin `entrarComoDemo`, sin keys `tramys_session_id`/`tramys_session_real_id`), `MiPerfilModal.tsx` (sin `USE_SUPABASE` check — el avatar siempre va a Storage y el email/password siempre via `supabase.auth.updateUser`).
- **Flag eliminada:** `NEXT_PUBLIC_USE_SUPABASE` no aparece en ningun archivo de `src/`. Verificado por `grep` sin matches.
- **Helpers preservados:** `pagoQueCubre`, `estaPagado`, `ingresoDia`, `isoToday`, `dayOfWeekISO`, `isWeekendISO`, `diasDePermiso`, `sedeDelDia`, `turnoDelDia`, `agregadoCaja`, `movimientosEnRango`, `ingresosJaladoresEnRango`, `derivadosCaja` — todos siguen exportandose desde `DataProvider.tsx`.
- **Logica de dominio portada al provider Supabase:**
  - `updatePermiso` ahora replica la regla de auto-marcar dias del rango como `estado: "permiso"` con override de ingreso segun `pagado` + feriado/finsemana/normal (esto faltaba en `DataProviderSupabase` original).
  - `addAccesoTemp` aplica `rolOtorgado` + `rol_original` en `profiles` al crear; `removeAccesoTemp` restaura si seguia activo.
- **Cuadres personales y pagos planilla:** ya no son stubs en memoria, son inserts/upserts/deletes reales (resultado del Bloque A).
- **Verificacion:** `npx tsc --noEmit` pasa limpio. `npm run build` pasa: 26 paginas estaticas generadas sin warnings.

### Resultado Bloque C (2026-05-03)

**Code review estatico de interconexion. Hallazgos:**

#### POSITIVOS (sin accion requerida)

- **Scope encargado consistente.** `dashboard`, `adelantos`, `trabajadores`, `reportes`, `asistencia` filtran todos por `(!isEnc || !sedeActor || w.sedeId === sedeActor.id)`. La pagina `asistencia` ademas chequea `sedeIdDia` (multi-sede por dia). El RLS en Supabase replica esta logica server-side.
- **Helpers multi-sede usados correctamente.** `sedeDelDia(rec, worker)` y `turnoDelDia(rec, worker)` se llaman en `mi-asistencia`, `asistencia`, `reportes` antes de leer `worker.sedeId`. No detecte casos donde la logica de planilla/asistencia lea `worker.sedeId` directo cuando deberia usar el helper.
- **Realtime cubre todas las tablas.** El `channel` se suscribe a `postgres_changes` con `event: "*"` y `schema: "public"` — cualquier cambio en cualquiera de las 13 tablas dispara `cargar()` y refresca el state global. No hay tabla con cambios silenciosos.
- **No se detecto estado paralelo.** Toda mutacion va por `d.set*()`/`d.add*()`/etc. No hay setStates locales que dupliquen datos del store.
- **Toda la app importa desde `@/components/providers/DataProvider` y `SessionProvider`** — los renames del Bloque B no rompieron ningun import porque conservamos los nombres de archivo y las exports publicas.

#### A MONITOREAR (no bloquean lanzamiento, documentados)

- **`addWorker` devuelve `id: pending_*`.** En Supabase los profiles se crean por trigger al invitar al usuario en Auth, no via insert directo. Si un componente espera el id real inmediatamente despues de `addWorker` (ej: para asignar relaciones), va a usar el placeholder. Hoy ningun consumidor lo hace asi (revisado `trabajadores/page.tsx`), pero anotar como deuda. La forma correcta a futuro: el modal de "Nuevo trabajador" debe invitar via `supabase.auth.admin.inviteUserByEmail` (requiere service role) y luego `updateWorker` sobre el id real.
- **`MiPerfilModal` tiene riesgo de inconsistencia.** Si `supabase.auth.updateUser({email})` falla pero el `d.updateWorker({email})` ya se ejecuto, el email del worker en `profiles` queda distinto al de `auth.users`. Hoy el codigo aborta antes de llegar al `d.updateWorker` si auth falla, asi que el riesgo es bajo. Pero si el insert a `profiles` falla DESPUES del auth update, el email queda actualizado en auth y no en profiles. Mitigation a futuro: hacer las dos llamadas en una transaccion server-side (Edge Function).
- **`addAccesoTemp` usa `state.workers` para resolver el `rol_original`.** Si el state aun no esta cargado al momento de la llamada, cae al fallback `'trabajador'`. Hoy el panel `/accesos` solo se renderiza despues de `HydrationGate`, asi que el state ya esta listo. Igual, considerar fetchear el rol vigente directamente de `profiles` para mayor robustez.
- **`updatePermiso` hace upserts paralelos a `asistencia`.** Si Realtime esta caido, el panel de quien aprobo el permiso vera la asistencia actualizada (porque el state local se reconstruye en el siguiente `cargar()` del Realtime), pero otros panels podrian quedar momentaneamente desincronizados. Es aceptable para el use case (los paneles otros refrescan al primer cambio).

#### ACCIONADOS EN ESTA SESION

- **CLAUDE.md** se reescribio quitando referencias al modo demo, al flag `NEXT_PUBLIC_USE_SUPABASE`, y al estilo "dos modos conmutables". Se documento el flujo Supabase puro, las dos tablas nuevas (`cuadres_personales`, `pagos_planilla`), el setup inicial paso a paso, y la convencion de namespace `mi-*` exclusivo del worker.
- **Glitch de encoding corregido:** la primera linea de `CLAUDE.md` tenia un caracter `n~` espurio antes del `#`. Limpiado.
- **Scope encargado en `/caja`** estaba documentado como "solo Owner" en la tabla de roles pero el RLS y la UI permiten al encargado operar su sede. La tabla en CLAUDE.md se corrigio.

### Pendientes post-lanzamiento (no bloquean)

- Refactor de `addWorker` para usar `supabase.auth.admin.inviteUserByEmail` (requiere endpoint server-side).
- Edge Function para sincronizar `auth.users.email` con `profiles.email` atomicamente desde `MiPerfilModal`.
- Considerar fetchear `rol_original` directo de `profiles` en `addAccesoTemp` para no depender del state local.

---

## 7.5 Estado de ejecucion en Supabase (2026-05-03, en curso)

- [x] **Wipe del schema previo** ejecutado (drop schema public cascade + recrear). Errores conocidos: `delete from storage.objects` falla en versiones nuevas de Supabase por `storage.protect_delete()` — el bucket avatars se limpia desde Dashboard → Storage manualmente.
- [x] **`docs/supabase-schema.sql` pegado y ejecutado** sin errores. 13 tablas creadas, 10 enums, ~30 policies RLS, `pg_cron` job activo.
- [x] **Realtime habilitado** para las 13 tablas via SQL Editor:
  ```sql
  alter publication supabase_realtime add table
    public.sedes, public.profiles, public.asistencia, public.adelantos,
    public.permisos, public.eventos, public.jaladores, public.ingresos_jaladores,
    public.accesos_temporales, public.movimientos_caja, public.ajustes,
    public.cuadres_personales, public.pagos_planilla;
  ```
- [ ] **Crear primer owner** — PENDIENTE: el usuario espera datos del dueño (email + password decididos por la dueña del negocio). Cuando los tenga, ejecutar:
  1. Dashboard → Authentication → Users → Add user → Create new user → marcar `Auto Confirm User`. Copiar el UUID.
  2. SQL Editor:
     ```sql
     update public.profiles
     set rol = 'owner', nombre = '<Nombre Completo de la Dueña>'
     where id = '<UUID-DEL-USER>';
     ```
- [x] **Configurar `.env.local`** — ya hecho por el usuario (con sus keys reales de Supabase).
- [ ] **Arrancar app:** `npm run dev`. Login con el email + password del owner (cuando ya este creado). Debe redirigir a `/dashboard` vacio (sin sedes, sin trabajadores — el schema no trae seed).
- [ ] **Setup inicial desde la UI** (despues del primer login del owner):
  1. Crear sedes en `/sedes` → "Nueva sede". Para cada sede: nombre, color (paleta TRAMYS), direccion, telefono, horario.
  2. Invitar al resto del equipo: Dashboard Supabase → Authentication → Users → Add user para cada encargado/trabajador. Marcar **Auto Confirm User** en cada uno. Apuntar el email + password decidido para cada persona (se les comparte para el primer login).
  3. Asignar sede + rol + tarifas + turno + apodo desde `/trabajadores` para cada usuario invitado. Por defecto entran como `rol='trabajador'` sin sede; el owner los completa.
  4. Si hay encargados, asignarles su sede en `/sedes` → editar sede → selector "Encargado".
  5. Si hay jaladores (modelo de comisiones), crearlos en `/jaladores` → "Nuevo jalador" con sede y % de comision.
- [ ] **Smoke test cross-rol** (recomendado antes de soltar el lanzamiento):
  1. Como owner: crear sede + invitar a 1 encargado + 1 trabajador.
  2. Cerrar sesion → entrar como trabajador → marcar entrada en `/mi-asistencia`. Debe aparecer en `/asistencia` admin como "pendiente verificar".
  3. Cerrar sesion → entrar como encargado → verificar la marca. Debe verse el badge "verificada" en el panel del trabajador.
  4. Trabajador solicita un adelanto. Owner lo aprueba. Trabajador lo ve "aprobado".
  5. Trabajador anota en su cuadre personal. Owner NO debe poder verlo (RLS estricta).
- [ ] **Cuando este todo OK:** anunciar lanzamiento al equipo, compartir credenciales individuales, archivar este `LAUNCH_PLAN.md` (mover a `.claude/archive/` o dejar como historico).

### Verificacion rapida que ya quedo bien (correr en SQL Editor)

```sql
-- 13 tablas creadas
select count(*) from information_schema.tables where table_schema = 'public';
-- Esperado: 13

-- pg_cron job activo
select jobid, schedule, command, active from cron.job where jobname = 'tramys_expirar_accesos';
-- Esperado: 1 fila, schedule '* * * * *', active=true

-- Realtime habilitado en las 13 tablas
select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';
-- Esperado: 13
```

---

## 8. Variables de entorno finales esperadas

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role>   # solo server-side / SQL Editor
```

(No mas `NEXT_PUBLIC_USE_SUPABASE` — la app es 100% Supabase ahora.)
