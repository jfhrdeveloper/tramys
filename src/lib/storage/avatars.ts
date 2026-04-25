/* ================= STORAGE — AVATARES ================= */
/* Sube/elimina fotos de perfil al bucket público "avatars".  */
/* La ruta es <user_uuid>/avatar.png para que la policy de    */
/* RLS permita escribir solo al propio dueño.                  */

import { createClient } from "@/lib/supabase/client";

/* Convierte un base64 dataURL en Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.+);base64/.exec(meta)?.[1] ?? "image/png";
  const bin  = atob(b64);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* Sube una imagen base64 al bucket avatars y devuelve la URL pública */
export async function subirAvatar(userId: string, dataUrl: string): Promise<string> {
  const supabase = createClient();
  const blob = dataUrlToBlob(dataUrl);
  const path = `${userId}/avatar.png`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

/* Elimina la foto de perfil */
export async function eliminarAvatar(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("avatars").remove([`${userId}/avatar.png`]);
}
