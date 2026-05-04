-- ================================================================
-- TRAMYS — SCHEMA SUPABASE COMPLETO
-- Fuente unica del modelo de datos. Pegar en SQL Editor → Run.
-- Idempotente: re-ejecutarlo no rompe datos existentes.
-- ================================================================

-- ====== Extensiones ======
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;

-- ====== ENUM TYPES ======
do $$ begin create type rol_usuario      as enum ('owner','encargado','trabajador');                                  exception when duplicate_object then null; end $$;
do $$ begin create type estado_asist     as enum ('presente','tardanza','ausente','permiso','feriado');               exception when duplicate_object then null; end $$;
do $$ begin create type estado_solicitud as enum ('pendiente','aprobado','rechazado');                                exception when duplicate_object then null; end $$;
do $$ begin create type tipo_permiso     as enum ('personal','medico','vacaciones');                                  exception when duplicate_object then null; end $$;
do $$ begin create type tipo_evento      as enum ('cumpleanos','feriado-nacional','feriado-empresa','otro');          exception when duplicate_object then null; end $$;
do $$ begin create type tipo_movimiento  as enum ('ingreso','gasto-personal','gasto-fijo','gasto-manual');            exception when duplicate_object then null; end $$;
do $$ begin create type categoria_fijo   as enum ('luz','agua','internet','local','otro');                            exception when duplicate_object then null; end $$;
do $$ begin create type metodo_pago      as enum ('efectivo','yape','transferencia');                                 exception when duplicate_object then null; end $$;
do $$ begin create type periodo_pago     as enum ('quincenal','mensual');                                             exception when duplicate_object then null; end $$;
do $$ begin create type marcado_por_t    as enum ('trabajador','owner','encargado');                                  exception when duplicate_object then null; end $$;

-- ====== Trigger generico updated_at ======
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ================================================================
-- TABLAS
-- ================================================================

-- sedes
create table if not exists public.sedes (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  color        text not null default '#C41A3A',
  direccion    text not null default '',
  telefono     text not null default '',
  horario      text not null default '',
  encargado_id uuid,
  activa       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_sedes_activa on public.sedes(activa);

-- profiles (extiende auth.users)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text not null default '',
  apodo           text default '',
  avatar_base64   text,
  rol             rol_usuario not null default 'trabajador',
  sede_id         uuid references public.sedes(id) on delete set null,
  cargo           text default '',
  turno_entrada   text not null default '08:00',
  turno_salida    text not null default '18:00',
  tarifa_normal   numeric(10,2) not null default 0,
  tarifa_tardanza numeric(10,2) not null default 0,
  tarifa_finsem   numeric(10,2) not null default 0,
  tarifa_feriado  numeric(10,2) not null default 0,
  fecha_ingreso   date not null default current_date,
  activo          boolean not null default true,
  email           text,
  dni             text,
  telefono        text,
  rol_original    rol_usuario,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_profiles_sede   on public.profiles(sede_id);
create index if not exists idx_profiles_rol    on public.profiles(rol);
create index if not exists idx_profiles_activo on public.profiles(activo);

-- FK diferida: sedes.encargado_id -> profiles(id)
alter table public.sedes drop constraint if exists fk_sedes_encargado;
alter table public.sedes add constraint fk_sedes_encargado
  foreign key (encargado_id) references public.profiles(id) on delete set null;

-- asistencia
create table if not exists public.asistencia (
  id                uuid primary key default gen_random_uuid(),
  worker_id         uuid not null references public.profiles(id) on delete cascade,
  fecha             date not null,
  entrada           text,
  salida            text,
  estado            estado_asist not null default 'presente',
  override_ingreso  numeric(10,2),
  motivo_edit       text,
  -- Multi-sede por dia (override de profiles.sede_id / turno_*)
  sede_id_dia       uuid references public.sedes(id) on delete set null,
  turno_entrada     text,
  turno_salida      text,
  -- Verificacion laxa (Opcion B)
  marcado_por       marcado_por_t,
  verificado_por    uuid references public.profiles(id) on delete set null,
  verificado_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (worker_id, fecha)
);
create index if not exists idx_asist_worker   on public.asistencia(worker_id);
create index if not exists idx_asist_fecha    on public.asistencia(fecha);
create index if not exists idx_asist_sede_dia on public.asistencia(sede_id_dia);

-- adelantos
create table if not exists public.adelantos (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.profiles(id) on delete cascade,
  monto        numeric(10,2) not null check (monto >= 0),
  motivo       text not null default '',
  estado       estado_solicitud not null default 'pendiente',
  fecha        date not null default current_date,
  aprobado_por uuid references public.profiles(id) on delete set null,
  nota         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_adel_worker on public.adelantos(worker_id);
create index if not exists idx_adel_estado on public.adelantos(estado);

-- permisos
create table if not exists public.permisos (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.profiles(id) on delete cascade,
  desde        date not null,
  hasta        date not null,
  tipo         tipo_permiso not null default 'personal',
  motivo       text not null default '',
  estado       estado_solicitud not null default 'pendiente',
  pagado       boolean not null default false,
  aprobado_por uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_perm_worker on public.permisos(worker_id);
create index if not exists idx_perm_estado on public.permisos(estado);

-- eventos
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

-- jaladores
create table if not exists public.jaladores (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  apodo               text default '',
  avatar_base64       text,
  sede_id             uuid references public.sedes(id) on delete set null,
  porcentaje_comision numeric(5,2) not null default 10,
  activo              boolean not null default true,
  fecha_ingreso       date not null default current_date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_jal_activo on public.jaladores(activo);
create index if not exists idx_jal_sede   on public.jaladores(sede_id);

-- ingresos_jaladores
create table if not exists public.ingresos_jaladores (
  id         uuid primary key default gen_random_uuid(),
  jalador_id uuid not null references public.jaladores(id) on delete cascade,
  fecha      date not null default current_date,
  monto      numeric(10,2) not null check (monto >= 0),
  nota       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ij_jalador on public.ingresos_jaladores(jalador_id);
create index if not exists idx_ij_fecha   on public.ingresos_jaladores(fecha);

-- accesos_temporales
create table if not exists public.accesos_temporales (
  id           uuid primary key default gen_random_uuid(),
  worker_id    uuid not null references public.profiles(id) on delete cascade,
  rol_otorgado rol_usuario not null,
  rol_original rol_usuario not null,
  motivo       text default '',
  desde        timestamptz not null default now(),
  hasta        timestamptz not null,
  creado_por   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_at_worker on public.accesos_temporales(worker_id);
create index if not exists idx_at_hasta  on public.accesos_temporales(hasta);

-- movimientos_caja (line items por sede)
create table if not exists public.movimientos_caja (
  id             uuid primary key default gen_random_uuid(),
  sede_id        uuid not null references public.sedes(id) on delete cascade,
  fecha          date not null,
  tipo           tipo_movimiento not null,
  monto          numeric(12,2) not null check (monto >= 0),
  cantidad       numeric(10,2),
  unitario       numeric(12,2),
  categoria      categoria_fijo,
  concepto       text not null default '',
  registrado_por uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_mc_sede  on public.movimientos_caja(sede_id);
create index if not exists idx_mc_fecha on public.movimientos_caja(fecha);
create index if not exists idx_mc_tipo  on public.movimientos_caja(tipo);

-- ajustes (singleton id=1)
create table if not exists public.ajustes (
  id                         int primary key default 1,
  mostrar_feriados_oficiales boolean not null default true,
  updated_at                 timestamptz not null default now(),
  constraint ajustes_singleton check (id = 1)
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;

-- cuadres_personales (sandbox del trabajador, RLS estricta solo dueño)
create table if not exists public.cuadres_personales (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid not null references public.profiles(id) on delete cascade,
  fecha      date not null,
  worked     boolean not null default false,
  late       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, fecha)
);
create index if not exists idx_cp_worker on public.cuadres_personales(worker_id);

-- pagos_planilla
create table if not exists public.pagos_planilla (
  id             uuid primary key default gen_random_uuid(),
  worker_id      uuid not null references public.profiles(id) on delete cascade,
  desde_iso      date not null,
  hasta_iso      date not null,
  fecha_pago     date not null default current_date,
  monto_neto     numeric(12,2) not null check (monto_neto >= 0),
  metodo_pago    metodo_pago not null,
  periodo        periodo_pago,
  nota           text,
  registrado_por uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_pp_worker on public.pagos_planilla(worker_id);
create index if not exists idx_pp_fecha  on public.pagos_planilla(fecha_pago);

-- ================================================================
-- TRIGGERS updated_at en todas las tablas con esa columna
-- ================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'sedes','profiles','asistencia','adelantos','permisos',
    'eventos','jaladores','accesos_temporales','movimientos_caja',
    'ajustes','cuadres_personales','pagos_planilla'
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

-- ================================================================
-- AUTO-CREACION de profile al registrar usuario en auth.users
-- ================================================================
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

-- ================================================================
-- HELPERS RLS (rol y sede del usuario actual)
-- ================================================================
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

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table public.sedes               enable row level security;
alter table public.profiles            enable row level security;
alter table public.asistencia          enable row level security;
alter table public.adelantos           enable row level security;
alter table public.permisos            enable row level security;
alter table public.eventos             enable row level security;
alter table public.jaladores           enable row level security;
alter table public.ingresos_jaladores  enable row level security;
alter table public.accesos_temporales  enable row level security;
alter table public.movimientos_caja    enable row level security;
alter table public.ajustes             enable row level security;
alter table public.cuadres_personales  enable row level security;
alter table public.pagos_planilla      enable row level security;

-- ====== SEDES ======
drop policy if exists sedes_read  on public.sedes;
drop policy if exists sedes_write on public.sedes;
create policy sedes_read  on public.sedes for select using (auth.uid() is not null);
create policy sedes_write on public.sedes for all
  using (public.is_owner()) with check (public.is_owner());

-- ====== PROFILES ======
drop policy if exists profiles_self        on public.profiles;
drop policy if exists profiles_read_team   on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_owner_all   on public.profiles;
create policy profiles_self        on public.profiles for select using (id = auth.uid());
create policy profiles_read_team   on public.profiles for select using (
  public.is_owner()
  or (public.is_encargado() and sede_id = public.current_sede())
);
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_owner_all   on public.profiles for all
  using (public.is_owner()) with check (public.is_owner());

-- ====== ASISTENCIA ======
drop policy if exists asist_self      on public.asistencia;
drop policy if exists asist_team_read on public.asistencia;
drop policy if exists asist_admin     on public.asistencia;
create policy asist_self      on public.asistencia for all
  using (worker_id = auth.uid()) with check (worker_id = auth.uid());
-- Encargado ve workers de su sede O registros con sede_id_dia = su sede (multi-sede por dia)
create policy asist_team_read on public.asistencia for select using (
  public.is_owner()
  or (public.is_encargado() and (
        sede_id_dia = public.current_sede()
        or exists (select 1 from public.profiles p
                    where p.id = asistencia.worker_id and p.sede_id = public.current_sede())))
);
create policy asist_admin     on public.asistencia for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

-- ====== ADELANTOS ======
drop policy if exists adel_self        on public.adelantos;
drop policy if exists adel_self_insert on public.adelantos;
drop policy if exists adel_admin       on public.adelantos;
create policy adel_self        on public.adelantos for select using (worker_id = auth.uid());
create policy adel_self_insert on public.adelantos for insert with check (worker_id = auth.uid());
create policy adel_admin       on public.adelantos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

-- ====== PERMISOS ======
drop policy if exists perm_self        on public.permisos;
drop policy if exists perm_self_insert on public.permisos;
drop policy if exists perm_admin       on public.permisos;
create policy perm_self        on public.permisos for select using (worker_id = auth.uid());
create policy perm_self_insert on public.permisos for insert with check (worker_id = auth.uid());
create policy perm_admin       on public.permisos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

-- ====== EVENTOS ======
drop policy if exists ev_read  on public.eventos;
drop policy if exists ev_write on public.eventos;
create policy ev_read  on public.eventos for select using (auth.uid() is not null);
create policy ev_write on public.eventos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

-- ====== JALADORES + INGRESOS ======
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

-- ====== ACCESOS TEMPORALES ======
drop policy if exists at_read  on public.accesos_temporales;
drop policy if exists at_write on public.accesos_temporales;
create policy at_read  on public.accesos_temporales for select using (
  public.is_owner() or public.is_encargado() or worker_id = auth.uid()
);
create policy at_write on public.accesos_temporales for all
  using (public.is_owner()) with check (public.is_owner());

-- ====== MOVIMIENTOS DE CAJA ======
-- Owner: todo. Encargado: solo movimientos de SU sede. Trabajador: nada.
drop policy if exists mc_owner_all  on public.movimientos_caja;
drop policy if exists mc_enc_read   on public.movimientos_caja;
drop policy if exists mc_enc_insert on public.movimientos_caja;
drop policy if exists mc_enc_update on public.movimientos_caja;
drop policy if exists mc_enc_delete on public.movimientos_caja;
create policy mc_owner_all on public.movimientos_caja for all
  using (public.is_owner()) with check (public.is_owner());
create policy mc_enc_read on public.movimientos_caja for select
  using (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_insert on public.movimientos_caja for insert
  with check (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_update on public.movimientos_caja for update
  using (public.is_encargado() and sede_id = public.current_sede())
  with check (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_delete on public.movimientos_caja for delete
  using (public.is_encargado() and sede_id = public.current_sede());

-- ====== AJUSTES (solo owner edita; todos leen) ======
drop policy if exists aj_read  on public.ajustes;
drop policy if exists aj_write on public.ajustes;
create policy aj_read  on public.ajustes for select using (auth.uid() is not null);
create policy aj_write on public.ajustes for all
  using (public.is_owner()) with check (public.is_owner());

-- ====== CUADRES PERSONALES (sandbox: solo el propio worker, NI siquiera owner lee) ======
drop policy if exists cp_self on public.cuadres_personales;
create policy cp_self on public.cuadres_personales for all
  using (worker_id = auth.uid()) with check (worker_id = auth.uid());

-- ====== PAGOS PLANILLA ======
drop policy if exists pp_self      on public.pagos_planilla;
drop policy if exists pp_team_read on public.pagos_planilla;
drop policy if exists pp_admin     on public.pagos_planilla;
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

-- ================================================================
-- STORAGE: bucket avatars (opcional — alternativa a profiles.avatar_base64)
-- Si prefieres mantener todo como base64 en profiles, omite esta seccion.
-- ================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read"   on storage.objects;
drop policy if exists "avatars_upload" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_read"   on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_upload" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.role() = 'authenticated'
);
create policy "avatars_update" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);
create policy "avatars_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);

-- ================================================================
-- pg_cron: caducidad de accesos temporales (cada minuto)
-- ================================================================
create or replace function public.expirar_accesos_temporales()
returns void language plpgsql security definer as $$
begin
  -- Restaurar rol_original a workers cuyo acceso vencio
  update public.profiles p
     set rol          = at.rol_original,
         rol_original = null
    from public.accesos_temporales at
   where at.worker_id = p.id
     and at.hasta    <= now();

  -- Eliminar accesos vencidos
  delete from public.accesos_temporales where hasta <= now();
end $$;

-- Cancelar job previo (idempotencia) y reprogramar cada minuto
do $$ begin
  perform cron.unschedule('tramys_expirar_accesos');
exception when others then null; end $$;

select cron.schedule(
  'tramys_expirar_accesos',
  '* * * * *',
  $$ select public.expirar_accesos_temporales(); $$
);

-- ================================================================
-- REALTIME: habilitar en Dashboard → Database → Replication
-- Tablas a habilitar para Realtime (TODAS las que la app consume):
--   sedes, profiles, asistencia, adelantos, permisos, eventos,
--   jaladores, ingresos_jaladores, accesos_temporales, movimientos_caja,
--   ajustes, cuadres_personales, pagos_planilla
-- ================================================================

-- ================================================================
-- POST-INSTALACION (manual, una sola vez)
-- 1) Registrar el primer usuario por Supabase Auth (Authentication → Users → Invite).
-- 2) Promoverlo a owner:
--      update public.profiles set rol = 'owner' where id = '<UUID-DEL-USER>';
-- 3) Crear sedes desde la UI (la app no incluye seed).
-- ================================================================

select 'Schema TRAMYS creado exitosamente' as resultado;
