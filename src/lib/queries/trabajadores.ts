import { createClient } from "@/lib/supabase/client";

export async function getTrabajadores(sedeId?: string) {
  const supabase = createClient();
  let q = supabase.from("profiles").select("*, sede:sedes(nombre)").eq("rol", "trabajador").eq("activo", true);
  if (sedeId) q = q.eq("sede_id", sedeId);
  const { data } = await q.order("nombre");
  return data ?? [];
}

export async function getTrabajador(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*, sede:sedes(nombre)").eq("id", id).single();
  return data;
}
