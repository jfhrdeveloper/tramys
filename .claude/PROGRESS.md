# 📖 TRAMYS — Roadmap y Reglas del Proyecto

> Documento maestro de control de estado, decisiones arquitectónicas y reglas globales para mantener la consistencia en la base de código.

---

## 🎯 1. Reglas Globales del Proyecto

### 📝 Estándar Visual de Comentarios

Para mantener una legibilidad impecable, aplica estrictamente esta jerarquía en todos los archivos `.ts` y `.tsx`:

- **Nivel 1 (Bloques principales):** `/* ================= BLOQUE PRINCIPAL ================= */`
- **Nivel 2 (Secciones lógicas):** `/* ====== Sección secundaria ====== */`
- **Nivel 3 (Subsecciones):** `/* ==== Subsección ==== */`
- **Nivel 4 (Notas de una línea):** `// Nota específica` o `/* Elemento adicional */`

> **⚠️ Regla Crítica (React/JSX):** Dentro del JSX (en el `return`), usa **ÚNICA Y ESTRICTAMENTE** `{/* */}`. El uso de `//` dentro del JSX romperá la aplicación.

### 📱 Diseño Responsivo Adaptativo (Mobile-First)

Todo componente y vista debe escalar correctamente siguiendo los breakpoints de Tailwind:

| Nivel    | Breakpoint | Dispositivo Objetivo   | Reglas Base de Layout                                                        |
| :------- | :--------- | :--------------------- | :--------------------------------------------------------------------------- |
| **base** | `< 640px`  | Móvil (360px–430px)    | Layout 1 columna, bottom-nav / menú hamburguesa, touch targets ≥ 44px.       |
| **sm**   | `≥ 640px`  | Móvil grande / Paisaje | 1 columna con márgenes holgados.                                             |
| **md**   | `≥ 768px`  | Tablet (768px–1024px)  | Grid de 2 columnas. Sidebar en overlay/colapsable.                           |
| **lg**   | `≥ 1024px` | Laptop 13–14"          | Sidebar fijo. Grid de 2-3 columnas.                                          |
| **xl**   | `≥ 1280px` | Laptop 15–16" estándar | Grid de ≥ 3 columnas sin scroll horizontal.                                  |
| **2xl**  | `≥ 1536px` | Monitor / PC 17"+      | `max-w-screen-xl` o `max-w-[1440px]` centrado. Layouts no estirados al 100%. |

- **Anchos:** Nunca usar anchos fijos en px para contenedores. Usar `w-full` y `max-w-*`. El sidebar PC es fijo (`w-64`/`w-72`), el contenido usa `flex-1 min-w-0`.
- **Imágenes:** Siempre `w-full h-auto` u `object-cover`.
- **Tipografía:** Responsiva (`text-sm md:text-base xl:text-lg`), nunca tamaños fijos.

### 🎨 Paleta TRAMYS y Tipografía

- **Modo Claro:** Brand `#C41A3A` · Claro `#e8304d` · Oscuro `#a01530` · Fondo `#f8f7f4` · Card `#ffffff` · Texto `#1a1917`
- **Modo Oscuro:** Fondo `#0e1117` · Card `#161b22` · Texto `#e8eaf0`
- **Fuentes:** _Bricolage Grotesque_ (UI General) + _DM Mono_ (Código, Fechas, Etiquetas)

---

## 🧠 2. Decisiones Arquitectónicas (Fijas)

- 💾 **Persistencia:** `localStorage` a través del store global `DataProvider`. Por ahora no se usa Supabase Storage/Inserts para iterar rápido la UI.
- 🇵🇪 **Feriados Perú:** Precargados solo los fijos de 2026 y otros años en `peruHolidays.ts`. Habrá checkbox en la vista de Eventos para alternar su visibilidad.
- ⏱️ **Accesos Temporales:** Rol completo por duración (1h, 4h, 1d, 7d, custom hasta fecha). La expiración será visible en la tabla.
- 📸 **Evidencia Fotográfica:** Guardada como Base64 en localStorage, recortada en ratio 1:1 vía canvas crop.
- 💰 **Cálculo de Sueldo:** **NO EXISTE sueldo base**. Todo es dinámico: `Σ (asistencia × tarifa del día)` + overrides manuales. Las tarifas son: `diaNormal`, `tardanza`, `finSemana`, `feriado`.

---

## 🚀 3. Estado de Desarrollo (Roadmap)

### ✅ Fases Completadas (Fundamentos y Core Admin)

- [x] **A1** Store global (`DataProvider`)
- [x] **A2** `PhotoUpload` + iconos (cake, money_bill)
- [x] **A3** Preloader de login + cerrar sesión en footer
- [x] **B1** Dashboard principal rediseñado
- [x] **B2** Sedes grid + Lima + sistema de color
- [x] **B3** Trabajadores (CRUD, vista de asistencia y sueldo por día)
- [x] **B4** Jaladores (Lista + perfil, registro de ingresos)
- [x] **B5** Asistencia (Vista administrador)
- [x] **B6** Planilla (Cálculo ganancia empresa y días reales)

### ⏳ Fases Pendientes (Trabajador y Pulido)

- [x] **B7** Eventos (Toggle feriados oficiales, próximo evento, vista calendario)
- [x] **B8** Reportes (Rediseño visual completo y nuevos gráficos)
- [x] **B9** Accesos temporales (Modal y gestión de caducidad)
- [x] **C1** Trabajador: Panel `mi-asistencia` (Calendario multiverse)
- [x] **C2** Trabajador: Páginas restantes conectadas al `DataProvider` (mi-sueldo, mis-adelantos, mis-permisos, mis-alertas)
- [x] **D1** Pulido final (Cuadratura, centrado, QA de Responsive) — `page-main` centrado y con tope `max-width: 1440px` ≥2xl, `HydrationGate` cubre carga inicial.

---

## 📂 4. Referencias: Archivos Core Creados

- `src/components/providers/DataProvider.tsx` (incluye ticker de caducidad de accesos temporales)
- `src/components/providers/SessionProvider.tsx` (sesión activa local con `useSession`/`switchTo`/`signOut`)
- `src/components/ui/PhotoUpload.tsx`
- `src/components/ui/Preloader.tsx`
- `src/components/ui/Skeleton.tsx` (Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonStats)
- `src/components/ui/HydrationGate.tsx` (gate global que cubre la hidratación inicial con skeleton unificado)
- `src/components/ui/MiPerfilModal.tsx` (modal global de edición del usuario activo: foto, Nombres + Apellidos, apodo, email, teléfono, DNI, contraseña)
- `src/lib/utils/peruHolidays.ts`

---

## 🧠 5. Memoria de Requerimientos Detallados (Backlog Operativo)

### 👑 VISTA ADMINISTRADOR / OWNER

- [x] **1. Dashboard:** Rediseño completo, hero unificado, métricas correctas. Cards de KPI superiores eliminadas (todo dentro del hero).
- [x] **2. Sedes:** Cards apiladas, sede Lima, "Caja" unificada, color modificable, **selector de encargado** + checkbox activa en el modal.
- [x] **3. Trabajadores:**
  - [x] Botón "Nuevo trabajador" funcional (incluye **apodo**).
  - [x] Agregar foto 1x1 cuadrable (Upload base64).
  - [x] **ELIMINAR** progreso del mes (no se muestra en el header del perfil).
  - [x] Asistencia: Subpanel Multiverse (calendario) + historial reciente con Editar.
  - [x] Editar registro: modal con estado, entrada/salida, override de ingreso y motivo.
  - [x] "Mi sueldo": icono billete (`money_bill`), tarifas modificables desde "Perfil", todo derivado de la asistencia.
  - [x] Adelantos y permisos: modales propios (sin más prompt()) y aprobación inline.
  - [x] Perfil y Turnos completamente editables.
- [x] **4. Jaladores:**
  - [x] Subpanel de lista + vista de movimiento (cuadre semanal/mensual + perfil).
  - [x] Botón "Registrar ingreso" con modal editable.
  - [x] **ELIMINAR** "Captación" → "Comisiones" en toda la UI activa (queda solo en código Supabase legacy no montado).
  - [x] Perfil: Dashboard dinámico (KPIs, barras 14 días, mejor día, promedio).
  - [x] **ELIMINAR** KPIs superiores (sin StatCards arriba, sólo lista + cuadre).
- [x] **5. Asistencia:**
  - [x] Mejorar contraste (actualmente fondo y letras muy blancas).
  - [x] Mostrar **Apodo** (prioridad) o Nombre. NO mostrar cantidad de asistentes.
  - [x] Agregar Dropdown Mes/Año (manteniendo vista actual).
  - [x] **ELIMINAR** KPIs superiores (Presencias, Tardanzas, Ausencias).
- [x] **6. Planilla:**
  - [x] Cálculo `Ingresos Sedes − Neto = Queda Empresa` visible como KPI.
  - [x] Días trabajados separados por tipo (Normal/Tarde/FdS/Feriado) en columnas + tfoot con totales.
  - [x] Eliminar Sueldo Base (ya es suma de días).
- [x] **7. Eventos:**
  - [x] Checkbox para mostrar feriados oficiales de Perú + agregados.
  - [x] **ELIMINAR** KPIs de totales. Reemplazado por card "Próximo evento".
  - [x] SVG cumpleaños = Torta. Cada tipo de evento usa su SVG (`cake`, `calendar`, `sedes`).
  - [x] Dropdowns Mes/Año.
- [x] **8. Reportes:**
  - [x] Rediseño visual completo (LineChart con áreas, HBars, ingresos por sede, exportar).
  - [x] **ELIMINAR** cards superiores. Solo selector de año + tarjetas analíticas.
  - [x] Estética de gráficos mejorada (gradientes, gridlines, leyenda, etiquetas DM Mono).
- [x] **9. Accesos:**
  - [x] Asignar rol temporal con duración (1h/4h/12h/1d/7d/custom).
  - [x] **Caducidad real**: al crear se aplica `rolOtorgado` al worker; al expirar/revocar se restaura `rolOriginal` (ticker cada 30s en `DataProvider`).
  - [x] Tabla de activos con tiempo restante y opción "Revocar".
  - [x] Audit log con histórico completo.
  - [x] **Impersonar / "Ver como"** desde la tabla de Usuarios (cambia la sesión activa y redirige según el rol).

### 👷 VISTA TRABAJADOR

- [x] **1. Asistencia:**
  - [x] Subpanel Multiverse exacto para que el trabajador cuadre ingresos.
  - [x] Subpanel de vista general (historial mensual).
- [x] **2. Mi Sueldo:** Desglose dinámico por tipo de día, tarifas, adelantos y detalle por día.
- [x] **3. Mis Adelantos:** Solicitud, filtros por estado, KPIs y descuento del mes.
- [x] **4. Mis Permisos:** Solicitud por tipo (personal/médico/vacaciones) con filtros y badges.
- [x] **5. Mis Alertas:** Notificaciones agregadas (solicitudes, tardanzas, eventos próximos).

### ⚙️ GENERAL (Reglas Transversales)

- [x] Todo perfectamente cuadrado, centrado, bien diseñado. (`page-main` centrado con `max-width: 1440px` ≥2xl, paddings escalados por breakpoint, doble candado anti-overflow horizontal.)
- [x] **Regla de Sueldo:** Nadie gana sueldo base, todo es cálculo diario por tipo de día / manual override.
- [x] **Sidebar/Menú:** Línea divisora y botón SVG "Cerrar sesión" debajo del email/sede (admin y trabajador).
- [x] **Mi Perfil (acceso global):** En todas las sesiones (Owner, Encargado, Trabajador) y en ambas vistas (sidebar PC + bottom-nav móvil), justo **arriba de "Cerrar sesión"** debe haber un acceso "Mi perfil" que abra una vista editable del usuario activo (foto, **Nombres + Apellidos** en columnas, apodo, email, teléfono, DNI, contraseña). Los cambios se reflejan en el `DataProvider` y se ven en toda la app.
- [x] **Cerrar sesión robusto:** Los bottom-navs (admin y worker) usan `useSession().signOut` (limpia `tramys_session_id` y redirige a `/login`), no `useAuth` de Supabase, para que el cierre realmente surta efecto en el modo demo.
- [x] **Interconexión total:** Owner / Encargado / Trabajador comparten el mismo `DataProvider` + `SessionProvider`. Cualquier cambio (perfil, asistencia, adelanto, permiso, tarifa, sede, acceso temporal) impacta inmediatamente a las demás vistas. Sin estado paralelo por rol.
- [x] **Preloader saluda con Apodo o Nombre, nunca con email.** El login fetchea `nombre` + `apodo` desde `profiles`; el `Preloader` prefiere `apodo` y cae al primer nombre como fallback.
- [x] **Preloader:** Bienvenida al iniciar sesión con Nombre o Apodo.
- [x] **Funcionalidad:** Owner / Encargado / Trabajador conectados al `DataProvider` y al `SessionProvider`. El "Marcar" del trabajador escribe en el store. La impersonación desde Accesos cambia la sesión y redirige al panel correspondiente. Los accesos temporales aplican y restauran el rol automáticamente.
- [x] **Transiciones y Skeletons:** Fade-in global implementado y `HydrationGate` aplicado en ambos layouts (admin/trabajador) — muestra `SkeletonStats` + `SkeletonCard` + `SkeletonTable` mientras `DataProvider.ready` y `SessionProvider.ready` no estén listos.

---

## 🐘 6. Esquema Supabase (pegar en SQL Editor)

> Script idempotente. Crea extensiones, enums, tablas, índices, trigger de `updated_at`, RLS y políticas. Está pensado para correr **una sola vez** en un proyecto nuevo. Re-ejecutarlo no rompe datos: usa `IF NOT EXISTS` y `CREATE OR REPLACE` donde aplica.

### 6.1 Tabla `profiles` + bucket `avatars` (auth + foto de perfil)

```sql
/* ============================================================
   TRAMYS — Esquema Supabase completo
   Pegar tal cual en Project → SQL Editor → New query → Run
   ============================================================ */

/* ====== Extensiones ====== */
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

/* ====== Enums ====== */
do $$ begin
  create type rol_usuario as enum ('owner', 'encargado', 'trabajador');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_asist as enum ('presente', 'tardanza', 'ausente', 'permiso', 'feriado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_solicitud as enum ('pendiente', 'aprobado', 'rechazado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_permiso as enum ('personal', 'medico', 'vacaciones');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_evento as enum ('cumpleanos', 'feriado-nacional', 'feriado-empresa', 'otro');
exception when duplicate_object then null; end $$;

/* ====== Trigger genérico updated_at ====== */
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
```

### 6.2 Tablas operativas

```sql
/* ============================================================
   SEDES
   ============================================================ */
create table if not exists public.sedes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  color           text not null default '#C41A3A',
  direccion       text default '',
  telefono        text default '',
  horario         text default '',
  encargado_id    uuid,
  activa          boolean not null default true,
  caja_dia        jsonb not null default '{"ingresos":0,"material":0}'::jsonb,
  caja_semana     jsonb not null default '{"ingresos":0,"material":0}'::jsonb,
  caja_mes        jsonb not null default '{"ingresos":0,"material":0}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_sedes_activa on public.sedes(activa);

/* ============================================================
   PROFILES (1:1 con auth.users) — incluye perfil editable
   ============================================================ */
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text not null default '',
  apodo           text default '',
  avatar_base64   text,
  rol             rol_usuario not null default 'trabajador',
  sede_id         uuid references public.sedes(id) on delete set null,
  cargo           text default '',
  turno_entrada   text default '08:00',
  turno_salida    text default '18:00',
  tarifa_normal   numeric(10,2) not null default 0,
  tarifa_tardanza numeric(10,2) not null default 0,
  tarifa_finsem   numeric(10,2) not null default 0,
  tarifa_feriado  numeric(10,2) not null default 0,
  fecha_ingreso   date not null default current_date,
  email           text,
  dni             text,
  telefono        text,
  activo          boolean not null default true,
  rol_original    rol_usuario,            /* para accesos temporales */
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_profiles_sede   on public.profiles(sede_id);
create index if not exists idx_profiles_rol    on public.profiles(rol);
create index if not exists idx_profiles_activo on public.profiles(activo);

/* FK diferida sedes.encargado_id → profiles(id) */
alter table public.sedes
  drop constraint if exists fk_sedes_encargado,
  add  constraint fk_sedes_encargado
       foreign key (encargado_id) references public.profiles(id) on delete set null;

/* ============================================================
   ASISTENCIA
   ============================================================ */
create table if not exists public.asistencia (
  id                uuid primary key default gen_random_uuid(),
  worker_id         uuid not null references public.profiles(id) on delete cascade,
  fecha             date not null,
  entrada           text,
  salida            text,
  estado            estado_asist not null default 'presente',
  override_ingreso  numeric(10,2),
  motivo_edit       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (worker_id, fecha)
);
create index if not exists idx_asist_worker on public.asistencia(worker_id);
create index if not exists idx_asist_fecha  on public.asistencia(fecha);

/* ============================================================
   ADELANTOS
   ============================================================ */
create table if not exists public.adelantos (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.profiles(id) on delete cascade,
  monto         numeric(10,2) not null,
  motivo        text default '',
  estado        estado_solicitud not null default 'pendiente',
  fecha         date not null default current_date,
  aprobado_por  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_adel_worker on public.adelantos(worker_id);
create index if not exists idx_adel_estado on public.adelantos(estado);

/* ============================================================
   PERMISOS
   ============================================================ */
create table if not exists public.permisos (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.profiles(id) on delete cascade,
  tipo          tipo_permiso not null,
  motivo        text default '',
  desde         date not null,
  hasta         date not null,
  estado        estado_solicitud not null default 'pendiente',
  aprobado_por  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_perm_worker on public.permisos(worker_id);
create index if not exists idx_perm_estado on public.permisos(estado);

/* ============================================================
   EVENTOS (cumpleaños, feriados empresa, otros)
   ============================================================ */
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        tipo_evento not null default 'otro',
  fecha       date not null,
  descripcion text default '',
  worker_id   uuid references public.profiles(id) on delete set null,
  sede_id     uuid references public.sedes(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_eventos_fecha on public.eventos(fecha);
create index if not exists idx_eventos_tipo  on public.eventos(tipo);

/* ============================================================
   JALADORES + INGRESOS (comisiones)
   ============================================================ */
create table if not exists public.jaladores (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  apodo                text default '',
  telefono             text default '',
  porcentaje_comision  numeric(5,2) not null default 10,
  sede_id              uuid references public.sedes(id) on delete set null,
  activo               boolean not null default true,
  fecha_ingreso        date not null default current_date,
  avatar_base64        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_jal_activo on public.jaladores(activo);

create table if not exists public.ingresos_jaladores (
  id          uuid primary key default gen_random_uuid(),
  jalador_id  uuid not null references public.jaladores(id) on delete cascade,
  fecha       date not null default current_date,
  monto       numeric(10,2) not null,
  nota        text default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_ij_jalador on public.ingresos_jaladores(jalador_id);
create index if not exists idx_ij_fecha   on public.ingresos_jaladores(fecha);

/* ============================================================
   ACCESOS TEMPORALES (impersonación con caducidad)
   ============================================================ */
create table if not exists public.accesos_temporales (
  id              uuid primary key default gen_random_uuid(),
  worker_id       uuid not null references public.profiles(id) on delete cascade,
  rol_otorgado    rol_usuario not null,
  rol_original    rol_usuario not null,
  motivo          text default '',
  desde           timestamptz not null default now(),
  hasta           timestamptz not null,
  creado_por      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_at_worker on public.accesos_temporales(worker_id);
create index if not exists idx_at_hasta  on public.accesos_temporales(hasta);

/* ============================================================
   AJUSTES GLOBALES (1 sola fila — singleton)
   ============================================================ */
create table if not exists public.ajustes (
  id                            int primary key default 1,
  mostrar_feriados_oficiales    boolean not null default true,
  updated_at                    timestamptz not null default now(),
  constraint ajustes_singleton check (id = 1)
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;
```

### 6.3 Triggers `updated_at`

```sql
do $$
declare t text;
begin
  foreach t in array array[
    'sedes','profiles','asistencia','adelantos','permisos',
    'eventos','jaladores','accesos_temporales','ajustes'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;
       create trigger trg_%1$s_updated
         before update on public.%1$s
         for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;
```

### 6.4 Auto-creación de `profiles` al registrar un usuario en `auth.users`

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 6.5 Helpers de RLS (rol del usuario actual)

```sql
create or replace function public.current_rol()
returns rol_usuario language sql stable as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_owner()
returns boolean language sql stable as $$
  select coalesce(public.current_rol() = 'owner', false);
$$;

create or replace function public.is_encargado()
returns boolean language sql stable as $$
  select coalesce(public.current_rol() = 'encargado', false);
$$;

create or replace function public.current_sede()
returns uuid language sql stable as $$
  select sede_id from public.profiles where id = auth.uid();
$$;
```

### 6.6 RLS — habilitar y crear políticas

```sql
/* Habilitar RLS en todas las tablas */
alter table public.sedes               enable row level security;
alter table public.profiles            enable row level security;
alter table public.asistencia          enable row level security;
alter table public.adelantos           enable row level security;
alter table public.permisos            enable row level security;
alter table public.eventos             enable row level security;
alter table public.jaladores           enable row level security;
alter table public.ingresos_jaladores  enable row level security;
alter table public.accesos_temporales  enable row level security;
alter table public.ajustes             enable row level security;

/* ====== SEDES ====== */
drop policy if exists sedes_read     on public.sedes;
drop policy if exists sedes_write    on public.sedes;
create policy sedes_read  on public.sedes for select using (auth.uid() is not null);
create policy sedes_write on public.sedes for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== PROFILES ====== */
drop policy if exists profiles_self        on public.profiles;
drop policy if exists profiles_read_team   on public.profiles;
drop policy if exists profiles_owner_all   on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self        on public.profiles for select using (id = auth.uid());
create policy profiles_read_team   on public.profiles for select using (
  public.is_owner()
  or (public.is_encargado() and sede_id = public.current_sede())
);
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_owner_all   on public.profiles for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== ASISTENCIA ====== */
drop policy if exists asist_self      on public.asistencia;
drop policy if exists asist_team_read on public.asistencia;
drop policy if exists asist_admin     on public.asistencia;
create policy asist_self      on public.asistencia for all
  using (worker_id = auth.uid()) with check (worker_id = auth.uid());
create policy asist_team_read on public.asistencia for select using (
  public.is_owner()
  or (public.is_encargado() and exists (
        select 1 from public.profiles p
        where p.id = asistencia.worker_id and p.sede_id = public.current_sede()))
);
create policy asist_admin     on public.asistencia for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== ADELANTOS ====== */
drop policy if exists adel_self  on public.adelantos;
drop policy if exists adel_admin on public.adelantos;
create policy adel_self  on public.adelantos for select using (worker_id = auth.uid());
create policy adel_self_insert on public.adelantos for insert
  with check (worker_id = auth.uid());
create policy adel_admin on public.adelantos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== PERMISOS ====== */
drop policy if exists perm_self  on public.permisos;
drop policy if exists perm_admin on public.permisos;
create policy perm_self  on public.permisos for select using (worker_id = auth.uid());
create policy perm_self_insert on public.permisos for insert
  with check (worker_id = auth.uid());
create policy perm_admin on public.permisos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== EVENTOS ====== */
drop policy if exists ev_read  on public.eventos;
drop policy if exists ev_write on public.eventos;
create policy ev_read  on public.eventos for select using (auth.uid() is not null);
create policy ev_write on public.eventos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== JALADORES + INGRESOS ====== */
drop policy if exists jal_read   on public.jaladores;
drop policy if exists jal_write  on public.jaladores;
drop policy if exists ij_read    on public.ingresos_jaladores;
drop policy if exists ij_write   on public.ingresos_jaladores;
create policy jal_read  on public.jaladores for select using (auth.uid() is not null);
create policy jal_write on public.jaladores for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());
create policy ij_read   on public.ingresos_jaladores for select using (auth.uid() is not null);
create policy ij_write  on public.ingresos_jaladores for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== ACCESOS TEMPORALES ====== */
drop policy if exists at_read  on public.accesos_temporales;
drop policy if exists at_write on public.accesos_temporales;
create policy at_read  on public.accesos_temporales for select using (
  public.is_owner() or public.is_encargado() or worker_id = auth.uid()
);
create policy at_write on public.accesos_temporales for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== AJUSTES (solo owner edita; todos leen) ====== */
drop policy if exists aj_read  on public.ajustes;
drop policy if exists aj_write on public.ajustes;
create policy aj_read  on public.ajustes for select using (auth.uid() is not null);
create policy aj_write on public.ajustes for all
  using (public.is_owner()) with check (public.is_owner());
```

### 6.7 Storage para fotos (opcional — el modo demo usa base64)

```sql
/* Bucket público "avatars". Si prefieres mantener base64 en profiles.avatar_base64,
   puedes omitir esta sección entera. */
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read"   on storage.objects;
drop policy if exists "avatars_upload" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_read"   on storage.objects for select  using (bucket_id = 'avatars');
create policy "avatars_upload" on storage.objects for insert  with check (
  bucket_id = 'avatars' and auth.role() = 'authenticated'
);
create policy "avatars_update" on storage.objects for update  using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);
create policy "avatars_delete" on storage.objects for delete  using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);
```

### 6.8 Seed mínimo para empezar (opcional)

```sql
/* Inserta 2 sedes de ejemplo. Ajusta IDs/nombres según tu negocio. */
insert into public.sedes (nombre, color, direccion, telefono, horario)
values
  ('Santa Anita', '#C41A3A', 'Av. Los Eucaliptos 123', '+51 999 111 222', 'L-D 8:00-22:00'),
  ('Lima',        '#6366f1', 'Jr. de la Unión 456',    '+51 999 333 444', 'L-S 9:00-21:00')
on conflict do nothing;
```

### 6.9 Notas de aplicación

- **Crear el primer owner manualmente:** registra un usuario por Auth → ejecuta `update public.profiles set rol = 'owner' where id = '<uuid>';`.
- Las **tarifas viven en `profiles`** (no hay sueldo base): `tarifa_normal`, `tarifa_tardanza`, `tarifa_finsem`, `tarifa_feriado`.
- El campo `caja_*` en `sedes` está como `jsonb` para mantener la forma `{ ingresos, material }` que usa el `DataProvider`.
- `accesos_temporales`: el cliente debe escribir `rol_original` con el rol vigente del worker, aplicar `rol_otorgado` en `profiles.rol`, y al expirar (cron / acción manual) restaurar `rol_original`. La vista `Accesos` ya implementa este flujo en localStorage; al migrar a Supabase, replicar la misma lógica con un `update profiles set rol = at.rol_original ...`.
- Si decides **no usar el bucket `avatars`**, deja `profiles.avatar_base64` y guarda la imagen en base64 (igual que el modo demo actual).

### 6.10 Caducidad de accesos temporales en backend (pg_cron)

```sql
/* Requiere la extensión pg_cron habilitada en el proyecto Supabase
   (Database → Extensions → pg_cron). */
create extension if not exists pg_cron;

create or replace function public.expirar_accesos_temporales()
returns void language plpgsql security definer as $$
begin
  /* Restaura el rol original a todos los workers cuyo acceso ya venció */
  update public.profiles p
     set rol          = at.rol_original,
         rol_original = null
    from public.accesos_temporales at
   where at.worker_id = p.id
     and at.hasta    <= now();

  /* Elimina los accesos vencidos */
  delete from public.accesos_temporales where hasta <= now();
end $$;

/* Programa la ejecución cada minuto */
select cron.schedule(
  'tramys_expirar_accesos',
  '* * * * *',
  $$ select public.expirar_accesos_temporales(); $$
);
```

### 6.11 Toggle de backend en la app

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_USE_SUPABASE=true   # activa providers Supabase + Realtime
```

- Sin la flag (o `false`), la app funciona en modo demo con `localStorage` (los providers locales originales).
- Con `true`, se activan `DataProviderSupabase` + `SessionProviderSupabase`, suscripciones Realtime y sincronización de email/contraseña/avatar contra Supabase Auth + Storage.

---

## 🛠️ 7. Fases de migración a Supabase (E1–E4)

- [x] **E1 Adapter & Providers conectados** — `src/lib/data/mappers.ts`, `DataProviderSupabase`, `SessionProviderSupabase`, wrapper `Providers` que conmuta por `NEXT_PUBLIC_USE_SUPABASE`. Los pages siguen usando `useData()` / `useSession()` sin cambios.
- [x] **E2 Realtime** — `DataProviderSupabase` se suscribe a `postgres_changes` en todo el schema `public` y refresca el estado para mantener la interconexión Owner / Encargado / Trabajador.
- [x] **E3 Caducidad backend** — Función `expirar_accesos_temporales()` programada con `pg_cron` cada minuto. El ticker del cliente queda como defensa-en-profundidad.
- [x] **E4 Storage de avatares** — Helper `src/lib/storage/avatars.ts` con `subirAvatar`/`eliminarAvatar`. `MiPerfilModal` sube la foto al bucket `avatars/<uid>/avatar.png` y guarda la URL pública. Email y contraseña se sincronizan vía `supabase.auth.updateUser` cuando el modo Supabase está activo.
