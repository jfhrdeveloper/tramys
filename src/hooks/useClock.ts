"use client";
import { useEffect, useState } from "react";

/* ================= HOOK useClock ================= */
export function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ====== Valores formateados ====== */
  const hora = time.toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const horaCorta = time.toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit",
  });

  const fecha = time.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const esTardanza =
    time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 15);

  return { time, hora, horaCorta, fecha, esTardanza };
}
