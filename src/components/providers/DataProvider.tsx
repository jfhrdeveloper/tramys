"use client";

/* ================= DATA PROVIDER ================= */
/* Store global compartido entre admin/encargado/trabajador.    */
/* Backend unico: Supabase + Realtime. Toda la UI consume       */
/* useData() y los helpers exportados sin saber que es Supabase.*/

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { esFeriadoOficial as _esFerOf } from "@/lib/utils/peruHolidays";
import {
  rowToSede, sedeToRow,
  rowToWorker, workerToRow,
  rowToAsistencia, asistenciaToRow,
  rowToAdelanto, adelantoToRow,
  rowToPermiso, permisoToRow,
  rowToEvento, eventoToRow,
  rowToJalador, jaladorToRow,
  rowToIngreso, ingresoToRow,
  rowToAccesoTemp, accesoTempToRow,
  rowToMovimientoCaja, movimientoCajaToRow,
  rowToCuadrePersonal, cuadrePersonalToRow,
  rowToPagoPlanilla, pagoPlanillaToRow,
} from "@/lib/data/mappers";

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
  /* ===== Verificación laxa (Opción B) =====
     - marcadoPor: quién registró este día (trabajador desde su modal, o
       owner/encargado desde el panel admin). Si null → registro de semilla.
     - verificadoPor: id del actor admin que dio el ack. null = pendiente.
     - verificadoAt: timestamp del ack. */
  marcadoPor?:    "trabajador" | "owner" | "encargado";
  verificadoPor?: string | null;
  verificadoAt?:  string;
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

/* Método con que se efectuó el pago — para auditoría del trabajador. */
export type MetodoPago = "efectivo" | "yape" | "transferencia";

/* Anotación personal del trabajador (sandbox). NO afecta la asistencia oficial.
   El trabajador la usa para llevar su propio control y compararla con el registro
   oficial que mantiene el owner/encargado. Solo el dueño la lee/escribe. */
export interface CuadrePersonal {
  id: string;
  workerId: string;
  fecha: string;       // ISO yyyy-mm-dd
  worked: boolean;
  late: boolean;
}

/* Registro de pago de planilla. Un PagoPlanilla cubre el rango [desdeISO, hastaISO]
   de un trabajador. La presencia del registro es la verdad: si existe, ese rango
   ya fue pagado. La página de planilla y el calendario de asistencia leen esto
   para mostrar el estado real de pagos. */
export interface PagoPlanilla {
  id: string;
  workerId: string;
  desdeISO: string;
  hastaISO: string;
  fechaPago: string;          // ISO yyyy-mm-dd (cuándo se efectuó el pago)
  montoNeto: number;
  metodoPago: MetodoPago;
  periodo?: "quincenal" | "mensual";
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
  pagosPlanilla: PagoPlanilla[];
  cuadresPersonales: CuadrePersonal[];
  mostrarFeriadosOficiales: boolean;
}

/* ================= CONTEXT ================= */
interface DataCtx extends DataState {
  /* Estado de hidratación (false hasta primer fetch a Supabase) */
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
  /* Pagos de planilla */
  addPagoPlanilla:    (p: Omit<PagoPlanilla, "id">) => void;
  deletePagoPlanilla: (id: string) => void;
  /* Cuadres personales (sandbox del trabajador) */
  setCuadrePersonal: (workerId: string, fechaISO: string, patch: Partial<Pick<CuadrePersonal, "worked"|"late">>) => void;
  getCuadrePersonal: (workerId: string, fechaISO: string) => CuadrePersonal | undefined;
  clearCuadrePersonal: (workerId: string, fechaISO: string) => void;
  /* Verificación de asistencia (Opción B) */
  verificarAsistencia: (recId: string, verificadoPor: string) => void;
  desverificarAsistencia: (recId: string) => void;
  /* Reset (no-op en Supabase: el wipe se hace desde SQL Editor) */
  resetAll: () => void;
}

/* Context exportado por si algún componente quiere consumirlo crudo. */
const Ctx = createContext<DataCtx | null>(null);
export const DataContext = Ctx;
export type DataCtxValue = DataCtx;

const EMPTY_STATE: DataState = {
  sedes: [], workers: [], asistencia: [], adelantos: [], permisos: [],
  eventos: [], jaladores: [], ingresosJaladores: [], accesosTemporales: [],
  movimientosCaja: [], pagosPlanilla: [], cuadresPersonales: [],
  mostrarFeriadosOficiales: true,
};

/* ================= PROVIDER (Supabase) ================= */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current;
  const [state, setState] = useState<DataState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  /* ====== Carga inicial: TODAS las tablas en paralelo ====== */
  const cargar = useCallback(async () => {
    const [
      sedes, profiles, asist, adel, perm, ev, jal, ij, at, mc, ajustes, cp, pp,
    ] = await Promise.all([
      supabase.from("sedes").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("asistencia").select("*"),
      supabase.from("adelantos").select("*"),
      supabase.from("permisos").select("*"),
      supabase.from("eventos").select("*"),
      supabase.from("jaladores").select("*"),
      supabase.from("ingresos_jaladores").select("*"),
      supabase.from("accesos_temporales").select("*"),
      supabase.from("movimientos_caja").select("*"),
      supabase.from("ajustes").select("*").eq("id", 1).maybeSingle(),
      supabase.from("cuadres_personales").select("*"),
      supabase.from("pagos_planilla").select("*"),
    ]);

    setState({
      sedes:             (sedes.data    ?? []).map(rowToSede),
      workers:           (profiles.data ?? []).map(rowToWorker),
      asistencia:        (asist.data    ?? []).map(rowToAsistencia),
      adelantos:         (adel.data     ?? []).map(rowToAdelanto),
      permisos:          (perm.data     ?? []).map(rowToPermiso),
      eventos:           (ev.data       ?? []).map(rowToEvento),
      jaladores:         (jal.data      ?? []).map(rowToJalador),
      ingresosJaladores: (ij.data       ?? []).map(rowToIngreso),
      accesosTemporales: (at.data       ?? []).map(rowToAccesoTemp),
      movimientosCaja:   (mc.data       ?? []).map(rowToMovimientoCaja),
      pagosPlanilla:     (pp.data       ?? []).map(rowToPagoPlanilla),
      cuadresPersonales: (cp.data       ?? []).map(rowToCuadrePersonal),
      mostrarFeriadosOficiales: ajustes.data?.mostrar_feriados_oficiales ?? true,
    });
    setReady(true);
  }, [supabase]);

  useEffect(() => { void cargar(); }, [cargar]);

  /* ====== Realtime: cualquier cambio en public.* re-fetchea todo ====== */
  useEffect(() => {
    const channel = supabase
      .channel("tramys_realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, () => { void cargar(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, cargar]);

  /* =============== ACCIONES =============== */

  /* ====== Sedes ====== */
  const updateSede = useCallback(async (id: string, patch: Partial<Sede>) => {
    await supabase.from("sedes").update(sedeToRow(patch)).eq("id", id);
  }, [supabase]);

  /* ====== Workers (profiles) ======
     Crear un worker requiere primero invitarlo en Supabase Auth — el trigger
     `on_auth_user_created` crea automáticamente la fila en `profiles`. Luego el
     admin completa el patch desde la UI. Aquí devolvemos un placeholder local
     para que la firma siga igual; el realtime traerá el worker real. */
  const addWorker = useCallback((w: Omit<Worker, "id">): Worker => {
    const fake: Worker = { ...w, id: `pending_${Date.now().toString(36)}` };
    void supabase.from("profiles").insert(workerToRow(w));
    return fake;
  }, [supabase]);
  const updateWorker = useCallback(async (id: string, patch: Partial<Worker>) => {
    await supabase.from("profiles").update(workerToRow(patch)).eq("id", id);
  }, [supabase]);
  const deleteWorker = useCallback(async (id: string) => {
    await supabase.from("profiles").delete().eq("id", id);
  }, [supabase]);

  /* ====== Asistencia (upsert por unique constraint worker_id+fecha) ====== */
  const setAsistencia = useCallback(async (workerId: string, fechaISO: string, patch: Partial<AsistenciaRec>) => {
    await supabase.from("asistencia").upsert(
      asistenciaToRow({ ...patch, workerId, fecha: fechaISO }),
      { onConflict: "worker_id,fecha" }
    );
  }, [supabase]);
  const getAsistencia = useCallback((workerId: string, fechaISO: string) =>
    state.asistencia.find(a => a.workerId === workerId && a.fecha === fechaISO),
  [state.asistencia]);

  /* ====== Adelantos ====== */
  const addAdelanto = useCallback(async (a: Omit<Adelanto, "id" | "estado">) => {
    await supabase.from("adelantos").insert({ ...adelantoToRow(a as Partial<Adelanto>), estado: "pendiente" });
  }, [supabase]);
  const updateAdelanto = useCallback(async (id: string, patch: Partial<Adelanto>) => {
    await supabase.from("adelantos").update(adelantoToRow(patch)).eq("id", id);
  }, [supabase]);

  /* ====== Permisos ======
     Al APROBAR un permiso, marcamos los días del rango en asistencia con
     estado "permiso", calculando el override de ingreso según pagado/feriado/
     fin-de-semana. Replica la regla del dominio (mismo comportamiento que la
     versión demo previa). Las marcas de asistencia son upserts en paralelo. */
  const addPermiso = useCallback(async (p: Omit<Permiso, "id" | "estado">) => {
    await supabase.from("permisos").insert({ ...permisoToRow(p as Partial<Permiso>), estado: "pendiente" });
  }, [supabase]);
  const updatePermiso = useCallback(async (id: string, patch: Partial<Permiso>) => {
    await supabase.from("permisos").update(permisoToRow(patch)).eq("id", id);

    if (patch.estado !== "aprobado") return;
    /* Releer el permiso desde el state local: el patch puede ser parcial. */
    const prev = state.permisos.find(p => p.id === id);
    if (!prev) return;
    const nuevo: Permiso = { ...prev, ...patch };
    const w = state.workers.find(x => x.id === nuevo.workerId);
    if (!w) return;
    const dias = diasDePermiso(nuevo);
    const tipoLabel = nuevo.tipo === "vacaciones" ? "Vacaciones"
                    : nuevo.tipo === "medico"     ? "Permiso médico"
                    :                                "Permiso personal";
    const motivoEdit = nuevo.pagado ? `${tipoLabel} (pagado)` : tipoLabel;

    await Promise.all(dias.map(iso => {
      const tarifa = nuevo.pagado
        ? (esFeriadoOficialFn(iso) ? w.tarifas.feriado
            : isWeekendISO(iso)     ? w.tarifas.finSemana
            : w.tarifas.diaNormal)
        : null;
      return supabase.from("asistencia").upsert(asistenciaToRow({
        workerId: w.id, fecha: iso,
        entrada: null, salida: null,
        estado: "permiso",
        overrideIngreso: tarifa,
        motivoEdit,
      }), { onConflict: "worker_id,fecha" });
    }));
  }, [supabase, state.permisos, state.workers]);

  /* ====== Eventos ====== */
  const addEvento = useCallback(async (e: Omit<Evento, "id">) => {
    await supabase.from("eventos").insert(eventoToRow(e as Partial<Evento>));
  }, [supabase]);
  const updateEvento = useCallback(async (id: string, patch: Partial<Evento>) => {
    await supabase.from("eventos").update(eventoToRow(patch)).eq("id", id);
  }, [supabase]);
  const deleteEvento = useCallback(async (id: string) => {
    await supabase.from("eventos").delete().eq("id", id);
  }, [supabase]);
  const toggleFeriadosOficiales = useCallback(async (v: boolean) => {
    await supabase.from("ajustes").update({ mostrar_feriados_oficiales: v }).eq("id", 1);
  }, [supabase]);

  /* ====== Jaladores + ingresos ====== */
  const addJalador = useCallback(async (j: Omit<Jalador, "id">) => {
    await supabase.from("jaladores").insert(jaladorToRow(j as Partial<Jalador>));
  }, [supabase]);
  const updateJalador = useCallback(async (id: string, patch: Partial<Jalador>) => {
    await supabase.from("jaladores").update(jaladorToRow(patch)).eq("id", id);
  }, [supabase]);
  const deleteJalador = useCallback(async (id: string) => {
    await supabase.from("jaladores").delete().eq("id", id);
  }, [supabase]);

  const addIngreso = useCallback(async (i: Omit<IngresoJalador, "id">) => {
    await supabase.from("ingresos_jaladores").insert(ingresoToRow(i as Partial<IngresoJalador>));
  }, [supabase]);
  const updateIngreso = useCallback(async (id: string, patch: Partial<IngresoJalador>) => {
    await supabase.from("ingresos_jaladores").update(ingresoToRow(patch)).eq("id", id);
  }, [supabase]);
  const deleteIngreso = useCallback(async (id: string) => {
    await supabase.from("ingresos_jaladores").delete().eq("id", id);
  }, [supabase]);

  /* ====== Accesos temporales con caducidad ======
     Crear: lee rol vigente del worker, lo guarda como rol_original, aplica
     rol_otorgado en profiles. Revocar: si seguía activo, restaura rol_original. */
  const addAccesoTemp = useCallback(async (a: Omit<AccesoTemporal, "id" | "rolOriginal">) => {
    const w = state.workers.find(x => x.id === a.workerId);
    const rolOriginal = w?.rol ?? "trabajador";
    await supabase.from("accesos_temporales").insert(
      accesoTempToRow({ ...a, rolOriginal } as Partial<AccesoTemporal>)
    );
    await supabase.from("profiles").update({ rol: a.rolOtorgado, rol_original: rolOriginal }).eq("id", a.workerId);
  }, [supabase, state.workers]);

  const removeAccesoTemp = useCallback(async (id: string) => {
    const acceso = state.accesosTemporales.find(x => x.id === id);
    if (!acceso) return;
    const sigueActivo = new Date(acceso.hasta).getTime() > Date.now();
    if (sigueActivo && acceso.rolOriginal) {
      await supabase.from("profiles").update({ rol: acceso.rolOriginal, rol_original: null }).eq("id", acceso.workerId);
    }
    await supabase.from("accesos_temporales").delete().eq("id", id);
  }, [supabase, state.accesosTemporales]);

  /* ====== Caducidad: ticker cada 30s (defensa-en-profundidad).
     El backstop autoritativo es pg_cron en backend (`tramys_expirar_accesos`). */
  useEffect(() => {
    if (!ready) return;
    async function tick() {
      const ahora = new Date().toISOString();
      const { data: expirados } = await supabase
        .from("accesos_temporales").select("*").lte("hasta", ahora);
      if (!expirados || expirados.length === 0) return;
      for (const e of expirados) {
        const original = (e.rol_original as string) ?? "trabajador";
        await supabase.from("profiles").update({ rol: original, rol_original: null }).eq("id", e.worker_id);
      }
      await supabase.from("accesos_temporales").delete().lte("hasta", ahora);
    }
    void tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [supabase, ready]);

  /* ====== Movimientos de caja ====== */
  const addMovimientoCaja = useCallback(async (m: Omit<MovimientoCaja, "id" | "createdAt">) => {
    await supabase.from("movimientos_caja").insert(movimientoCajaToRow(m as Partial<MovimientoCaja>));
  }, [supabase]);
  const updateMovimientoCaja = useCallback(async (id: string, patch: Partial<MovimientoCaja>) => {
    await supabase.from("movimientos_caja").update(movimientoCajaToRow(patch)).eq("id", id);
  }, [supabase]);
  const deleteMovimientoCaja = useCallback(async (id: string) => {
    await supabase.from("movimientos_caja").delete().eq("id", id);
  }, [supabase]);

  /* ====== Pagos de planilla ====== */
  const addPagoPlanilla = useCallback(async (p: Omit<PagoPlanilla, "id">) => {
    await supabase.from("pagos_planilla").insert(pagoPlanillaToRow(p as Partial<PagoPlanilla>));
  }, [supabase]);
  const deletePagoPlanilla = useCallback(async (id: string) => {
    await supabase.from("pagos_planilla").delete().eq("id", id);
  }, [supabase]);

  /* ====== Cuadres personales (sandbox del trabajador) ======
     Upsert por (worker_id, fecha) — RLS cp_self garantiza que solo el dueño
     lee/escribe lo suyo. Read-modify-write para preservar el otro flag cuando
     el patch trae solo uno. */
  const setCuadrePersonal = useCallback(async (workerId: string, fechaISO: string, patch: Partial<Pick<CuadrePersonal, "worked"|"late">>) => {
    const prev = state.cuadresPersonales.find(c => c.workerId === workerId && c.fecha === fechaISO);
    const next = {
      workerId,
      fecha: fechaISO,
      worked: patch.worked ?? prev?.worked ?? false,
      late:   patch.late   ?? prev?.late   ?? false,
    };
    await supabase.from("cuadres_personales").upsert(
      cuadrePersonalToRow(next),
      { onConflict: "worker_id,fecha" }
    );
  }, [supabase, state.cuadresPersonales]);
  const getCuadrePersonal = useCallback((workerId: string, fechaISO: string) =>
    state.cuadresPersonales.find(c => c.workerId === workerId && c.fecha === fechaISO),
  [state.cuadresPersonales]);
  const clearCuadrePersonal = useCallback(async (workerId: string, fechaISO: string) => {
    await supabase.from("cuadres_personales").delete()
      .eq("worker_id", workerId).eq("fecha", fechaISO);
  }, [supabase]);

  /* ====== Verificación de asistencia (Opción B) ====== */
  const verificarAsistencia = useCallback(async (recId: string, verificadoPor: string) => {
    await supabase.from("asistencia").update({
      verificado_por: verificadoPor,
      verificado_at: new Date().toISOString(),
    }).eq("id", recId);
  }, [supabase]);
  const desverificarAsistencia = useCallback(async (recId: string) => {
    await supabase.from("asistencia").update({
      verificado_por: null,
      verificado_at: null,
    }).eq("id", recId);
  }, [supabase]);

  /* ====== Reset: en Supabase no se hace desde el cliente ====== */
  const resetAll = useCallback(() => {
    if (typeof window !== "undefined") {
      console.warn("[Supabase] Reset deshabilitado: para limpiar datos, usa el SQL Editor (ver LAUNCH_PLAN §1).");
    }
  }, []);

  const value: DataCtx = {
    ...state,
    ready,
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
    addPagoPlanilla, deletePagoPlanilla,
    setCuadrePersonal, getCuadrePersonal, clearCuadrePersonal,
    verificarAsistencia, desverificarAsistencia,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData debe usarse dentro de <DataProvider>");
  return v;
}

/* ================= HELPERS DERIVADOS ================= */
/* Devuelve el PagoPlanilla que cubre la fecha dada para ese trabajador, o
   undefined si no hay ninguno. Comparación inclusiva en ambos extremos. */
export function pagoQueCubre(pagos: PagoPlanilla[], workerId: string, fechaISO: string): PagoPlanilla | undefined {
  return pagos.find(p =>
    p.workerId === workerId && p.desdeISO <= fechaISO && fechaISO <= p.hastaISO,
  );
}

/* True si existe un PagoPlanilla cuyo rango cubre exactamente o engloba el rango
   solicitado para ese trabajador. Útil para saber si el periodo activo de planilla
   ya fue pagado. */
export function estaPagado(pagos: PagoPlanilla[], workerId: string, desdeISO: string, hastaISO: string): PagoPlanilla | undefined {
  return pagos.find(p =>
    p.workerId === workerId && p.desdeISO <= desdeISO && hastaISO <= p.hastaISO,
  );
}

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
