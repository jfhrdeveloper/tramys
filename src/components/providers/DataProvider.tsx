"use client";

/* ================= DATA PROVIDER ================= */
/* Store global compartido entre admin/encargado/trabajador. */
/* Persistencia en localStorage. Fuente única de verdad.       */

import { createContext, useContext, useEffect, useState, useCallback } from "react";

/* ================= TIPOS ================= */
export type EstadoAsist = "presente" | "tardanza" | "ausente" | "permiso" | "feriado";
export type EstadoAdel  = "pendiente" | "aprobado" | "rechazado";
export type EstadoPerm  = "pendiente" | "aprobado" | "rechazado";
export type TipoPerm    = "personal" | "medico" | "vacaciones";
export type TipoEvento  = "cumpleanos" | "feriado-nacional" | "feriado-empresa" | "otro";
export type Rol         = "owner" | "encargado" | "trabajador";

export interface Sede {
  id: string;
  nombre: string;
  color: string;
  direccion: string;
  telefono: string;
  horario: string;
  encargadoId?: string;
  activa: boolean;
  /* Caja por periodo (ingresos totales, sueldos totales, material) */
  cajaDia:     { ingresos: number; material: number };
  cajaSemana:  { ingresos: number; material: number };
  cajaMes:     { ingresos: number; material: number };
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
  fecha: string;
  tipo: TipoPerm;
  motivo: string;
  estado: EstadoPerm;
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
  mostrarFeriadosOficiales: boolean;
}

/* ================= SEMILLA POR DEFECTO ================= */
function seed(): DataState {
  const YEAR = new Date().getFullYear();

  const sedes: Sede[] = [
    { id:"sa", nombre:"Santa Anita",  color:"#C41A3A", direccion:"Av. Los Chancas 456", telefono:"01 234-5678", horario:"08:00–18:00", encargadoId:"w_rp",  activa:true,
      cajaDia:{ ingresos: 1850, material: 240 }, cajaSemana:{ ingresos: 11200, material: 1450 }, cajaMes:{ ingresos: 48600, material: 6200 } },
    { id:"pp", nombre:"Puente Piedra", color:"#1d6fa4", direccion:"Jr. Comercio 123",    telefono:"01 876-5432", horario:"08:00–18:00", encargadoId:undefined, activa:true,
      cajaDia:{ ingresos: 1210, material: 180 }, cajaSemana:{ ingresos: 7600, material: 1020 },  cajaMes:{ ingresos: 33400, material: 4300 } },
    { id:"li", nombre:"Lima Centro",   color:"#16a34a", direccion:"Jr. de la Unión 800", telefono:"01 555-0100", horario:"08:00–18:00", encargadoId:undefined, activa:true,
      cajaDia:{ ingresos: 920,  material: 150 }, cajaSemana:{ ingresos: 5800, material: 820 },   cajaMes:{ ingresos: 24800, material: 3100 } },
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

  return {
    sedes, workers, asistencia, adelantos, permisos,
    eventos, jaladores, ingresosJaladores,
    accesosTemporales: [],
    mostrarFeriadosOficiales: true,
  };
}

/* ================= CONTEXT ================= */
interface DataCtx extends DataState {
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
  addAccesoTemp:    (a: Omit<AccesoTemporal, "id">) => void;
  removeAccesoTemp: (id: string) => void;
  /* Reset */
  resetAll: () => void;
}

const Ctx = createContext<DataCtx | null>(null);

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
    setState(s => ({ ...s, permisos: s.permisos.map(x => x.id === id ? { ...x, ...patch } : x) }));
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

  const addAccesoTemp = useCallback((a: Omit<AccesoTemporal, "id">) => {
    setState(s => ({ ...s, accesosTemporales: [...s.accesosTemporales, { ...a, id:`at_${Date.now().toString(36)}` }] }));
  }, []);
  const removeAccesoTemp = useCallback((id: string) => {
    setState(s => ({ ...s, accesosTemporales: s.accesosTemporales.filter(x => x.id !== id) }));
  }, []);

  const resetAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState(seed());
  }, []);

  return (
    <Ctx.Provider value={{
      ...state,
      updateSede,
      addWorker, updateWorker, deleteWorker,
      setAsistencia, getAsistencia,
      addAdelanto, updateAdelanto,
      addPermiso, updatePermiso,
      addEvento, updateEvento, deleteEvento, toggleFeriadosOficiales,
      addJalador, updateJalador, deleteJalador,
      addIngreso, updateIngreso, deleteIngreso,
      addAccesoTemp, removeAccesoTemp,
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
