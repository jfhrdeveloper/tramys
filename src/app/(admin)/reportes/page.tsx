"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Icon } from "@/components/ui/Icons";
import { HideableAmount } from "@/components/ui/HideableAmount";
import { money } from "@/lib/utils/formatters";
import { useData, ingresoDia, isWeekendISO, agregadoCaja } from "@/components/providers/DataProvider";
import { esFeriadoOficial } from "@/lib/utils/peruHolidays";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/* ============ HELPERS DE EXPORT ============ */
function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map(r => r.map(csvEscape).join(",")).join("\n");
  return `﻿${head}\n${body}\n`;
}
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
const downloadCSV  = (h: string[], r: (string|number|null|undefined)[][], name: string) => downloadBlob(buildCSV(h, r), name, "text/csv");
const downloadJSON = (data: unknown, name: string) => downloadBlob(JSON.stringify(data, null, 2), name, "application/json");

/* ================= PÁGINA ================= */
export default function ReportesPage() {
  const d = useData();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState<number | "all">(now.getMonth());
  const [sedeId, setSedeId] = useState<string | "all">("all");

  /* ====== Filtrado base ====== */
  const inRange = (iso: string) => {
    const [y, m] = iso.split("-").map(Number);
    if (y !== year) return false;
    if (month !== "all" && (m - 1) !== month) return false;
    return true;
  };
  const sedeOk = (sId: string) => sedeId === "all" || sId === sedeId;

  const workersFiltrados = useMemo(
    () => d.workers.filter(w => w.rol === "trabajador" && sedeOk(w.sedeId)),
    [d.workers, sedeId]
  );
  const sedeMap   = useMemo(() => Object.fromEntries(d.sedes.map(s => [s.id, s.nombre])), [d.sedes]);
  const workerMap = useMemo(() => Object.fromEntries(d.workers.map(w => [w.id, w])), [d.workers]);

  /* ====== Totales y métricas resumidas ====== */
  const resumen = useMemo(() => {
    let totalAsistencias = 0, totalTard = 0, totalAus = 0, totalPerm = 0;
    let bruto = 0;
    for (const a of d.asistencia) {
      if (!inRange(a.fecha)) continue;
      const w = workerMap[a.workerId];
      if (!w) continue;
      if (!sedeOk(a.sedeIdDia ?? w.sedeId)) continue;
      if (a.estado === "presente")  totalAsistencias++;
      if (a.estado === "tardanza") { totalAsistencias++; totalTard++; }
      if (a.estado === "ausente")   totalAus++;
      if (a.estado === "permiso")   totalPerm++;
      if (w.rol === "trabajador") {
        bruto += ingresoDia(a, w.tarifas, isWeekendISO(a.fecha), esFeriadoOficial(a.fecha).es);
      }
    }
    let comisiones = 0, ingresoJal = 0;
    for (const i of d.ingresosJaladores) {
      if (!inRange(i.fecha)) continue;
      const j = d.jaladores.find(x => x.id === i.jaladorId);
      if (!j) continue;
      if (!sedeOk(j.sedeId)) continue;
      ingresoJal += i.monto;
      comisiones += i.monto * j.porcentajeComision / 100;
    }
    let adelantos = 0, adelCount = 0;
    for (const a of d.adelantos) {
      if (!inRange(a.fecha) || a.estado !== "aprobado") continue;
      const w = workerMap[a.workerId];
      if (!w || !sedeOk(w.sedeId)) continue;
      adelantos += a.monto; adelCount++;
    }
    return { totalAsistencias, totalTard, totalAus, totalPerm, bruto, comisiones, ingresoJal, adelantos, adelCount };
  }, [d.asistencia, d.adelantos, d.ingresosJaladores, d.jaladores, workerMap, year, month, sedeId]);

  /* ====== Sufijo de archivo ====== */
  const suf = `${year}${month === "all" ? "" : `-${String(Number(month)+1).padStart(2,"0")}`}${sedeId === "all" ? "" : `_${sedeMap[sedeId] ?? sedeId}`}`.replace(/\s+/g, "-");

  /* ====== EXPORTS ====== */
  /* 1. Planilla resumida por trabajador */
  const exportPlanilla = () => {
    const rows = workersFiltrados.map(w => {
      let dN = 0, dT = 0, dF = 0, dH = 0, bruto = 0;
      for (const a of d.asistencia) {
        if (a.workerId !== w.id || !inRange(a.fecha)) continue;
        const fds = isWeekendISO(a.fecha);
        const fer = esFeriadoOficial(a.fecha).es;
        if (a.estado === "presente" || a.estado === "tardanza") {
          if (fer) dH++; else if (fds) dF++; else if (a.estado === "tardanza") dT++; else dN++;
          bruto += ingresoDia(a, w.tarifas, fds, fer);
        }
      }
      const adel = d.adelantos
        .filter(a => a.workerId === w.id && a.estado === "aprobado" && inRange(a.fecha))
        .reduce((s, a) => s + a.monto, 0);
      return [w.id, w.nombre, w.apodo, sedeMap[w.sedeId] ?? "", w.cargo,
              dN, dT, dF, dH, dN + dT + dF + dH, bruto.toFixed(2), adel.toFixed(2), (bruto - adel).toFixed(2)];
    });
    downloadCSV(
      ["WorkerID","Nombre","Apodo","Sede","Cargo","DiasNormales","DiasTardanza","DiasFinSemana","DiasFeriado","DiasTotal","Bruto","Adelantos","Neto"],
      rows, `planilla_${suf}.csv`
    );
  };

  /* 2. Asistencia detallada */
  const exportAsistencia = () => {
    const rows = d.asistencia
      .filter(a => inRange(a.fecha))
      .filter(a => { const w = workerMap[a.workerId]; return w && sedeOk(a.sedeIdDia ?? w.sedeId); })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(a => {
        const w = workerMap[a.workerId];
        return [a.fecha, w?.nombre ?? "—", w?.apodo ?? "", sedeMap[a.sedeIdDia ?? w?.sedeId ?? ""] ?? "",
                a.estado, a.entrada ?? "", a.salida ?? "",
                a.turnoEntrada ?? w?.turno.entrada ?? "", a.turnoSalida ?? w?.turno.salida ?? "",
                a.overrideIngreso ?? "", a.motivoEdit ?? ""];
      });
    downloadCSV(
      ["Fecha","Trabajador","Apodo","Sede","Estado","Entrada","Salida","TurnoEsperadoEntrada","TurnoEsperadoSalida","OverrideIngreso","MotivoEdicion"],
      rows, `asistencia_${suf}.csv`
    );
  };

  /* 3. Sueldo detallado por día */
  const exportSueldoDetalle = () => {
    const rows: (string|number)[][] = [];
    for (const w of workersFiltrados) {
      for (const a of d.asistencia) {
        if (a.workerId !== w.id || !inRange(a.fecha)) continue;
        const fds = isWeekendISO(a.fecha);
        const fer = esFeriadoOficial(a.fecha).es;
        const tipoDia = fer ? "Feriado" : fds ? "FinSemana" : a.estado === "tardanza" ? "Tardanza" : "Normal";
        const ingreso = (a.estado === "presente" || a.estado === "tardanza")
          ? ingresoDia(a, w.tarifas, fds, fer) : 0;
        rows.push([a.fecha, w.nombre, w.apodo, sedeMap[a.sedeIdDia ?? w.sedeId] ?? "",
                   a.estado, tipoDia, a.overrideIngreso ?? "", ingreso.toFixed(2)]);
      }
    }
    downloadCSV(
      ["Fecha","Trabajador","Apodo","Sede","Estado","TipoDia","Override","Ingreso"],
      rows.sort((a,b) => String(a[0]).localeCompare(String(b[0]))),
      `sueldo_detalle_${suf}.csv`
    );
  };

  /* 4. Adelantos */
  const exportAdelantos = () => {
    const rows = d.adelantos
      .filter(a => inRange(a.fecha))
      .filter(a => { const w = workerMap[a.workerId]; return w && sedeOk(w.sedeId); })
      .sort((a,b) => a.fecha.localeCompare(b.fecha))
      .map(a => {
        const w = workerMap[a.workerId];
        return [a.fecha, w?.nombre ?? "—", w?.apodo ?? "", sedeMap[w?.sedeId ?? ""] ?? "",
                a.monto.toFixed(2), a.estado, a.motivo, a.nota ?? ""];
      });
    downloadCSV(
      ["Fecha","Trabajador","Apodo","Sede","Monto","Estado","Motivo","Nota"],
      rows, `adelantos_${suf}.csv`
    );
  };

  /* 5. Permisos */
  const exportPermisos = () => {
    const rows = d.permisos
      .filter(p => inRange(p.fecha))
      .filter(p => { const w = workerMap[p.workerId]; return w && sedeOk(w.sedeId); })
      .sort((a,b) => a.fecha.localeCompare(b.fecha))
      .map(p => {
        const w = workerMap[p.workerId];
        return [p.fecha, w?.nombre ?? "—", w?.apodo ?? "", sedeMap[w?.sedeId ?? ""] ?? "",
                p.tipo, p.estado, p.motivo];
      });
    downloadCSV(
      ["Fecha","Trabajador","Apodo","Sede","Tipo","Estado","Motivo"],
      rows, `permisos_${suf}.csv`
    );
  };

  /* 6. Jaladores — comisiones */
  const exportJaladores = () => {
    const rows = d.ingresosJaladores
      .filter(i => inRange(i.fecha))
      .filter(i => { const j = d.jaladores.find(x => x.id === i.jaladorId); return j && sedeOk(j.sedeId); })
      .sort((a,b) => a.fecha.localeCompare(b.fecha))
      .map(i => {
        const j = d.jaladores.find(x => x.id === i.jaladorId)!;
        const com = i.monto * j.porcentajeComision / 100;
        return [i.fecha, j.nombre, j.apodo, sedeMap[j.sedeId] ?? "",
                i.monto.toFixed(2), j.porcentajeComision, com.toFixed(2), i.nota ?? ""];
      });
    downloadCSV(
      ["Fecha","Jalador","Apodo","Sede","IngresoBruto","%Comision","Comision","Nota"],
      rows, `jaladores_${suf}.csv`
    );
  };

  /* 7. Trabajadores activos (perfil) */
  const exportTrabajadores = () => {
    const rows = d.workers
      .filter(w => sedeOk(w.sedeId))
      .map(w => [w.id, w.nombre, w.apodo, w.dni ?? "", w.email, w.telefono ?? "",
                 w.rol, sedeMap[w.sedeId] ?? "", w.cargo, w.fechaIngreso, w.activo ? "SI" : "NO",
                 w.turno.entrada, w.turno.salida,
                 w.tarifas.diaNormal, w.tarifas.tardanza, w.tarifas.finSemana, w.tarifas.feriado]);
    downloadCSV(
      ["ID","Nombre","Apodo","DNI","Email","Telefono","Rol","Sede","Cargo","FechaIngreso","Activo",
       "TurnoEntrada","TurnoSalida","TarifaNormal","TarifaTardanza","TarifaFinSemana","TarifaFeriado"],
      rows, `trabajadores_${suf}.csv`
    );
  };

  /* 8. Sedes — totales día/semana/mes calculados desde MovimientoCaja */
  const exportSedes = () => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const isoOf = (dt: Date) => dt.toISOString().slice(0, 10);
    const hoyISO = isoOf(hoy);
    const semDesde = new Date(hoy); semDesde.setDate(hoy.getDate() - 6);
    const mesDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const rangos = {
      dia:    { d: hoyISO,           h: hoyISO },
      semana: { d: isoOf(semDesde),  h: hoyISO },
      mes:    { d: isoOf(mesDesde),  h: hoyISO },
    };
    const rows = d.sedes
      .filter(s => sedeOk(s.id))
      .map(s => {
        const enc = s.encargadoId ? workerMap[s.encargadoId]?.nombre ?? "" : "";
        const ag = (r: { d: string; h: string }) =>
          agregadoCaja({ movimientosCaja: d.movimientosCaja }, s.id, r.d, r.h);
        const aDia = ag(rangos.dia), aSem = ag(rangos.semana), aMes = ag(rangos.mes);
        return [s.id, s.nombre, s.direccion, s.telefono, s.horario, enc, s.activa ? "SI" : "NO",
                aDia.ingresos.toFixed(2), aSem.ingresos.toFixed(2), aMes.ingresos.toFixed(2),
                (aDia.gastoFijo + aDia.gastoPersonal + aDia.gastoManual).toFixed(2),
                (aSem.gastoFijo + aSem.gastoPersonal + aSem.gastoManual).toFixed(2),
                (aMes.gastoFijo + aMes.gastoPersonal + aMes.gastoManual).toFixed(2)];
      });
    downloadCSV(
      ["ID","Nombre","Direccion","Telefono","Horario","Encargado","Activa",
       "IngresosDia","IngresosSemana","IngresosMes","GastosDia","GastosSemana","GastosMes"],
      rows, `sedes_${suf}.csv`
    );
  };

  /* 8b. Movimientos de caja — line items del periodo seleccionado */
  const exportMovimientosCaja = () => {
    const rows = d.movimientosCaja
      .filter(m => inRange(m.fecha))
      .filter(m => sedeOk(m.sedeId))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.createdAt.localeCompare(b.createdAt))
      .map(m => {
        const reg = m.registradoPor ? workerMap[m.registradoPor]?.nombre ?? "" : "";
        return [m.fecha, sedeMap[m.sedeId] ?? "", m.tipo, m.categoria ?? "",
                m.cantidad ?? "", m.unitario ?? "", m.monto.toFixed(2),
                m.concepto, reg];
      });
    downloadCSV(
      ["Fecha","Sede","Tipo","Categoria","Cantidad","Unitario","Monto","Concepto","RegistradoPor"],
      rows, `movimientos_caja_${suf}.csv`
    );
  };

  /* 9. Eventos */
  const exportEventos = () => {
    const rows = d.eventos
      .filter(e => inRange(e.date))
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(e => [e.date, e.nombre, e.tipo, e.pagado ? "SI" : "NO", e.descripcion ?? ""]);
    downloadCSV(
      ["Fecha","Nombre","Tipo","Pagado","Descripcion"],
      rows, `eventos_${suf}.csv`
    );
  };

  /* 10. Resumen mensual del año */
  const exportResumenMensual = () => {
    const rows = MESES.map((mLabel, m) => {
      let bruto = 0, asis = 0, tard = 0, aus = 0;
      for (const a of d.asistencia) {
        const [y, mo] = a.fecha.split("-").map(Number);
        if (y !== year || (mo - 1) !== m) continue;
        const w = workerMap[a.workerId];
        if (!w || !sedeOk(a.sedeIdDia ?? w.sedeId)) continue;
        if (a.estado === "presente" || a.estado === "tardanza") {
          asis++;
          if (a.estado === "tardanza") tard++;
          if (w.rol === "trabajador") bruto += ingresoDia(a, w.tarifas, isWeekendISO(a.fecha), esFeriadoOficial(a.fecha).es);
        }
        if (a.estado === "ausente") aus++;
      }
      let com = 0, ingJ = 0;
      for (const i of d.ingresosJaladores) {
        const [y, mo] = i.fecha.split("-").map(Number);
        if (y !== year || (mo - 1) !== m) continue;
        const j = d.jaladores.find(x => x.id === i.jaladorId);
        if (!j || !sedeOk(j.sedeId)) continue;
        ingJ += i.monto; com += i.monto * j.porcentajeComision / 100;
      }
      let adel = 0;
      for (const a of d.adelantos) {
        const [y, mo] = a.fecha.split("-").map(Number);
        if (y !== year || (mo - 1) !== m || a.estado !== "aprobado") continue;
        const w = workerMap[a.workerId];
        if (!w || !sedeOk(w.sedeId)) continue;
        adel += a.monto;
      }
      return [year, String(m+1).padStart(2,"0"), mLabel,
              asis, tard, aus,
              bruto.toFixed(2), ingJ.toFixed(2), com.toFixed(2), adel.toFixed(2),
              (bruto - adel).toFixed(2)];
    });
    downloadCSV(
      ["Anio","Mes","MesNombre","Asistencias","Tardanzas","Ausencias","BrutoPlanilla","IngresoJaladores","Comisiones","Adelantos","NetoPlanilla"],
      rows, `resumen_mensual_${year}${sedeId === "all" ? "" : `_${sedeMap[sedeId]}`}.csv`
    );
  };

  /* 11. Snapshot completo (JSON) */
  const exportSnapshot = () => {
    downloadJSON({
      generado: new Date().toISOString(),
      filtros: { year, month, sedeId },
      sedes: d.sedes,
      workers: d.workers,
      asistencia: d.asistencia,
      adelantos: d.adelantos,
      permisos: d.permisos,
      eventos: d.eventos,
      jaladores: d.jaladores,
      ingresosJaladores: d.ingresosJaladores,
      accesosTemporales: d.accesosTemporales,
      movimientosCaja: d.movimientosCaja,
    }, `snapshot_tramys_${suf}.json`);
  };

  /* 12. Auditoría de accesos temporales */
  const exportAccesos = () => {
    const rows = d.accesosTemporales
      .filter(a => { const w = workerMap[a.workerId]; return w && sedeOk(w.sedeId); })
      .sort((a,b) => a.desde.localeCompare(b.desde))
      .map(a => {
        const w = workerMap[a.workerId];
        const otorgador = workerMap[a.otorgadoPor];
        return [a.id, w?.nombre ?? "—", sedeMap[w?.sedeId ?? ""] ?? "",
                a.rolOriginal ?? "", a.rolOtorgado, a.desde, a.hasta,
                otorgador?.nombre ?? "", a.motivo];
      });
    downloadCSV(
      ["ID","Trabajador","Sede","RolOriginal","RolOtorgado","Desde","Hasta","Otorgadopor","Motivo"],
      rows, `accesos_temporales_${suf}.csv`
    );
  };

  /* ====== Tarjetas de export ====== */
  const grupos: { titulo: string; descripcion: string; items: { label: string; desc: string; icon: string; color: string; onClick: () => void; format: "CSV" | "JSON"; }[] }[] = [
    {
      titulo: "Operaciones · Asistencia y planilla",
      descripcion: "Datos del periodo seleccionado",
      items: [
        { label:"Planilla resumida",     desc:"Días por tipo, bruto, adelantos y neto por trabajador", icon:"planilla",   color:"#C41A3A", onClick: exportPlanilla,      format:"CSV" },
        { label:"Asistencia detallada",  desc:"Cada marca con sede del día, entrada/salida y override", icon:"asistencia", color:"#6366f1", onClick: exportAsistencia,    format:"CSV" },
        { label:"Sueldo por día",        desc:"Detalle día por día del cálculo dinámico",              icon:"sueldo",     color:"#16a34a", onClick: exportSueldoDetalle, format:"CSV" },
        { label:"Resumen mensual del año", desc:"12 filas con totales del año (sin filtro de mes)",     icon:"reportes",   color:"#0891b2", onClick: exportResumenMensual,format:"CSV" },
      ],
    },
    {
      titulo: "Solicitudes y eventos",
      descripcion: "Adelantos, permisos y calendario",
      items: [
        { label:"Adelantos",  desc:"Estado, monto, motivo y nota",          icon:"adelantos", color:"#f59e0b", onClick: exportAdelantos, format:"CSV" },
        { label:"Permisos",   desc:"Tipo, fecha y estado de cada solicitud", icon:"file_check", color:"#8b5cf6", onClick: exportPermisos,  format:"CSV" },
        { label:"Eventos",    desc:"Cumpleaños, feriados de empresa y otros", icon:"cumpleanos", color:"#ec4899", onClick: exportEventos,   format:"CSV" },
      ],
    },
    {
      titulo: "Comerciales · Jaladores",
      descripcion: "Ingresos generados y comisiones",
      items: [
        { label:"Comisiones jaladores", desc:"Ingreso bruto, % de comisión y comisión calculada", icon:"jaladores", color:"#dc2626", onClick: exportJaladores, format:"CSV" },
      ],
    },
    {
      titulo: "Maestros · Catálogo",
      descripcion: "Información estructural (independiente del periodo)",
      items: [
        { label:"Trabajadores",      desc:"Perfil completo, tarifas y turno",                     icon:"trabajadores", color:"#0ea5e9", onClick: exportTrabajadores,     format:"CSV" },
        { label:"Sedes",             desc:"Datos de contacto, encargado y totales de caja",       icon:"sedes",        color:"#7c3aed", onClick: exportSedes,            format:"CSV" },
        { label:"Movimientos caja",  desc:"Line items de ingresos y gastos del periodo por sede", icon:"sueldo",       color:"#16a34a", onClick: exportMovimientosCaja,  format:"CSV" },
      ],
    },
    {
      titulo: "Auditoría y backup",
      descripcion: "Para revisión y respaldo completo",
      items: [
        { label:"Accesos temporales", desc:"Histórico de impersonaciones con caducidad", icon:"accesos", color:"#475569", onClick: exportAccesos,   format:"CSV"  },
        { label:"Snapshot completo",  desc:"Backup JSON con TODA la base de datos",     icon:"download", color:"#1e293b", onClick: exportSnapshot,  format:"JSON" },
      ],
    },
  ];

  /* ====== KPIs ====== */
  const periodoLabel = month === "all" ? `Año ${year}` : `${MESES[Number(month)]} ${year}`;
  const sedeLabel    = sedeId === "all" ? "Todas las sedes" : sedeMap[sedeId];
  const totalRows    = d.asistencia.length + d.adelantos.length + d.permisos.length
                     + d.eventos.length + d.ingresosJaladores.length + d.workers.length + d.sedes.length;

  return (
    <>
      <Topbar title="Reportes" subtitle={`Exportación de datos · ${periodoLabel}`} />
      <main className="page-main">

        {/* ====== Filtros ====== */}
        <div className="card" style={{ marginBottom: 14, display:"flex", gap: 10, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap: 8, flex:"1 1 auto" }}>
            <Icon name="reportes" size={18} color="var(--brand)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Filtros del reporte</div>
              <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{periodoLabel} · {sedeLabel}</div>
            </div>
          </div>
          <select className="select-base" value={String(month)} onChange={e=>setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}>
            <option value="all">Todo el año</option>
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select className="select-base" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="select-base" value={sedeId} onChange={e=>setSedeId(e.target.value)}>
            <option value="all">Todas las sedes</option>
            {d.sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        {/* ====== KPIs del periodo ====== */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
          {[
            { label:"Asistencias",  value: String(resumen.totalAsistencias), color:"#16a34a", sub:`${resumen.totalTard} tardanzas` },
            { label:"Ausencias",    value: String(resumen.totalAus),         color:"#dc2626", sub:`${resumen.totalPerm} permisos` },
            { label:"Bruto planilla", monto: resumen.bruto,                 color:"var(--brand)", sub:"Antes de adelantos" },
            { label:"Adelantos aprobados", monto: resumen.adelantos,         color:"#f59e0b", sub:`${resumen.adelCount} solicitudes` },
            { label:"Ingreso jaladores", monto: resumen.ingresoJal,          color:"#6366f1", sub:`Comisión ${money(resumen.comisiones)}` },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: 12, borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 10, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing: .6 }}>{k.label}</div>
              {"monto" in k
                ? <HideableAmount value={money(k.monto ?? 0)} size={18} color={k.color} weight={800} fontFamily="'DM Mono',monospace" />
                : <div style={{ fontWeight: 800, fontSize: 18, color: k.color, fontFamily:"'DM Mono',monospace" }}>{k.value}</div>}
              <div style={{ fontSize: 10, color:"var(--text-muted)", marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ====== Grupos de exportación ====== */}
        {grupos.map(g => (
          <div key={g.titulo} className="card" style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.titulo}</div>
              <div style={{ fontSize: 11, color:"var(--text-muted)", fontFamily:"'DM Mono',monospace" }}>{g.descripcion}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {g.items.map(it => (
                <button key={it.label} onClick={it.onClick}
                  style={{
                    display:"flex", alignItems:"center", gap: 10, textAlign:"left",
                    padding: 12, borderRadius: 10, cursor:"pointer",
                    background:"var(--bg)",
                    border: `1px solid ${it.color}33`,
                    borderLeft: `4px solid ${it.color}`,
                    transition: "transform .15s, box-shadow .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)";    (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `${it.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                    <Icon name={it.icon} size={18} color={it.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, display:"flex", alignItems:"center", gap: 6, flexWrap:"wrap" }}>
                      {it.label}
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding:"2px 6px", borderRadius: 99,
                        fontFamily:"'DM Mono',monospace",
                        background: `${it.color}18`, color: it.color,
                      }}>{it.format}</span>
                    </div>
                    <div style={{ fontSize: 11, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.desc}</div>
                  </div>
                  <Icon name="download" size={14} color={it.color} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ====== Footer info ====== */}
        <div style={{ fontSize: 11, color:"var(--text-muted)", textAlign:"center", padding:"8px 0 4px", fontFamily:"'DM Mono',monospace" }}>
          {totalRows} registros disponibles · CSV con BOM (compatible con Excel) · Codificación UTF-8
        </div>
      </main>
    </>
  );
}
