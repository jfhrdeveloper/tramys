/* ================= MAPPERS Supabase ↔ TS ================= */
/* Convierte filas de Supabase (snake_case) a las shapes que */
/* el resto de la app usa (camelCase). Mantener uno por entidad. */

import type {
  Sede, Worker, AsistenciaRec, Adelanto, Permiso, Evento,
  Jalador, IngresoJalador, AccesoTemporal, MovimientoCaja,
  Rol, EstadoAsist, EstadoAdel, EstadoPerm, TipoPerm, TipoEvento,
  TipoMovimiento, CategoriaFijo, TarifasWorker,
} from "@/components/providers/DataProvider";

/* ====== Sedes ====== */
export function rowToSede(r: Record<string, unknown>): Sede {
  return {
    id:          String(r.id),
    nombre:      String(r.nombre ?? ""),
    color:       String(r.color ?? "#C41A3A"),
    direccion:   String(r.direccion ?? ""),
    telefono:    String(r.telefono ?? ""),
    horario:     String(r.horario ?? ""),
    encargadoId: r.encargado_id ? String(r.encargado_id) : undefined,
    activa:      Boolean(r.activa ?? true),
  };
}
export function sedeToRow(s: Partial<Sede>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (s.nombre      !== undefined) out.nombre       = s.nombre;
  if (s.color       !== undefined) out.color        = s.color;
  if (s.direccion   !== undefined) out.direccion    = s.direccion;
  if (s.telefono    !== undefined) out.telefono     = s.telefono;
  if (s.horario     !== undefined) out.horario      = s.horario;
  if (s.encargadoId !== undefined) out.encargado_id = s.encargadoId ?? null;
  if (s.activa      !== undefined) out.activa       = s.activa;
  return out;
}

/* ====== Movimientos de caja ====== */
export function rowToMovimientoCaja(r: Record<string, unknown>): MovimientoCaja {
  return {
    id:           String(r.id),
    sedeId:       String(r.sede_id),
    fecha:        String(r.fecha),
    tipo:         (r.tipo as TipoMovimiento) ?? "ingreso",
    monto:        Number(r.monto ?? 0),
    cantidad:     r.cantidad != null ? Number(r.cantidad) : undefined,
    unitario:     r.unitario != null ? Number(r.unitario) : undefined,
    categoria:    r.categoria ? (r.categoria as CategoriaFijo) : undefined,
    concepto:     String(r.concepto ?? ""),
    registradoPor: r.registrado_por ? String(r.registrado_por) : undefined,
    createdAt:    String(r.created_at ?? new Date().toISOString()),
  };
}
export function movimientoCajaToRow(m: Partial<MovimientoCaja>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (m.sedeId        !== undefined) out.sede_id        = m.sedeId;
  if (m.fecha         !== undefined) out.fecha          = m.fecha;
  if (m.tipo          !== undefined) out.tipo           = m.tipo;
  if (m.monto         !== undefined) out.monto          = m.monto;
  if (m.cantidad      !== undefined) out.cantidad       = m.cantidad ?? null;
  if (m.unitario      !== undefined) out.unitario       = m.unitario ?? null;
  if (m.categoria     !== undefined) out.categoria      = m.categoria ?? null;
  if (m.concepto      !== undefined) out.concepto       = m.concepto;
  if (m.registradoPor !== undefined) out.registrado_por = m.registradoPor ?? null;
  return out;
}

/* ====== Profiles ↔ Worker ====== */
export function rowToWorker(r: Record<string, unknown>): Worker {
  const tarifas: TarifasWorker = {
    diaNormal: Number(r.tarifa_normal   ?? 0),
    tardanza:  Number(r.tarifa_tardanza ?? 0),
    finSemana: Number(r.tarifa_finsem   ?? 0),
    feriado:   Number(r.tarifa_feriado  ?? 0),
  };
  return {
    id:           String(r.id),
    nombre:       String(r.nombre ?? ""),
    apodo:        String(r.apodo  ?? ""),
    avatarBase64: (r.avatar_base64 as string | null) ?? null,
    rol:          (r.rol as Rol) ?? "trabajador",
    sedeId:       r.sede_id ? String(r.sede_id) : "",
    cargo:        String(r.cargo ?? ""),
    turno:        { entrada: String(r.turno_entrada ?? "08:00"), salida: String(r.turno_salida ?? "18:00") },
    tarifas,
    fechaIngreso: String(r.fecha_ingreso ?? new Date().toISOString().slice(0, 10)),
    activo:       Boolean(r.activo ?? true),
    email:        String(r.email ?? ""),
    dni:          (r.dni      as string | undefined) ?? undefined,
    telefono:     (r.telefono as string | undefined) ?? undefined,
  };
}
export function workerToRow(w: Partial<Worker>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (w.nombre       !== undefined) out.nombre         = w.nombre;
  if (w.apodo        !== undefined) out.apodo          = w.apodo;
  if (w.avatarBase64 !== undefined) out.avatar_base64  = w.avatarBase64;
  if (w.rol          !== undefined) out.rol            = w.rol;
  if (w.sedeId       !== undefined) out.sede_id        = w.sedeId || null;
  if (w.cargo        !== undefined) out.cargo          = w.cargo;
  if (w.turno?.entrada !== undefined) out.turno_entrada = w.turno.entrada;
  if (w.turno?.salida  !== undefined) out.turno_salida  = w.turno.salida;
  if (w.tarifas) {
    out.tarifa_normal   = w.tarifas.diaNormal;
    out.tarifa_tardanza = w.tarifas.tardanza;
    out.tarifa_finsem   = w.tarifas.finSemana;
    out.tarifa_feriado  = w.tarifas.feriado;
  }
  if (w.fechaIngreso !== undefined) out.fecha_ingreso = w.fechaIngreso;
  if (w.activo       !== undefined) out.activo        = w.activo;
  if (w.email        !== undefined) out.email         = w.email;
  if (w.dni          !== undefined) out.dni           = w.dni ?? null;
  if (w.telefono     !== undefined) out.telefono      = w.telefono ?? null;
  return out;
}

/* ====== Asistencia ====== */
export function rowToAsistencia(r: Record<string, unknown>): AsistenciaRec {
  return {
    id:              String(r.id),
    workerId:        String(r.worker_id),
    fecha:           String(r.fecha),
    entrada:         (r.entrada as string | null) ?? null,
    salida:          (r.salida  as string | null) ?? null,
    estado:          (r.estado as EstadoAsist) ?? "presente",
    overrideIngreso: r.override_ingreso == null ? null : Number(r.override_ingreso),
    motivoEdit:      (r.motivo_edit as string | undefined) ?? undefined,
    sedeIdDia:       (r.sede_id_dia   as string | undefined) ?? undefined,
    turnoEntrada:    (r.turno_entrada as string | undefined) ?? undefined,
    turnoSalida:     (r.turno_salida  as string | undefined) ?? undefined,
  };
}
export function asistenciaToRow(a: Partial<AsistenciaRec>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (a.workerId        !== undefined) out.worker_id        = a.workerId;
  if (a.fecha           !== undefined) out.fecha            = a.fecha;
  if (a.entrada         !== undefined) out.entrada          = a.entrada;
  if (a.salida          !== undefined) out.salida           = a.salida;
  if (a.estado          !== undefined) out.estado           = a.estado;
  if (a.overrideIngreso !== undefined) out.override_ingreso = a.overrideIngreso;
  if (a.motivoEdit      !== undefined) out.motivo_edit      = a.motivoEdit;
  if (a.sedeIdDia       !== undefined) out.sede_id_dia      = a.sedeIdDia ?? null;
  if (a.turnoEntrada    !== undefined) out.turno_entrada    = a.turnoEntrada ?? null;
  if (a.turnoSalida     !== undefined) out.turno_salida     = a.turnoSalida ?? null;
  return out;
}

/* ====== Adelantos ====== */
export function rowToAdelanto(r: Record<string, unknown>): Adelanto {
  return {
    id:           String(r.id),
    workerId:     String(r.worker_id),
    monto:        Number(r.monto ?? 0),
    motivo:       String(r.motivo ?? ""),
    estado:       (r.estado as EstadoAdel) ?? "pendiente",
    fecha:        String(r.fecha),
    aprobadoPor:  (r.aprobado_por as string | null) ?? null,
    nota:         (r.nota as string | undefined) ?? undefined,
  };
}
export function adelantoToRow(a: Partial<Adelanto>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (a.workerId    !== undefined) out.worker_id    = a.workerId;
  if (a.monto       !== undefined) out.monto        = a.monto;
  if (a.motivo      !== undefined) out.motivo       = a.motivo;
  if (a.estado      !== undefined) out.estado       = a.estado;
  if (a.fecha       !== undefined) out.fecha        = a.fecha;
  if (a.aprobadoPor !== undefined) out.aprobado_por = a.aprobadoPor;
  return out;
}

/* ====== Permisos ====== */
export function rowToPermiso(r: Record<string, unknown>): Permiso {
  return {
    id:          String(r.id),
    workerId:    String(r.worker_id),
    fecha:       String(r.desde ?? r.fecha ?? new Date().toISOString().slice(0, 10)),
    tipo:        (r.tipo as TipoPerm) ?? "personal",
    motivo:      String(r.motivo ?? ""),
    estado:      (r.estado as EstadoPerm) ?? "pendiente",
    aprobadoPor: (r.aprobado_por as string | null) ?? null,
  };
}
export function permisoToRow(p: Partial<Permiso>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.workerId    !== undefined) out.worker_id    = p.workerId;
  if (p.tipo        !== undefined) out.tipo         = p.tipo;
  if (p.motivo      !== undefined) out.motivo       = p.motivo;
  if (p.estado      !== undefined) out.estado       = p.estado;
  if (p.fecha       !== undefined) { out.desde = p.fecha; out.hasta = p.fecha; }
  if (p.aprobadoPor !== undefined) out.aprobado_por = p.aprobadoPor;
  return out;
}

/* ====== Eventos ====== */
export function rowToEvento(r: Record<string, unknown>): Evento {
  return {
    id:          String(r.id),
    nombre:      String(r.nombre ?? ""),
    date:        String(r.fecha),
    tipo:        (r.tipo as TipoEvento) ?? "otro",
    workerId:    (r.worker_id as string | undefined) ?? undefined,
    descripcion: (r.descripcion as string | undefined) ?? undefined,
  };
}
export function eventoToRow(e: Partial<Evento>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.nombre      !== undefined) out.nombre      = e.nombre;
  if (e.date        !== undefined) out.fecha       = e.date;
  if (e.tipo        !== undefined) out.tipo        = e.tipo;
  if (e.workerId    !== undefined) out.worker_id   = e.workerId ?? null;
  if (e.descripcion !== undefined) out.descripcion = e.descripcion ?? "";
  return out;
}

/* ====== Jaladores ====== */
export function rowToJalador(r: Record<string, unknown>): Jalador {
  return {
    id:                 String(r.id),
    nombre:             String(r.nombre ?? ""),
    apodo:              String(r.apodo ?? ""),
    avatarBase64:       (r.avatar_base64 as string | null) ?? null,
    sedeId:             r.sede_id ? String(r.sede_id) : "",
    porcentajeComision: Number(r.porcentaje_comision ?? 10),
    activo:             Boolean(r.activo ?? true),
    fechaIngreso:       String(r.fecha_ingreso ?? new Date().toISOString().slice(0, 10)),
  };
}
export function jaladorToRow(j: Partial<Jalador>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (j.nombre             !== undefined) out.nombre              = j.nombre;
  if (j.apodo              !== undefined) out.apodo               = j.apodo;
  if (j.avatarBase64       !== undefined) out.avatar_base64       = j.avatarBase64;
  if (j.sedeId             !== undefined) out.sede_id             = j.sedeId || null;
  if (j.porcentajeComision !== undefined) out.porcentaje_comision = j.porcentajeComision;
  if (j.activo             !== undefined) out.activo              = j.activo;
  if (j.fechaIngreso       !== undefined) out.fecha_ingreso       = j.fechaIngreso;
  return out;
}

/* ====== Ingresos jaladores ====== */
export function rowToIngreso(r: Record<string, unknown>): IngresoJalador {
  return {
    id:         String(r.id),
    jaladorId:  String(r.jalador_id),
    fecha:      String(r.fecha),
    monto:      Number(r.monto ?? 0),
    nota:       (r.nota as string | undefined) ?? undefined,
  };
}
export function ingresoToRow(i: Partial<IngresoJalador>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (i.jaladorId !== undefined) out.jalador_id = i.jaladorId;
  if (i.fecha     !== undefined) out.fecha      = i.fecha;
  if (i.monto     !== undefined) out.monto      = i.monto;
  if (i.nota      !== undefined) out.nota       = i.nota ?? "";
  return out;
}

/* ====== Accesos temporales ====== */
export function rowToAccesoTemp(r: Record<string, unknown>): AccesoTemporal {
  return {
    id:           String(r.id),
    workerId:     String(r.worker_id),
    rolOtorgado:  (r.rol_otorgado as Rol) ?? "trabajador",
    rolOriginal:  (r.rol_original as Rol | undefined) ?? undefined,
    otorgadoPor:  String(r.creado_por ?? ""),
    desde:        String(r.desde),
    hasta:        String(r.hasta),
    motivo:       String(r.motivo ?? ""),
  };
}
export function accesoTempToRow(a: Partial<AccesoTemporal>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (a.workerId    !== undefined) out.worker_id    = a.workerId;
  if (a.rolOtorgado !== undefined) out.rol_otorgado = a.rolOtorgado;
  if (a.rolOriginal !== undefined) out.rol_original = a.rolOriginal;
  if (a.otorgadoPor !== undefined) out.creado_por   = a.otorgadoPor || null;
  if (a.desde       !== undefined) out.desde        = a.desde;
  if (a.hasta       !== undefined) out.hasta        = a.hasta;
  if (a.motivo      !== undefined) out.motivo       = a.motivo ?? "";
  return out;
}
