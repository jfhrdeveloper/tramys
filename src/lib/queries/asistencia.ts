import { createClient } from "@/lib/supabase/client";
import { hoy } from "@/lib/utils/formatters";

export async function getAsistenciaHoy(sedeId?: string) {
  const supabase = createClient();
  let q = supabase.from("asistencia").select("*, trabajador:profiles(nombre,cargo,sede:sedes(nombre))").eq("fecha", hoy());
  if (sedeId) q = q.eq("sede_id", sedeId);
  const { data } = await q.order("hora_entrada");
  return data ?? [];
}

export async function getAsistenciaTrabajador(trabajadorId: string, mes: number, anio: number) {
  const supabase = createClient();
  const desde = `${anio}-${String(mes).padStart(2,"0")}-01`;
  const hasta  = `${anio}-${String(mes).padStart(2,"0")}-31`;
  const { data } = await supabase.from("asistencia").select("*").eq("trabajador_id", trabajadorId).gte("fecha", desde).lte("fecha", hasta).order("fecha");
  return data ?? [];
}
