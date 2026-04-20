/* ================= TIPOS GLOBALES TRAMYS ================= */

/* ====== Enums ====== */
export type Rol          = "owner" | "encargado" | "trabajador";
export type EstadoAsist  = "presente" | "tardanza" | "ausente" | "permiso" | "feriado";
export type EstadoAdel   = "pendiente" | "aprobado" | "rechazado";
export type EstadoPerm   = "pendiente" | "aprobado" | "rechazado";
export type EstadoPlan   = "pendiente" | "pagado";
export type TipoFeriado  = "nacional" | "empresa";
export type TipoPerm     = "personal" | "medico" | "vacaciones";

/* ====== Base de datos ====== */
export interface Sede {
  id:            string;
  nombre:        string;
  direccion:     string;
  telefono:      string;
  hora_apertura: string;
  hora_cierre:   string;
  activo:        boolean;
}

export interface Profile {
  id:           string;
  nombre:       string;
  avatar_url:   string | null;
  rol:          Rol;
  sede_id:      string | null;
  cargo:        string | null;
  turno:        string | null;
  sueldo:       number;
  fecha_ingreso:string | null;
  activo:       boolean;
  sede?:        Sede;
}

export interface Asistencia {
  id:              string;
  trabajador_id:   string;
  sede_id:         string;
  fecha:           string;
  hora_entrada:    string | null;
  hora_salida:     string | null;
  estado:          EstadoAsist;
  foto_evidencia:  string | null;
  editado_por:     string | null;
  motivo_edicion:  string | null;
  created_at:      string;
  trabajador?:     Profile;
}

export interface Jalador {
  id:            string;
  nombre:        string;
  sede_id:       string;
  meta_mensual:  number;
  comision_unit: number;
  activo:        boolean;
  sede?:         Sede;
}

export interface Captacion {
  id:          string;
  jalador_id:  string;
  sede_id:     string;
  fecha:       string;
  cantidad:    number;
  monto:       number;
  zona:        string | null;
  created_at:  string;
}

export interface Planilla {
  id:              string;
  trabajador_id:   string;
  mes:             number;
  anio:            number;
  sueldo_base:     number;
  dias_trabajados: number;
  desc_tardanzas:  number;
  adelantos:       number;
  neto:            number;
  estado:          EstadoPlan;
  cerrada_por:     string | null;
  created_at:      string;
  trabajador?:     Profile;
}

export interface Adelanto {
  id:            string;
  trabajador_id: string;
  monto:         number;
  motivo:        string;
  estado:        EstadoAdel;
  aprobado_por:  string | null;
  nota:          string | null;
  created_at:    string;
  trabajador?:   Profile;
  aprobador?:    Profile;
}

export interface Permiso {
  id:            string;
  trabajador_id: string;
  fecha:         string;
  tipo:          TipoPerm;
  motivo:        string;
  estado:        EstadoPerm;
  aprobado_por:  string | null;
  created_at:    string;
  trabajador?:   Profile;
}

export interface Feriado {
  id:        string;
  nombre:    string;
  fecha:     string;
  tipo:      TipoFeriado;
  es_pagado: boolean;
}

export interface AuditLog {
  id:              string;
  accion:          string;
  tabla:           string;
  registro_id:     string | null;
  valor_anterior:  Record<string, unknown> | null;
  valor_nuevo:     Record<string, unknown> | null;
  realizado_por:   string;
  created_at:      string;
  autor?:          Profile;
}

/* ====== UI helpers ====== */
export interface NavItem {
  id:     string;
  label:  string;
  href:   string;
  badge?: number;
}
