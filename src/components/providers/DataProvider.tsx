"use client";

/* ================= DATA PROVIDER ================= */
/* Store global compartido entre admin/encargado/trabajador. */
/* Persistencia en localStorage. Fuente única de verdad.       */

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { esFeriadoOficial as _esFerOf } from "@/lib/utils/peruHolidays";

/* ================= TIPOS ================= */
export type EstadoAsist = "presente" | "tardanza" | "ausente" | "permiso" | "feriado";
export type EstadoAdel  = "pendiente" | "aprobado" | "rechazado";
export type EstadoPerm  = "pendiente" | "aprobado" | "rechazado";
export type TipoPerm    = "personal" | "medico" | "vacaciones";
export type TipoEvento  = "cumpleanos" | "feriado-nacional" | "feriado-empresa" | "otro";
export type Rol         = "owner" | "encargado" | "trabajador";

/* ====== Movimientos de caja por sede ======
   Line items con fecha. Los agregados (diario/semanal/mensual) se calculan
   filtrando por rango con `agregadoCaja(...)`. */
export type TipoMovimiento  = "ingreso" | "gasto-personal" | "gasto-fijo" | "gasto-manual";
export type CategoriaFijo   = "luz" | "agua" | "internet" | "local" | "otro";

export interface MovimientoCaja {
  id: string;
  sedeId: string;
  fecha: string;                     // ISO yyyy-mm-dd
  tipo: TipoMovimiento;
  monto: number;                     // siempre positivo (el signo lo da `tipo`)
  /* Para `ingreso`: descomposición opcional cantidad × unitario = monto. */
  cantidad?: number;
  unitario?: number;
  /* Para `gasto-fijo`: subcategoría del consumo. */
  categoria?: CategoriaFijo;
  concepto: string;                  // descripción libre
  registradoPor?: string;            // workerId
  createdAt: string;                 // ISO datetime
}

export interface Sede {
  id: string;
  nombre: string;
  color: string;
  direccion: string;
  telefono: string;
  horario: string;
  encargadoId?: string;
  activa: boolean;
}

export interface Turno {
  entrada: string;  // "08:00"
  salida:  string;  // "18:00"
}

export interface TarifasWorker {
  diaNormal: number;
  tardanza:  number;
  finSemana: number;
  feriado:   number;
}

export interface Worker {
  id: string;
  nombre: string;
  apodo: string;
  avatarBase64: string | null;       // foto 1:1 cuadrada en base64
  rol: Rol;
  sedeId: string;
  cargo: string;
  turno: Turno;
  tarifas: TarifasWorker;
  fechaIngreso: string;              // ISO yyyy-mm-dd
  activo: boolean;
  email: string;
  dni?: string;
  telefono?: string;
}

export interface AsistenciaRec {
  id: string;
  workerId: string;
  fecha: string;                     // ISO yyyy-mm-dd
  entrada: string | null;
  salida: string | null;
  estado: EstadoAsist;
  /* Override manual de ingreso del día; si null, se calcula por tarifas */
  overrideIngreso: number | null;
  motivoEdit?: string;
  /* ===== Multi-sede por día (opcional, fallback a worker.sedeId/turno) ===== */
  sedeIdDia?:    string;             // sede donde marcó ese día específico
  turnoEntrada?: string;             // horario esperado entrada del día (override)
  turnoSalida?:  string;             // horario esperado salida del día (override)
}

export interface Adelanto {
  id: string;
  workerId: string;
  monto: number;
  motivo: string;
  estado: EstadoAdel;
  fecha: string;
  aprobadoPor?: string | null;
  nota?: string;
}

export interface Permiso {
  id: string;
  workerId: string;
  fecha: string;             // = desde (compat. legacy: día único). Para rangos, usar desde/hasta.
  desde?: string;            // ISO yyyy-mm-dd. Si no se envía, equivale a fecha.
  hasta?: string;            // ISO yyyy-mm-dd. Si no se envía, equivale a desde/fecha.
  tipo: TipoPerm;
  motivo: string;
  estado: EstadoPerm;
  pagado?: boolean;          // ¿se descuenta o se paga? Default false (no se paga).
  aprobadoPor?: string | null;
}

export interface Evento {
  id: string;
  nombre: string;
  date: string;                      // ISO yyyy-mm-dd
  tipo: TipoEvento;
  /* cumpleanos */
  workerId?: string;
  /* feriado */
  pagado?: boolean;
  descripcion?: string;
}

export interface Jalador {
  id: string;
  nombre: string;
  apodo: string;
  avatarBase64: string | null;
  sedeId: string;
  porcentajeComision: number;        // % sobre ingresos
  activo: boolean;
  fechaIngreso: string;
}

export interface IngresoJalador {
  id: string;
  jaladorId: string;
  fecha: string;                     // ISO yyyy-mm-dd
  monto: number;
  nota?: string;
}

export interface AccesoTemporal {
  id: string;
  workerId: string;
  rolOtorgado: Rol;
  rolOriginal?: Rol;                 // se guarda al crear; se restaura al expirar/revocar
  otorgadoPor: string;
  desde: string;                     // ISO datetime
  hasta: string;                     // ISO datetime
  motivo: string;
}

/* ================= ESTADO RAÍZ ================= */
export interface DataState {
  sedes: Sede[];
  workers: Worker[];
  asistencia: AsistenciaRec[];
  adelantos: Adelanto[];
  permisos: Permiso[];
  eventos: Evento[];
  jaladores: Jalador[];
  ingresosJaladores: IngresoJalador[];
  accesosTemporales: AccesoTemporal[];
  movimientosCaja: MovimientoCaja[];
  mostrarFeriadosOficiales: boolean;
}

/* ================= SEMILLA POR DEFECTO ================= */
function seed(): DataState {
  const YEAR = new Date().getFullYear();

  const sedes: Sede[] = [
    { id:"sa", nombre:"Santa Anita",  color:"#C41A3A", direccion:"Av. Los Chancas 456", telefono:"01 234-5678", horario:"08:00–18:00", encargadoId:"w_rp",  activa:true },
    { id:"pp", nombre:"Puente Piedra", color:"#1d6fa4", direccion:"Jr. Comercio 123",    telefono:"01 876-5432", horario:"08:00–18:00", encargadoId:undefined, activa:true },
    { id:"li", nombre:"Lima Centro",   color:"#16a34a", direccion:"Jr. de la Unión 800", telefono:"01 555-0100", horario:"08:00–18:00", encargadoId:undefined, activa:true },
  ];

  const TARIFAS_DEF: TarifasWorker = { diaNormal: 60, tardanza: 45, finSemana: 75, feriado: 90 };

  const workers: Worker[] = [
    { id:"w_du",  nombre:"Dueña del Negocio", apodo:"Owner",   avatarBase64:null, rol:"owner",     sedeId:"sa", cargo:"Propietaria", turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2020-01-01", activo:true, email:"owner@tramys.pe" },
    { id:"w_rp",  nombre:"Ricardo Palma",      apodo:"Ricky",   avatarBase64:null, rol:"encargado", sedeId:"sa", cargo:"Encargado",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2021-06-15", activo:true, email:"rpalma@tramys.pe" },
    { id:"w_at",  nombre:"Ana Torres",         apodo:"Ani",     avatarBase64:null, rol:"trabajador",sedeId:"sa", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2023-03-01", activo:true, email:"atorres@tramys.pe" },
    { id:"w_lv",  nombre:"Luis Vera",          apodo:"Lucho",   avatarBase64:null, rol:"trabajador",sedeId:"sa", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2022-06-01", activo:true, email:"lvera@tramys.pe" },
    { id:"w_md",  nombre:"Marco Díaz",         apodo:"Marco",   avatarBase64:null, rol:"trabajador",sedeId:"pp", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2024-01-01", activo:true, email:"mdiaz@tramys.pe" },
    { id:"w_sr",  nombre:"Sofía Ríos",         apodo:"Sofi",    avatarBase64:null, rol:"trabajador",sedeId:"sa", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2023-09-01", activo:true, email:"srios@tramys.pe" },
    { id:"w_cf",  nombre:"Carmen Flores",      apodo:"Carmen",  avatarBase64:null, rol:"trabajador",sedeId:"pp", cargo:"Operadora",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2022-02-01", activo:true, email:"cflores@tramys.pe" },
    { id:"w_pc",  nombre:"Pedro Chávez",       apodo:"Pedro",   avatarBase64:null, rol:"trabajador",sedeId:"sa", cargo:"Operador",    turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2023-11-01", activo:false, email:"pchavez@tramys.pe" },
    { id:"w_rh",  nombre:"Rosa Huanca",        apodo:"Rosi",    avatarBase64:null, rol:"trabajador",sedeId:"pp", cargo:"Operadora",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2021-04-01", activo:true, email:"rhuanca@tramys.pe" },
    { id:"w_jq",  nombre:"Jorge Quispe",       apodo:"Jorge",   avatarBase64:null, rol:"trabajador",sedeId:"pp", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2023-07-01", activo:true, email:"jquispe@tramys.pe" },
    { id:"w_ms",  nombre:"María Soto",         apodo:"Mary",    avatarBase64:null, rol:"trabajador",sedeId:"li", cargo:"Operadora",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2024-02-01", activo:true, email:"msoto@tramys.pe" },
    { id:"w_cr",  nombre:"Carlos Ramos",       apodo:"Carlitos",avatarBase64:null, rol:"trabajador",sedeId:"li", cargo:"Asistente",   turno:{ entrada:"08:00", salida:"18:00" }, tarifas: TARIFAS_DEF, fechaIngreso:"2023-08-15", activo:true, email:"cramos@tramys.pe" },
  ];

  /* Asistencia últimas 3 semanas para trabajadores activos */
  const asistencia: AsistenciaRec[] = [];
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const SEED: EstadoAsist[] = ["presente","presente","presente","tardanza","presente","presente","ausente"];
  for (const w of workers) {
    if (!w.activo) continue;
    if (w.rol === "owner") continue;
    for (let i = 21; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(hoy.getDate()-i);
      const est = SEED[(i + w.id.length) % SEED.length];
      const entrada = est === "ausente" ? null : est === "tardanza" ? "09:05" : "08:00";
      const salida  = est === "ausente" ? null : "18:00";
      asistencia.push({
        id: `a_${w.id}_${d.toISOString().slice(0,10)}`,
        workerId: w.id,
        fecha: d.toISOString().slice(0,10),
        entrada, salida, estado: est,
        overrideIngreso: null,
      });
    }
  }

  const adelantos: Adelanto[] = [
    { id:"ad1", workerId:"w_md", monto:350, motivo:"Emergencia familiar", estado:"pendiente", fecha: new Date().toISOString().slice(0,10) },
    { id:"ad2", workerId:"w_cf", monto:200, motivo:"Pago de alquiler",    estado:"pendiente", fecha: new Date().toISOString().slice(0,10) },
    { id:"ad3", workerId:"w_sr", monto:150, motivo:"Útiles escolares",    estado:"pendiente", fecha: new Date().toISOString().slice(0,10) },
    { id:"ad4", workerId:"w_at", monto:300, motivo:"Gastos médicos",      estado:"aprobado",  fecha: "2026-04-10", aprobadoPor:"w_du" },
  ];

  const permisos: Permiso[] = [
    { id:"p1", workerId:"w_sr", fecha:"2026-04-18", tipo:"personal", motivo:"Trámite familiar", estado:"aprobado", aprobadoPor:"w_du" },
  ];

  const eventos: Evento[] = [
    { id:"ev1", nombre:"Ana Torres",    date:`${YEAR}-04-19`, tipo:"cumpleanos",       workerId:"w_at" },
    { id:"ev2", nombre:"Marco Díaz",    date:`${YEAR}-05-03`, tipo:"cumpleanos",       workerId:"w_md" },
    { id:"ev3", nombre:"Luis Vera",     date:`${YEAR}-06-22`, tipo:"cumpleanos",       workerId:"w_lv" },
    { id:"ev4", nombre:"Día de la Madre", date:`${YEAR}-05-10`, tipo:"feriado-empresa",  pagado:false },
  ];

  const jaladores: Jalador[] = [
    { id:"j1", nombre:"Miguel Torres",  apodo:"Miguelón", avatarBase64:null, sedeId:"pp", porcentajeComision:10, activo:true, fechaIngreso:"2023-01-01" },
    { id:"j2", nombre:"Carlos Mendoza", apodo:"Mendo",    avatarBase64:null, sedeId:"sa", porcentajeComision:10, activo:true, fechaIngreso:"2023-03-01" },
    { id:"j3", nombre:"Luis Ramos",     apodo:"Luigi",    avatarBase64:null, sedeId:"sa", porcentajeComision:10, activo:true, fechaIngreso:"2024-01-01" },
    { id:"j4", nombre:"Jhon Paredes",   apodo:"Jhon",     avatarBase64:null, sedeId:"pp", porcentajeComision:10, activo:true, fechaIngreso:"2024-05-01" },
    { id:"j5", nombre:"Roberto Asto",   apodo:"Robert",   avatarBase64:null, sedeId:"li", porcentajeComision:10, activo:true, fechaIngreso:"2024-08-01" },
  ];

  const ingresosJaladores: IngresoJalador[] = [];
  for (const j of jaladores) {
    for (let i = 14; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(hoy.getDate()-i);
      const monto = Math.round((100 + Math.random()*400) / 10) * 10;
      if (Math.random() > 0.2) {
        ingresosJaladores.push({
          id:`ij_${j.id}_${d.toISOString().slice(0,10)}`,
          jaladorId: j.id,
          fecha: d.toISOString().slice(0,10),
          monto,
        });
      }
    }
  }

  /* ====== Semilla de movimientos de caja ====== */
  const movimientosCaja: MovimientoCaja[] = [];
  const SEDE_PERFIL: Record<string, { ingDia: number; clientesDia: number; luz: number; agua: number; internet: number; local: number }> = {
    sa: { ingDia: 1850, clientesDia: 30, luz: 320, agua: 90,  internet: 150, local: 1800 },
    pp: { ingDia: 1210, clientesDia: 22, luz: 240, agua: 75,  internet: 130, local: 1400 },
    li: { ingDia: 920,  clientesDia: 18, luz: 200, agua: 60,  internet: 130, local: 1100 },
  };
  for (const s of sedes) {
    const perfil = SEDE_PERFIL[s.id];
    if (!perfil) continue;
    /* Ingresos diarios de las últimas 4 semanas (con variación) */
    for (let i = 27; i >= 0; i--) {
      const d = new Date(hoy); d.setDate(hoy.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dow = d.getDay();
      const factor = dow === 0 || dow === 6 ? 1.25 : 1;
      const ruido = 0.85 + Math.random() * 0.3;
      const cant = Math.max(1, Math.round(perfil.clientesDia * factor * ruido));
      const unit = Math.round(perfil.ingDia / perfil.clientesDia);
      const monto = cant * unit;
      movimientosCaja.push({
        id: `mc_${s.id}_in_${iso}`,
        sedeId: s.id, fecha: iso, tipo: "ingreso",
        monto, cantidad: cant, unitario: unit,
        concepto: "Ventas del día",
        createdAt: d.toISOString(),
      });
    }
    /* Consumos fijos: uno por mes (luz/agua/internet/local) — día 5 del mes actual y anterior */
    for (let mOff = 1; mOff >= 0; mOff--) {
      const base = new Date(hoy.getFullYear(), hoy.getMonth() - mOff, 5);
      if (base > hoy) continue;
      const isoBase = base.toISOString().slice(0, 10);
      const items: { cat: CategoriaFijo; concepto: string; monto: number }[] = [
        { cat: "luz",      concepto: "Recibo de luz",      monto: perfil.luz },
        { cat: "agua",     concepto: "Recibo de agua",     monto: perfil.agua },
        { cat: "internet", concepto: "Internet del local", monto: perfil.internet },
        { cat: "local",    concepto: "Alquiler de local",  monto: perfil.local },
      ];
      for (const it of items) {
        movimientosCaja.push({
          id: `mc_${s.id}_${it.cat}_${isoBase}`,
          sedeId: s.id, fecha: isoBase, tipo: "gasto-fijo",
          monto: it.monto, categoria: it.cat,
          concepto: it.concepto,
          createdAt: base.toISOString(),
        });
      }
    }
  }

  return {
    sedes, workers, asistencia, adelantos, permisos,
    eventos, jaladores, ingresosJaladores,
    accesosTemporales: [],
    movimientosCaja,
    mostrarFeriadosOficiales: true,
  };
}

/* ================= CONTEXT ================= */
interface DataCtx extends DataState {
  /* Estado de hidratación (false hasta leer localStorage) */
  ready: boolean;
  /* Sedes */
  updateSede:  (id: string, patch: Partial<Sede>) => void;
  /* Workers */
  addWorker:    (w: Omit<Worker, "id">) => Worker;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  /* Asistencia */
  setAsistencia: (workerId: string, fechaISO: string, patch: Partial<AsistenciaRec>) => void;
  getAsistencia: (workerId: string, fechaISO: string) => AsistenciaRec | undefined;
  /* Adelantos */
  addAdelanto:    (a: Omit<Adelanto, "id" | "estado">) => void;
  updateAdelanto: (id: string, patch: Partial<Adelanto>) => void;
  /* Permisos */
  addPermiso:    (p: Omit<Permiso, "id" | "estado">) => void;
  updatePermiso: (id: string, patch: Partial<Permiso>) => void;
  /* Eventos */
  addEvento:    (e: Omit<Evento, "id">) => void;
  updateEvento: (id: string, patch: Partial<Evento>) => void;
  deleteEvento: (id: string) => void;
  toggleFeriadosOficiales: (v: boolean) => void;
  /* Jaladores */
  addJalador:       (j: Omit<Jalador, "id">) => void;
  updateJalador:    (id: string, patch: Partial<Jalador>) => void;
  deleteJalador:    (id: string) => void;
  /* Ingresos jaladores */
  addIngreso:    (i: Omit<IngresoJalador, "id">) => void;
  updateIngreso: (id: string, patch: Partial<IngresoJalador>) => void;
  deleteIngreso: (id: string) => void;
  /* Accesos temporales */
  addAccesoTemp:    (a: Omit<AccesoTemporal, "id" | "rolOriginal">) => void;
  removeAccesoTemp: (id: string) => void;
  /* Movimientos de caja */
  addMovimientoCaja:    (m: Omit<MovimientoCaja, "id" | "createdAt">) => void;
  updateMovimientoCaja: (id: string, patch: Partial<MovimientoCaja>) => void;
  deleteMovimientoCaja: (id: string) => void;
  /* Reset */
  resetAll: () => void;
}

/* Context compartido — exportado para que un provider alternativo (Supabase) pueda inyectarlo */
const Ctx = createContext<DataCtx | null>(null);
export const DataContext = Ctx;
/* Tipo expuesto para implementaciones alternativas */
export type DataCtxValue = DataCtx;

const STORAGE_KEY = "tramys_data_v1";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DataState;
        /* Merge conservador: si falla cualquier sección caemos a seed */
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  const updateSede = useCallback((id: string, patch: Partial<Sede>) => {
    setState(s => ({ ...s, sedes: s.sedes.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);

  const addWorker = useCallback((w: Omit<Worker, "id">): Worker => {
    const id = `w_${Date.now().toString(36)}`;
    const nuevo: Worker = { ...w, id };
    setState(s => ({ ...s, workers: [...s.workers, nuevo] }));
    return nuevo;
  }, []);

  const updateWorker = useCallback((id: string, patch: Partial<Worker>) => {
    setState(s => ({ ...s, workers: s.workers.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setState(s => ({ ...s, workers: s.workers.filter(x => x.id !== id) }));
  }, []);

  const setAsistencia = useCallback((workerId: string, fechaISO: string, patch: Partial<AsistenciaRec>) => {
    setState(s => {
      const idx = s.asistencia.findIndex(a => a.workerId === workerId && a.fecha === fechaISO);
      if (idx >= 0) {
        const copia = [...s.asistencia];
        copia[idx] = { ...copia[idx], ...patch };
        return { ...s, asistencia: copia };
      }
      return {
        ...s,
        asistencia: [
          ...s.asistencia,
          {
            id: `a_${workerId}_${fechaISO}`,
            workerId, fecha: fechaISO,
            entrada: null, salida: null,
            estado: "presente", overrideIngreso: null,
            ...patch,
          },
        ],
      };
    });
  }, []);

  const getAsistencia = useCallback((workerId: string, fechaISO: string) =>
    state.asistencia.find(a => a.workerId === workerId && a.fecha === fechaISO),
  [state.asistencia]);

  const addAdelanto = useCallback((a: Omit<Adelanto, "id" | "estado">) => {
    setState(s => ({ ...s, adelantos: [...s.adelantos, { ...a, id:`ad_${Date.now().toString(36)}`, estado:"pendiente" }] }));
  }, []);
  const updateAdelanto = useCallback((id: string, patch: Partial<Adelanto>) => {
    setState(s => ({ ...s, adelantos: s.adelantos.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);

  const addPermiso = useCallback((p: Omit<Permiso, "id" | "estado">) => {
    setState(s => ({ ...s, permisos: [...s.permisos, { ...p, id:`p_${Date.now().toString(36)}`, estado:"pendiente" }] }));
  }, []);
  const updatePermiso = useCallback((id: string, patch: Partial<Permiso>) => {
    setState(s => {
      const permActualizado = s.permisos.find(x => x.id === id);
      if (!permActualizado) return s;
      const nuevo: Permiso = { ...permActualizado, ...patch };

      let asistencia = s.asistencia;
      /* Si pasa a "aprobado" → marcar todos los días del rango como permiso */
      if (patch.estado === "aprobado") {
        const w = s.workers.find(x => x.id === nuevo.workerId);
        if (w) {
          const dias = diasDePermiso(nuevo);
          for (const iso of dias) {
            const idx = asistencia.findIndex(a => a.workerId === w.id && a.fecha === iso);
            const tarifa = nuevo.pagado
              ? (esFeriadoOficialFn(iso) ? w.tarifas.feriado
                  : isWeekendISO(iso) ? w.tarifas.finSemana
                  : w.tarifas.diaNormal)
              : null;
            const tipoLabel = nuevo.tipo === "vacaciones" ? "Vacaciones"
                            : nuevo.tipo === "medico"     ? "Permiso médico"
                            :                                "Permiso personal";
            const motivoEdit = nuevo.pagado ? `${tipoLabel} (pagado)` : tipoLabel;
            const base = {
              workerId: w.id, fecha: iso,
              entrada: null as string | null, salida: null as string | null,
              estado: "permiso" as EstadoAsist,
              overrideIngreso: tarifa,
              motivoEdit,
            };
            if (idx >= 0) asistencia = asistencia.map((a, i) => i === idx ? { ...a, ...base } : a);
            else asistencia = [...asistencia, { ...base, id: `as_${Date.now().toString(36)}_${iso}` }];
          }
        }
      }
      return {
        ...s,
        permisos: s.permisos.map(x => x.id === id ? nuevo : x),
        asistencia,
      };
    });
  }, []);

  const addEvento = useCallback((e: Omit<Evento, "id">) => {
    setState(s => ({ ...s, eventos: [...s.eventos, { ...e, id:`ev_${Date.now().toString(36)}` }] }));
  }, []);
  const updateEvento = useCallback((id: string, patch: Partial<Evento>) => {
    setState(s => ({ ...s, eventos: s.eventos.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);
  const deleteEvento = useCallback((id: string) => {
    setState(s => ({ ...s, eventos: s.eventos.filter(x => x.id !== id) }));
  }, []);
  const toggleFeriadosOficiales = useCallback((v: boolean) => {
    setState(s => ({ ...s, mostrarFeriadosOficiales: v }));
  }, []);

  const addJalador = useCallback((j: Omit<Jalador, "id">) => {
    setState(s => ({ ...s, jaladores: [...s.jaladores, { ...j, id:`j_${Date.now().toString(36)}` }] }));
  }, []);
  const updateJalador = useCallback((id: string, patch: Partial<Jalador>) => {
    setState(s => ({ ...s, jaladores: s.jaladores.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);
  const deleteJalador = useCallback((id: string) => {
    setState(s => ({ ...s, jaladores: s.jaladores.filter(x => x.id !== id) }));
  }, []);

  const addIngreso = useCallback((i: Omit<IngresoJalador, "id">) => {
    setState(s => ({ ...s, ingresosJaladores: [...s.ingresosJaladores, { ...i, id:`ij_${Date.now().toString(36)}` }] }));
  }, []);
  const updateIngreso = useCallback((id: string, patch: Partial<IngresoJalador>) => {
    setState(s => ({ ...s, ingresosJaladores: s.ingresosJaladores.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);
  const deleteIngreso = useCallback((id: string) => {
    setState(s => ({ ...s, ingresosJaladores: s.ingresosJaladores.filter(x => x.id !== id) }));
  }, []);

  /* Concede acceso temporal y aplica el rol otorgado al worker */
  const addAccesoTemp = useCallback((a: Omit<AccesoTemporal, "id" | "rolOriginal">) => {
    setState(s => {
      const w = s.workers.find(x => x.id === a.workerId);
      const rolOriginal = w?.rol ?? "trabajador";
      const nuevoAcceso: AccesoTemporal = {
        ...a,
        id: `at_${Date.now().toString(36)}`,
        rolOriginal,
      };
      const workers = w
        ? s.workers.map(x => x.id === w.id ? { ...x, rol: a.rolOtorgado } : x)
        : s.workers;
      return { ...s, accesosTemporales: [...s.accesosTemporales, nuevoAcceso], workers };
    });
  }, []);

  /* Revoca el acceso. Si seguía activo, restaura el rol original. */
  const removeAccesoTemp = useCallback((id: string) => {
    setState(s => {
      const acceso = s.accesosTemporales.find(x => x.id === id);
      if (!acceso) return s;
      const ahora = Date.now();
      const activo = new Date(acceso.hasta).getTime() > ahora;
      const workers = activo && acceso.rolOriginal
        ? s.workers.map(x => x.id === acceso.workerId ? { ...x, rol: acceso.rolOriginal! } : x)
        : s.workers;
      return {
        ...s,
        accesosTemporales: s.accesosTemporales.filter(x => x.id !== id),
        workers,
      };
    });
  }, []);

  /* Caducidad automática: cada 30s, expirados restauran el rol y se eliminan */
  useEffect(() => {
    if (!hydrated) return;
    function tick() {
      setState(s => {
        const ahora = Date.now();
        const expirados = s.accesosTemporales.filter(x => new Date(x.hasta).getTime() <= ahora);
        if (expirados.length === 0) return s;
        let workers = s.workers;
        for (const e of expirados) {
          if (!e.rolOriginal) continue;
          workers = workers.map(w => w.id === e.workerId ? { ...w, rol: e.rolOriginal! } : w);
        }
        return {
          ...s,
          accesosTemporales: s.accesosTemporales.filter(x => new Date(x.hasta).getTime() > ahora),
          workers,
        };
      });
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  const addMovimientoCaja = useCallback((m: Omit<MovimientoCaja, "id" | "createdAt">) => {
    setState(s => ({
      ...s,
      movimientosCaja: [...s.movimientosCaja, {
        ...m,
        id: `mc_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      }],
    }));
  }, []);
  const updateMovimientoCaja = useCallback((id: string, patch: Partial<MovimientoCaja>) => {
    setState(s => ({ ...s, movimientosCaja: s.movimientosCaja.map(x => x.id === id ? { ...x, ...patch } : x) }));
  }, []);
  const deleteMovimientoCaja = useCallback((id: string) => {
    setState(s => ({ ...s, movimientosCaja: s.movimientosCaja.filter(x => x.id !== id) }));
  }, []);

  const resetAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState(seed());
  }, []);

  return (
    <Ctx.Provider value={{
      ...state,
      ready: hydrated,
      updateSede,
      addWorker, updateWorker, deleteWorker,
      setAsistencia, getAsistencia,
      addAdelanto, updateAdelanto,
      addPermiso, updatePermiso,
      addEvento, updateEvento, deleteEvento, toggleFeriadosOficiales,
      addJalador, updateJalador, deleteJalador,
      addIngreso, updateIngreso, deleteIngreso,
      addAccesoTemp, removeAccesoTemp,
      addMovimientoCaja, updateMovimientoCaja, deleteMovimientoCaja,
      resetAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData debe usarse dentro de <DataProvider>");
  return v;
}

/* ================= HELPERS DERIVADOS ================= */
export function ingresoDia(rec: AsistenciaRec, tarifas: TarifasWorker, esFinDeSemana: boolean, esFeriado: boolean): number {
  if (rec.overrideIngreso !== null) return rec.overrideIngreso;
  if (rec.estado === "ausente") return 0;
  if (rec.estado === "permiso") return 0;
  if (rec.estado === "feriado") return tarifas.feriado;
  if (esFeriado)    return tarifas.feriado;
  if (esFinDeSemana) return tarifas.finSemana;
  if (rec.estado === "tardanza") return tarifas.tardanza;
  return tarifas.diaNormal;
}

export function isoToday(): string {
  return new Date().toISOString().slice(0,10);
}

export function dayOfWeekISO(iso: string): number {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y, m-1, d).getDay();
}

export function isWeekendISO(iso: string): boolean {
  const d = dayOfWeekISO(iso);
  return d === 0 || d === 6;
}

/* ====== Permisos / vacaciones: helpers ====== */
/* Devuelve los días ISO cubiertos por un permiso (rango desde-hasta o un solo día). */
export function diasDePermiso(p: Permiso): string[] {
  const desde = p.desde ?? p.fecha;
  const hasta = p.hasta ?? p.desde ?? p.fecha;
  if (!desde) return [];
  const out: string[] = [];
  const [y0, m0, d0] = desde.split("-").map(Number);
  const [y1, m1, d1] = hasta.split("-").map(Number);
  const dini = new Date(y0, m0 - 1, d0);
  const dfin = new Date(y1, m1 - 1, d1);
  for (let cur = new Date(dini); cur <= dfin; cur.setDate(cur.getDate() + 1)) {
    out.push(cur.toISOString().slice(0, 10));
  }
  return out;
}

/* Wrapper local: evita repetir el `.es` y mantiene el import arriba. */
function esFeriadoOficialFn(iso: string): boolean {
  return _esFerOf(iso).es;
}

/* ====== Multi-sede por día: derivados ====== */
/* Sede efectiva del día: override del registro o sede de planta del worker. */
export function sedeDelDia(rec: AsistenciaRec | undefined, w: Worker): string {
  return rec?.sedeIdDia ?? w.sedeId;
}
/* Horario esperado del día: override del registro o turno habitual. */
export function turnoDelDia(rec: AsistenciaRec | undefined, w: Worker): Turno {
  return {
    entrada: rec?.turnoEntrada ?? w.turno.entrada,
    salida:  rec?.turnoSalida  ?? w.turno.salida,
  };
}

/* ====== Caja: agregados desde MovimientoCaja ====== */
export interface AgregadoCaja {
  ingresos:       number;  // Σ ingreso
  gastoPersonal:  number;  // Σ gasto-personal (manuales). Los sueldos de planilla se suman aparte.
  gastoFijo:      number;  // Σ gasto-fijo (luz/agua/internet/local/otro)
  gastoManual:    number;  // Σ gasto-manual
  movimientos:    MovimientoCaja[]; // movimientos del rango (orden cronológico desc.)
}
export function movimientosEnRango(state: Pick<DataState, "movimientosCaja">, sedeId: string, desdeISO: string, hastaISO: string): MovimientoCaja[] {
  return state.movimientosCaja
    .filter(m => m.sedeId === sedeId && m.fecha >= desdeISO && m.fecha <= hastaISO)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.createdAt.localeCompare(a.createdAt));
}
export function agregadoCaja(state: Pick<DataState, "movimientosCaja">, sedeId: string, desdeISO: string, hastaISO: string): AgregadoCaja {
  const movimientos = movimientosEnRango(state, sedeId, desdeISO, hastaISO);
  let ingresos = 0, gastoPersonal = 0, gastoFijo = 0, gastoManual = 0;
  for (const m of movimientos) {
    if      (m.tipo === "ingreso")        ingresos      += m.monto;
    else if (m.tipo === "gasto-personal") gastoPersonal += m.monto;
    else if (m.tipo === "gasto-fijo")     gastoFijo     += m.monto;
    else if (m.tipo === "gasto-manual")   gastoManual   += m.monto;
  }
  return { ingresos, gastoPersonal, gastoFijo, gastoManual, movimientos };
}

/* ====== Ingresos de jaladores por sede en un rango ======
   Cruza `ingresosJaladores` con `jaladores` para filtrar por la sede del jalador.
   Se considera parte de las ganancias del cuadre de caja (no es un MovimientoCaja). */
export function ingresosJaladoresEnRango(
  state: Pick<DataState, "ingresosJaladores" | "jaladores">,
  sedeId: string,
  desdeISO: string,
  hastaISO: string
): { total: number; items: IngresoJalador[] } {
  const idsSede = new Set(state.jaladores.filter(j => j.sedeId === sedeId).map(j => j.id));
  const items = state.ingresosJaladores.filter(
    ij => idsSede.has(ij.jaladorId) && ij.fecha >= desdeISO && ij.fecha <= hastaISO
  );
  const total = items.reduce((acc, ij) => acc + ij.monto, 0);
  return { total, items };
}

/* ====== Derivados automáticos del cuadre de caja por sede ======
   Costos del personal que NO viven en `movimientos_caja` (sueldos de planilla
   y comisiones de jaladores). Se derivan del estado y se inyectan en los
   paneles de caja como filas/contadores AUTO.

   - sueldos: Σ ingresoDia(rec, tarifas, weekend, feriado) para asistencias
              cuya sede del día (override o planta) sea la actual y dentro
              del rango.
   - comisiones: Σ ingresoJalador × (porcentajeComision/100) para jaladores
              con `sedeId === sede.id`.

   Reusado por `PanelCaja` (`/caja`) y `CajaBlock` (`/sedes`) para mantener
   coherencia: ambos paneles ven el mismo total de gastos del periodo. */
export interface DerivadosCaja {
  sueldos:    number;
  comisiones: number;
  total:      number;
}
export function derivadosCaja(
  state: Pick<DataState, "asistencia" | "workers" | "jaladores" | "ingresosJaladores">,
  sedeId: string,
  desdeISO: string,
  hastaISO: string,
  esFeriadoFn: (iso: string) => boolean,
): DerivadosCaja {
  let sueldos = 0;
  for (const a of state.asistencia) {
    if (a.fecha < desdeISO || a.fecha > hastaISO) continue;
    const w = state.workers.find(x => x.id === a.workerId);
    if (!w) continue;
    if (sedeDelDia(a, w) !== sedeId) continue;
    sueldos += ingresoDia(a, w.tarifas, isWeekendISO(a.fecha), esFeriadoFn(a.fecha));
  }
  let comisiones = 0;
  for (const j of state.jaladores) {
    if (j.sedeId !== sedeId) continue;
    const sumaJ = state.ingresosJaladores
      .filter(ij => ij.jaladorId === j.id && ij.fecha >= desdeISO && ij.fecha <= hastaISO)
      .reduce((acc, ij) => acc + ij.monto, 0);
    comisiones += sumaJ * (j.porcentajeComision / 100);
  }
  return { sueldos, comisiones, total: sueldos + comisiones };
}
