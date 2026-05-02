"use client";

/* ================= DATA PROVIDER (Supabase) ================= */
/* Implementación del DataCtx contra Supabase + Realtime.       */
/* Mantiene la misma interfaz que el DataProvider local, así    */
/* todas las pantallas siguen llamando a useData() sin cambios. */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DataContext,
  type DataCtxValue,
  type DataState,
  type Sede, type Worker, type AsistenciaRec, type Adelanto, type Permiso,
  type Evento, type Jalador, type IngresoJalador, type AccesoTemporal,
  type MovimientoCaja,
} from "@/components/providers/DataProvider";
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
} from "@/lib/data/mappers";

const EMPTY_STATE: DataState = {
  sedes: [], workers: [], asistencia: [], adelantos: [], permisos: [],
  eventos: [], jaladores: [], ingresosJaladores: [], accesosTemporales: [],
  movimientosCaja: [],
  mostrarFeriadosOficiales: true,
};

export function DataProviderSupabase({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current;
  const [state, setState] = useState<DataState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  /* ====== Carga inicial (todas las tablas en paralelo) ====== */
  const cargar = useCallback(async () => {
    const [
      sedes, profiles, asist, adel, perm, ev, jal, ij, at, mc, ajustes,
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
      mostrarFeriadosOficiales: ajustes.data?.mostrar_feriados_oficiales ?? true,
    });
    setReady(true);
  }, [supabase]);

  useEffect(() => { void cargar(); }, [cargar]);

  /* ====== Realtime: suscripción a cambios postgres ====== */
  useEffect(() => {
    const channel = supabase
      .channel("tramys_realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, () => { void cargar(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, cargar]);

  /* =============== ACCIONES =============== */
  const updateSede = useCallback(async (id: string, patch: Partial<Sede>) => {
    await supabase.from("sedes").update(sedeToRow(patch)).eq("id", id);
  }, [supabase]);

  const addWorker = useCallback((w: Omit<Worker, "id">): Worker => {
    /* En Supabase los profiles vienen vinculados a auth.users; el id se crea desde Auth.
       Para mantener la firma del store (que devuelve un Worker con id) generamos un
       placeholder local y delegamos al admin la creación real desde el panel Auth. */
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

  const setAsistencia = useCallback(async (workerId: string, fechaISO: string, patch: Partial<AsistenciaRec>) => {
    /* upsert por (worker_id, fecha) — la unique constraint garantiza idempotencia */
    await supabase.from("asistencia").upsert(
      asistenciaToRow({ ...patch, workerId, fecha: fechaISO }),
      { onConflict: "worker_id,fecha" }
    );
  }, [supabase]);

  const getAsistencia = useCallback((workerId: string, fechaISO: string) =>
    state.asistencia.find(a => a.workerId === workerId && a.fecha === fechaISO),
  [state.asistencia]);

  const addAdelanto = useCallback(async (a: Omit<Adelanto, "id" | "estado">) => {
    await supabase.from("adelantos").insert({ ...adelantoToRow(a as Partial<Adelanto>), estado: "pendiente" });
  }, [supabase]);
  const updateAdelanto = useCallback(async (id: string, patch: Partial<Adelanto>) => {
    await supabase.from("adelantos").update(adelantoToRow(patch)).eq("id", id);
  }, [supabase]);

  const addPermiso = useCallback(async (p: Omit<Permiso, "id" | "estado">) => {
    await supabase.from("permisos").insert({ ...permisoToRow(p as Partial<Permiso>), estado: "pendiente" });
  }, [supabase]);
  const updatePermiso = useCallback(async (id: string, patch: Partial<Permiso>) => {
    await supabase.from("permisos").update(permisoToRow(patch)).eq("id", id);
  }, [supabase]);

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

  /* ====== Accesos temporales con caducidad ====== */
  const addAccesoTemp = useCallback(async (a: Omit<AccesoTemporal, "id" | "rolOriginal">) => {
    /* Lee el rol vigente del worker para guardar rol_original */
    const w = state.workers.find(x => x.id === a.workerId);
    const rolOriginal = w?.rol ?? "trabajador";
    await supabase.from("accesos_temporales").insert(
      accesoTempToRow({ ...a, rolOriginal } as Partial<AccesoTemporal>)
    );
    /* Aplica el rol otorgado */
    await supabase.from("profiles").update({ rol: a.rolOtorgado, rol_original: rolOriginal }).eq("id", a.workerId);
  }, [supabase, state.workers]);

  const removeAccesoTemp = useCallback(async (id: string) => {
    const acceso = state.accesosTemporales.find(x => x.id === id);
    if (!acceso) return;
    const ahora = Date.now();
    const sigueActivo = new Date(acceso.hasta).getTime() > ahora;
    if (sigueActivo && acceso.rolOriginal) {
      await supabase.from("profiles").update({ rol: acceso.rolOriginal, rol_original: null }).eq("id", acceso.workerId);
    }
    await supabase.from("accesos_temporales").delete().eq("id", id);
  }, [supabase, state.accesosTemporales]);

  /* ====== Caducidad: ticker que limpia expirados (defensa-en-profundidad).
            Idealmente esto lo hace pg_cron en backend (ver PROGRESS §6.10). */
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

  const resetAll = useCallback(() => {
    /* En Supabase no hacemos un wipe destructivo desde el cliente:
       el reset solo borra datos en modo demo (localStorage). */
    if (typeof window !== "undefined") {
      console.warn("[Supabase] Reset deshabilitado: borra los datos desde el SQL Editor.");
    }
  }, []);

  const value: DataCtxValue = {
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
    resetAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* Re-uso del mismo Context: las pantallas siguen usando useData() sin cambios.
   Este export está aquí solo por simetría con el DataProvider local.        */
export function useDataSupabase() {
  const v = useContext(DataContext);
  if (!v) throw new Error("useDataSupabase debe usarse dentro de <DataProviderSupabase>");
  return v;
}
