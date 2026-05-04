# 📖 TRAMYS — Roadmap y Reglas del Proyecto

> Documento maestro de control de estado, decisiones arquitectónicas y reglas globales para mantener la consistencia en la base de código.

---

## 🎯 1. Reglas Globales del Proyecto

> **Movido a `docs/style-guide.md`** — estándar visual de comentarios + JSX, breakpoints responsivos mobile-first, paleta TRAMYS (modo claro/oscuro/sedes/estados) y tipografía (Bricolage + DM Mono) son la fuente única ahí. Esta sección queda como puntero para evitar drift entre documentos.

---

## 🧠 2. Decisiones Arquitectónicas (Fijas)

- 💾 **Persistencia:** `localStorage` a través del store global `DataProvider`. Por ahora no se usa Supabase Storage/Inserts para iterar rápido la UI.
- 🇵🇪 **Feriados Perú:** Precargados solo los fijos de 2026 y otros años en `peruHolidays.ts`. Habrá checkbox en la vista de Eventos para alternar su visibilidad.
- ⏱️ **Accesos Temporales:** Rol completo por duración (1h, 4h, 1d, 7d, custom hasta fecha). La expiración será visible en la tabla.
- 📸 **Evidencia Fotográfica:** Guardada como Base64 en localStorage, recortada en ratio 1:1 vía canvas crop.
- 💰 **Cálculo de Sueldo:** **NO EXISTE sueldo base**. Todo es dinámico: `Σ (asistencia × tarifa del día)` + overrides manuales. Las tarifas son: `diaNormal`, `tardanza`, `finSemana`, `feriado`.

---

## 🚀 3. Estado de Desarrollo (Roadmap)

### ✅ Fases Completadas (Fundamentos y Core Admin)

- [x] **A1** Store global (`DataProvider`)
- [x] **A2** `PhotoUpload` + iconos (cake, money_bill)
- [x] **A3** Preloader de login + cerrar sesión en footer
- [x] **B1** Dashboard principal rediseñado
- [x] **B2** Sedes grid + Lima + sistema de color
- [x] **B3** Trabajadores (CRUD, vista de asistencia y sueldo por día)
- [x] **B4** Jaladores (Lista + perfil, registro de ingresos)
- [x] **B5** Asistencia (Vista administrador)
- [x] **B6** Planilla (Cálculo ganancia empresa y días reales)

### ⏳ Fases Pendientes (Trabajador y Pulido)

- [x] **B7** Eventos (Toggle feriados oficiales, próximo evento, vista calendario)
- [x] **B8** Reportes (Rediseño visual completo y nuevos gráficos)
- [x] **B9** Accesos temporales (Modal y gestión de caducidad)
- [x] **C1** Trabajador: Panel `mi-asistencia` (Calendario multiverse)
- [x] **C2** Trabajador: Páginas restantes conectadas al `DataProvider` (mi-sueldo, mis-adelantos, mis-permisos, mis-alertas)
- [x] **D1** Pulido final (Cuadratura, centrado, QA de Responsive) — `page-main` centrado y con tope `max-width: 1440px` ≥2xl, `HydrationGate` cubre carga inicial.

---

## 📂 4. Referencias: Archivos Core Creados

- `src/components/providers/DataProvider.tsx` (incluye ticker de caducidad de accesos temporales)
- `src/components/providers/SessionProvider.tsx` (sesión activa local con `useSession`/`switchTo`/`signOut`)
- `src/components/ui/PhotoUpload.tsx`
- `src/components/ui/Preloader.tsx`
- `src/components/ui/Skeleton.tsx` (Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonStats)
- `src/components/ui/HydrationGate.tsx` (gate global que cubre la hidratación inicial con skeleton unificado)
- `src/components/ui/MiPerfilModal.tsx` (modal global de edición del usuario activo: foto, Nombres + Apellidos, apodo, email, teléfono, DNI, contraseña)
- `src/lib/constants/estados.ts` (paleta canónica `ESTADO_COLOR` para presente/tardanza/ausente/permiso/feriado, con `bg`, `fg`, `dot`, `label`)
- `src/lib/utils/peruHolidays.ts`

---

## 🧠 5. Memoria de Requerimientos Detallados (Backlog Operativo)

### 👑 VISTA ADMINISTRADOR / OWNER

- [x] **1. Dashboard:** Rediseño completo, hero unificado, métricas correctas. Cards de KPI superiores eliminadas (todo dentro del hero).
- [x] **2. Sedes:** Cards apiladas, sede Lima, "Caja" unificada, color modificable, **selector de encargado** + checkbox activa en el modal.
- [x] **3. Trabajadores:**
  - [x] Botón "Nuevo trabajador" funcional (incluye **apodo**).
  - [x] Agregar foto 1x1 cuadrable (Upload base64).
  - [x] **ELIMINAR** progreso del mes (no se muestra en el header del perfil).
  - [x] Asistencia: Subpanel Multiverse (calendario) + historial reciente con Editar.
  - [x] Editar registro: modal con estado, entrada/salida, override de ingreso y motivo.
  - [x] "Mi sueldo": icono billete (`money_bill`), tarifas modificables desde "Perfil", todo derivado de la asistencia.
  - [x] Adelantos y permisos: modales propios (sin más prompt()) y aprobación inline.
  - [x] Perfil y Turnos completamente editables.
- [x] **4. Jaladores:**
  - [x] Subpanel de lista + vista de movimiento (cuadre semanal/mensual + perfil).
  - [x] Botón "Registrar ingreso" con modal editable.
  - [x] **ELIMINAR** "Captación" → "Comisiones" en toda la UI activa (queda solo en código Supabase legacy no montado).
  - [x] Perfil: Dashboard dinámico (KPIs, barras 14 días, mejor día, promedio).
  - [x] **ELIMINAR** KPIs superiores (sin StatCards arriba, sólo lista + cuadre).
- [x] **5. Asistencia:**
  - [x] Mejorar contraste (actualmente fondo y letras muy blancas).
  - [x] Mostrar **Apodo** (prioridad) o Nombre. NO mostrar cantidad de asistentes.
  - [x] Agregar Dropdown Mes/Año (manteniendo vista actual).
  - [x] **ELIMINAR** KPIs superiores (Presencias, Tardanzas, Ausencias).
- [x] **6. Planilla:**
  - [x] Cálculo `Ingresos Sedes − Neto = Queda Empresa` visible como KPI.
  - [x] Días trabajados separados por tipo (Normal/Tarde/FdS/Feriado) en columnas + tfoot con totales.
  - [x] Eliminar Sueldo Base (ya es suma de días).
- [x] **7. Eventos:**
  - [x] Checkbox para mostrar feriados oficiales de Perú + agregados.
  - [x] **ELIMINAR** KPIs de totales. Reemplazado por card "Próximo evento".
  - [x] SVG cumpleaños = Torta. Cada tipo de evento usa su SVG (`cake`, `calendar`, `sedes`).
  - [x] Dropdowns Mes/Año.
- [x] **8. Reportes:**
  - [x] Rediseño visual completo (LineChart con áreas, HBars, ingresos por sede, exportar).
  - [x] **ELIMINAR** cards superiores. Solo selector de año + tarjetas analíticas.
  - [x] Estética de gráficos mejorada (gradientes, gridlines, leyenda, etiquetas DM Mono).
- [x] **9. Accesos:**
  - [x] Asignar rol temporal con duración (1h/4h/12h/1d/7d/custom).
  - [x] **Caducidad real**: al crear se aplica `rolOtorgado` al worker; al expirar/revocar se restaura `rolOriginal` (ticker cada 30s en `DataProvider`).
  - [x] Tabla de activos con tiempo restante y opción "Revocar".
  - [x] Audit log con histórico completo.
  - [x] **Impersonar / "Ver como"** desde la tabla de Usuarios (cambia la sesión activa y redirige según el rol).

### 👷 VISTA TRABAJADOR

- [x] **1. Asistencia:**
  - [x] Subpanel Multiverse exacto para que el trabajador cuadre ingresos.
  - [x] Subpanel de vista general (historial mensual).
- [x] **2. Mi Sueldo:** Desglose dinámico por tipo de día, tarifas, adelantos y detalle por día.
- [x] **3. Mis Adelantos:** Solicitud, filtros por estado, KPIs y descuento del mes.
- [x] **4. Mis Permisos:** Solicitud por tipo (personal/médico/vacaciones) con filtros y badges.
- [x] **5. Mis Alertas:** Notificaciones agregadas (solicitudes, tardanzas, eventos próximos).

### ⚙️ GENERAL (Reglas Transversales)

- [x] Todo perfectamente cuadrado, centrado, bien diseñado. (`page-main` centrado con `max-width: 1440px` ≥2xl, paddings escalados por breakpoint, doble candado anti-overflow horizontal.)
- [x] **Regla de Sueldo:** Nadie gana sueldo base, todo es cálculo diario por tipo de día / manual override.
- [x] **Sidebar/Menú:** Línea divisora y botón SVG "Cerrar sesión" debajo del email/sede (admin y trabajador).
- [x] **Mi Perfil (acceso global):** En todas las sesiones (Owner, Encargado, Trabajador) y en ambas vistas (sidebar PC + bottom-nav móvil), justo **arriba de "Cerrar sesión"** debe haber un acceso "Mi perfil" que abra una vista editable del usuario activo (foto, **Nombres + Apellidos** en columnas, apodo, email, teléfono, DNI, contraseña). Los cambios se reflejan en el `DataProvider` y se ven en toda la app.
- [x] **Cerrar sesión robusto:** Los bottom-navs (admin y worker) usan `useSession().signOut`. El `SessionProvider` ya **no auto-selecciona** al primer owner cuando no hay sesión: si el usuario está dentro de un panel privado sin sesión, se redirige inmediatamente a `/login`, evitando el "auto-login" tras cerrar sesión.
- [x] **Inicio siempre desloggeado + Recuérdame:** Al montar `/login` se limpia la sesión efectiva (sessionStorage + localStorage), garantizando que cada visita al login parta sin sesión activa para permitir entrar como otra persona. El formulario incluye un checkbox **"Recuérdame en este dispositivo"** (default ON):
  - **ON** → la sesión va a `localStorage` y persiste tras cerrar el navegador. El email queda guardado en `tramys_remember_email` para autorrellenar.
  - **OFF** → la sesión va a `sessionStorage` (muere al cerrar la pestaña) y se limpia el email recordado.
  - `SessionProvider` lee primero `sessionStorage` y cae a `localStorage`; `signOut` borra ambos. El switch a impersonación (`switchTo`) respeta el storage activo, así "Ver como" no fuerza persistencia indeseada.
- [x] **Demos sincronizados:** Las cards del login ahora escriben `tramys_session_id` con el `workerId` correspondiente del seed (`w_du`, `w_rp`, `w_at`) y redirigen al panel correcto. Cada card abre exactamente la sesión del rol declarado.
- [x] **Volver de "Ver como":** El `SessionProvider` guarda la sesión real en `tramys_session_real_id` al impersonar y expone `restoreSession()` + `isImpersonating`. Un componente `<ImpersonationBanner/>` aparece en lo alto del layout admin/worker con un botón "Volver a mi sesión".
- [x] **Encargado con scope de sede (modo demo):** `dashboard`, `trabajadores`, `asistencia` y `adelantos` filtran su universo a la sede asignada cuando el actor es `rol === "encargado"`. En modo Supabase, las RLS policies (`is_encargado() and sede_id = current_sede()`) hacen el mismo filtrado en el servidor.
- [x] **Interconexión total:** Owner / Encargado / Trabajador comparten el mismo `DataProvider` + `SessionProvider`. Cualquier cambio (perfil, asistencia, adelanto, permiso, tarifa, sede, acceso temporal) impacta inmediatamente a las demás vistas. Sin estado paralelo por rol.
- [x] **Preloader saluda con Apodo o Nombre, nunca con email.** El login fetchea `nombre` + `apodo` desde `profiles`; el `Preloader` prefiere `apodo` y cae al primer nombre como fallback.
- [x] **Preloader:** Bienvenida al iniciar sesión con Nombre o Apodo.
- [x] **Funcionalidad:** Owner / Encargado / Trabajador conectados al `DataProvider` y al `SessionProvider`. El "Marcar" del trabajador escribe en el store. La impersonación desde Accesos cambia la sesión y redirige al panel correspondiente. Los accesos temporales aplican y restauran el rol automáticamente.
- [x] **Transiciones y Skeletons:** Fade-in global implementado y `HydrationGate` aplicado en ambos layouts (admin/trabajador) — muestra `SkeletonStats` + `SkeletonCard` + `SkeletonTable` mientras `DataProvider.ready` y `SessionProvider.ready` no estén listos.

---

## 🔁 10. Multi-sede por día + Calendarios cross-vista — IMPLEMENTADO

### 10.1 Modelo: la sede y el horario son del registro de asistencia, no del worker — [x]
- **Razón:** un trabajador puede asistir un día en su sede de planta y otro día en una sede distinta, con horarios distintos. `Worker.sedeId` y `Worker.turno` representan lo "habitual"; cambiarlos por día rompe planilla histórica y reportes. El día concreto vive en `AsistenciaRec`.
- **Cambios en `AsistenciaRec`** (`src/components/providers/DataProvider.tsx`):
  ```ts
  sedeIdDia?:    string;  // override de worker.sedeId para ese día
  turnoEntrada?: string;  // override de worker.turno.entrada
  turnoSalida?:  string;  // override de worker.turno.salida
  ```
- **Helpers** (en el mismo archivo, con los demás derivados):
  - `sedeDelDia(rec, worker)` → `rec.sedeIdDia ?? worker.sedeId`.
  - `turnoDelDia(rec, worker)` → `{ entrada, salida }` con fallback al turno del worker.
- **Mappers Supabase** (`src/lib/data/mappers.ts`): añadir `sede_id_dia`, `turno_entrada` (override), `turno_salida` (override) a `rowToAsistencia` / `asistenciaToRow`.
- **Schema**: la columna `sede_id_dia` + `turno_entrada` / `turno_salida` (override) ya viven en `public.asistencia` — ver [`docs/supabase-schema.sql`](docs/supabase-schema.sql).

### 10.2 UI: editar/agregar registros desde la vista Asistencia (admin/encargado) — [x]
- Hoy `(admin)/asistencia/page.tsx` solo muestra los registros existentes, no permite **agregar** un día nuevo ni editar libremente. Hace falta:
  - **Agregar** un registro en cualquier celda vacía (worker × fecha): abrir modal con estado por defecto `presente` y entrada/salida = turno del worker.
  - **Editar** registros existentes con el modal actual + nuevos campos:
    - **Sede del día** (dropdown con sedes activas, default = `worker.sedeId`).
    - **Horario esperado entrada / salida** (inputs prepopulados con `worker.turno`, modificables).
  - Indicador visual cuando `sedeIdDia && sedeIdDia !== worker.sedeId`: badge `🔁 Visita: <Sede>` en la fila.

### 10.3 Encargado: scope con sede del día (no solo sede del worker) — [x]
- El filtro actual `w.sedeId === sedeActor.id` se queda corto: si Ana es de Santa Anita pero hoy fue prestada a Lima, el encargado de Lima debería verla en su panel ese día y el de Santa Anita debería seguir viéndola en su lista habitual.
- Regla a aplicar en `(admin)/asistencia` y vistas relacionadas: un encargado ve un registro si **`worker.sedeId === sedeActor.id`** O **`sedeDelDia(rec, worker) === sedeActor.id`**.

### 10.4 Planilla: link "Ver en calendario" por trabajador — [x]
- En el desglose por persona de `(admin)/planilla/page.tsx`, junto al nombre, agregar botón **"Ver en calendario"** que abra `/trabajadores?perfil=<workerId>&tab=asistencia` (la misma vista de perfil con el sub-panel Multiverse + historial). Reusa lo existente; no se duplica componente.
- Alternativa: si el desglose es modal, abrir un sub-modal con `<MultiverseCalendar>` filtrado al worker.

### 10.5 Vista trabajador: calendario propio en `mi-asistencia` — [x]
- Hoy el trabajador ve el cuadre/multiverse. Añadir **debajo** un calendario mensual (reusar `MultiverseCalendar` o `CalendarMultiView`) que pinte cada día con el estado real (presente/tardanza/ausente/permiso/feriado) + sede del día como chip pequeño. Click sobre un día abre **modal de detalle de solo lectura** (sin permitir editar — el trabajador no edita su propio registro).

### 10.6 Interconexión obligatoria — [x]
- Lo que el admin agrega/edita en `(admin)/asistencia` se ve inmediatamente en:
  - El perfil del trabajador (`/trabajadores → perfil → asistencia`).
  - El calendario de `mi-asistencia` del trabajador afectado.
  - El cuadre de planilla (totales, días por tipo, ingreso del mes).
  - El dashboard del owner / encargado correspondiente.
- Esto ya está garantizado por el `DataProvider` único + Realtime en modo Supabase.

## 🐘 6. Esquema Supabase

> **Fuente única ejecutable:** [`docs/supabase-schema.sql`](docs/supabase-schema.sql) — script idempotente, pegar tal cual en Project → SQL Editor → New query → Run. Esta sección documenta el **modelo** (qué hay y por qué); el SQL crudo vive **solo** en el `.sql` para evitar divergencia.

### 6.1 Qué incluye el script

- **Extensiones:** `pgcrypto`, `uuid-ossp`, `pg_cron` (para expiración de accesos).
- **Enums:** `rol_usuario` (owner/encargado/trabajador), `estado_asist`, `estado_solicitud`, `tipo_permiso`, `tipo_evento`, `tipo_movimiento` (ingreso/gasto-personal/gasto-fijo/gasto-manual), `categoria_fijo` (luz/agua/internet/local/otro).
- **Tablas:** `sedes`, `profiles` (1:1 con `auth.users`), `asistencia` (con `sede_id_dia` + `turno_*` para multi-sede por día), `adelantos`, `permisos`, `eventos`, `jaladores`, `ingresos_jaladores`, `accesos_temporales`, `movimientos_caja` (line items por sede — reemplaza al `caja_*` agregado), `ajustes` (singleton), `cuadres_personales` (sandbox del trabajador, RLS solo dueño), `pagos_planilla` (registro de pagos efectivamente realizados).
- **Trigger genérico `set_updated_at`** aplicado a todas las tablas con esa columna.
- **Trigger `on_auth_user_created`** que crea fila en `profiles` automáticamente al registrar un usuario en `auth.users`.
- **Helpers RLS:** `current_rol()`, `is_owner()`, `is_encargado()`, `current_sede()`.
- **Políticas RLS:** ver tabla resumen en §6.3.
- **Storage opcional:** bucket `avatars` con políticas (alternativa al `profiles.avatar_base64`).
- **Sin seed:** el script no inserta sedes ni usuarios — el primer owner se crea registrándose en Auth y promoviendo con `update profiles set rol='owner' where id='<uuid>';`. El resto se crea desde la UI.
- **`pg_cron` job `tramys_expirar_accesos`:** corre cada minuto `expirar_accesos_temporales()` (restaura `rol_original` y borra accesos vencidos).

### 6.2 Reglas de modelado críticas

- **No hay sueldo base.** Las tarifas viven en `profiles`: `tarifa_normal`, `tarifa_tardanza`, `tarifa_finsem`, `tarifa_feriado`. El sueldo se calcula como `Σ(asistencia × tarifa del día) + override_ingreso`.
- **Multi-sede por día.** `profiles.sede_id` es la sede "habitual"; el día concreto vive en `asistencia.sede_id_dia` (override, nullable → cae al de profiles). Mismo patrón con `turno_entrada` / `turno_salida` por día.
- **Caja por sede.** Los antiguos `caja_dia/semana/mes` de `sedes` ya **no existen** — la caja se calcula como agregado de `movimientos_caja` filtrando por `sede_id` y rango de `fecha`. Tipos: `ingreso` · `gasto-personal` (extras al sueldo automático) · `gasto-fijo` (subcategoría `luz`/`agua`/`internet`/`local`/`otro`) · `gasto-manual`.
- **`accesos_temporales`.** El cliente escribe `rol_original` con el rol vigente del worker, aplica `rol_otorgado` en `profiles.rol`, y al expirar (cron / acción manual) restaura `rol_original`. Backstop en backend: `pg_cron` cada minuto.
- **Singleton `ajustes`.** Una sola fila (`id = 1`), `check constraint` lo enforce. `mostrar_feriados_oficiales` es la única bandera global por ahora.
- **`cuadres_personales` es sandbox privado.** Solo el propio worker lee y escribe sus filas (RLS `cp_self` con `worker_id = auth.uid()`). El owner **no puede leer** estos registros — es deliberado, son anotaciones personales del trabajador para comparar contra lo oficial.
- **`pagos_planilla` registra los pagos efectivamente realizados** (no calculados). Lleva `desde_iso`/`hasta_iso` (rango cubierto), `fecha_pago`, `monto_neto`, `metodo_pago` (efectivo/yape/transferencia), `periodo` opcional (quincenal/mensual). Owner y encargado escriben; el trabajador solo lee los suyos.

### 6.3 Reglas RLS resumidas

| Tabla | Owner | Encargado | Trabajador |
|---|---|---|---|
| `sedes` | RW | R | R |
| `profiles` | RW todo | R (workers de su sede) + RW (sí mismo) | R + RW (sí mismo) |
| `asistencia` | RW todo | RW (workers de su sede o `sede_id_dia` = su sede) | RW (suya) |
| `adelantos` / `permisos` | RW todo | RW todo | R + INSERT (suya) |
| `eventos` | RW | RW | R |
| `jaladores` / `ingresos_jaladores` | RW | RW | R |
| `accesos_temporales` | RW | R | R (suyos) |
| `movimientos_caja` | RW todo | RW (solo su sede vía `sede_id = current_sede()`) | — |
| `ajustes` | RW | R | R |
| `cuadres_personales` | — | — | RW (solo suyos, sandbox privado — ni el owner los lee) |
| `pagos_planilla` | RW todo | RW (workers de su sede) | R (suyos) |

### 6.4 Setup del primer owner

Después de correr el `.sql` y registrar el primer usuario por Supabase Auth:

```sql
update public.profiles set rol = 'owner' where id = '<uuid-del-user>';
```

### 6.5 Toggle de backend (env vars)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_USE_SUPABASE=true   # activa providers Supabase + Realtime
```

- Sin la flag (o `false`), la app funciona en modo demo contra `localStorage` (providers locales originales).
- Con `true`, se activan `DataProviderSupabase` + `SessionProviderSupabase`, suscripciones Realtime en todo `public` y sync con Supabase Auth + Storage.

---

## 🛠️ 7. Fases de migración a Supabase (E1–E4)

- [x] **E1 Adapter & Providers conectados** — `src/lib/data/mappers.ts`, `DataProviderSupabase`, `SessionProviderSupabase`, wrapper `Providers` que conmuta por `NEXT_PUBLIC_USE_SUPABASE`. Los pages siguen usando `useData()` / `useSession()` sin cambios.
- [x] **E2 Realtime** — `DataProviderSupabase` se suscribe a `postgres_changes` en todo el schema `public` y refresca el estado para mantener la interconexión Owner / Encargado / Trabajador.
- [x] **E3 Caducidad backend** — Función `expirar_accesos_temporales()` programada con `pg_cron` cada minuto. El ticker del cliente queda como defensa-en-profundidad.
- [x] **E4 Storage de avatares** — Helper `src/lib/storage/avatars.ts` con `subirAvatar`/`eliminarAvatar`. `MiPerfilModal` sube la foto al bucket `avatars/<uid>/avatar.png` y guarda la URL pública. Email y contraseña se sincronizan vía `supabase.auth.updateUser` cuando el modo Supabase está activo.
