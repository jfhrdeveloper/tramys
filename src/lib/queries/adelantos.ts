import { createClient } from "@/lib/supabase/client";

export async function getAdelantos(estado?: string) {
  const supabase = createClient();
  let q = supabase.from("adelantos").select("*, trabajador:profiles(nombre,sede:sedes(nombre))");
  if (estado) q = q.eq("estado", estado);
  const { data } = await q.order("created_at", { ascending:false });
  return data ?? [];
}

export async function aprobarAdelanto(id: string, aprobadoPor: string, nota: string) {
  const supabase = createClient();
  const { data } = await supabase.from("adelantos").update({ estado:"aprobado", aprobado_por:aprobadoPor, nota }).eq("id", id).select().single();
  return data;
}

export async function rechazarAdelanto(id: string, aprobadoPor: string, nota: string) {
  const supabase = createClient();
  const { data } = await supabase.from("adelantos").update({ estado:"rechazado", aprobado_por:aprobadoPor, nota }).eq("id", id).select().single();
  return data;
}
