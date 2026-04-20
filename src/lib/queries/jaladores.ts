import { createClient } from "@/lib/supabase/client";

export async function getJaladores(sedeId?: string) {
  const supabase = createClient();
  let q = supabase.from("jaladores").select("*, sede:sedes(nombre)").eq("activo", true);
  if (sedeId) q = q.eq("sede_id", sedeId);
  const { data } = await q.order("nombre");
  return data ?? [];
}

export async function getCaptacionesMes(jaladorId: string, mes: number, anio: number) {
  const supabase = createClient();
  const desde = `${anio}-${String(mes).padStart(2,"0")}-01`;
  const hasta  = `${anio}-${String(mes).padStart(2,"0")}-31`;
  const { data } = await supabase.from("captaciones").select("*").eq("jalador_id", jaladorId).gte("fecha", desde).lte("fecha", hasta).order("fecha");
  return data ?? [];
}

export async function registrarCaptacion(jaladorId: string, sedeId: string, cantidad: number, monto: number, zona?: string) {
  const supabase = createClient();
  const { data } = await supabase.from("captaciones").insert({ jalador_id:jaladorId, sede_id:sedeId, fecha:new Date().toISOString().split("T")[0], cantidad, monto, zona }).select().single();
  return data;
}
