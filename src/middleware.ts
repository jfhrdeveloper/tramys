import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* ================= MIDDLEWARE — PROTECCIÓN DE RUTAS ================= */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  /* ==== Crear cliente Supabase en middleware ==== */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()         { return request.cookies.getAll(); },
        setAll(toSet)    {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* ==== Verificar sesión ==== */
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  /* ==== Rutas públicas ==== */
  if (pathname.startsWith("/login")) {
    if (user) {
      /* ==== Usuario ya autenticado → redirigir según rol ==== */
      const { data: profile } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      const destino = profile?.rol === "trabajador"
        ? "/mi-panel"
        : "/dashboard";

      return NextResponse.redirect(new URL(destino, request.url));
    }
    return supabaseResponse;
  }

  /* ==== Rutas protegidas — sin sesión → login ==== */
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /* ==== Obtener perfil del usuario ==== */
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, sede_id")
    .eq("id", user.id)
    .single();

  const rol = profile?.rol as string;

  /* ====== Protección por rol ====== */

  /* ==== Rutas solo Admin (owner + encargado) ==== */
  const rutasAdmin = [
    "/dashboard", "/sedes", "/trabajadores", "/jaladores",
    "/asistencia", "/planilla", "/adelantos", "/feriados",
    "/cumpleanos", "/reportes", "/accesos",
  ];

  /* ==== Rutas solo Trabajador ==== */
  const rutasWorker = [
    "/mi-panel", "/mi-asistencia", "/mi-sueldo",
    "/mis-adelantos", "/mis-permisos", "/mis-alertas",
  ];

  /* ==== Rutas solo Owner ==== */
  const rutasSoloOwner = [
    "/planilla", "/adelantos", "/accesos", "/reportes",
    "/jaladores", "/sedes",
  ];

  // Trabajador accede a ruta de admin
  if (rol === "trabajador" && rutasAdmin.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/mi-panel", request.url));
  }

  // Admin accede a ruta de trabajador
  if ((rol === "owner" || rol === "encargado") && rutasWorker.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Encargado accede a ruta solo-owner
  if (rol === "encargado" && rutasSoloOwner.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /* ==== Redirigir raíz ==== */
  if (pathname === "/") {
    const destino = rol === "trabajador" ? "/mi-panel" : "/dashboard";
    return NextResponse.redirect(new URL(destino, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
