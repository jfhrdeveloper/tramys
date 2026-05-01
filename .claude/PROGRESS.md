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
- [x] **6. Mis Eventos:** Calendario mensual de eventos (cumpleaños, feriados oficiales y de empresa) con filtros, tarjeta de "Próximo evento" y modal de detalle de solo lectura.

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

## 🆕 5b. Iteración: UX, exportaciones, vacaciones y calendarios responsive

### 🎁 Eventos para trabajador
- [x] Nueva ruta `(worker)/mis-eventos` con calendario mensual + filtros (Todos / Cumpleaños / Feriados), card "Próximo evento" y modal de detalle de solo lectura. Incluye los feriados oficiales sintetizados desde `peruHolidays`.
- [x] Sidebar y bottom-nav del worker: "Eventos" con icono `calendar`.
- [x] Bloque "Agenda del mes" (lista cronológica sutil) en `(admin)/eventos` y `(worker)/mis-eventos` — filas con día/wkd, dot del tipo, nombre, etiqueta y badge HOY; click selecciona el día / abre detalle.

### 💸 Iconografía consistente
- [x] Icono unificado `adelantos` (antes `hand_coin` en worker). Aplicado en `SidebarWorker`, `BottomNavWorker`, `(worker)/mis-adelantos`, `(worker)/mis-alertas` y dashboard owner.

### 📊 Reportes — exportaciones reales
- [x] `(admin)/reportes` rediseñado: removidos LineChart/HBars y gráficos. Se prioriza la **exportación**.
- [x] **Filtros**: Año + Mes (o "Todo el año") + Sede (o "Todas").
- [x] **KPIs** del periodo: Asistencias / Ausencias / Bruto planilla / Adelantos aprobados / Ingreso jaladores.
- [x] **12 exportaciones reales** organizadas en 5 grupos, todas con descarga (CSV con BOM UTF-8 para Excel, o JSON):
  - Operaciones: Planilla resumida · Asistencia detallada · Sueldo por día · Resumen mensual del año.
  - Solicitudes: Adelantos · Permisos · Eventos.
  - Comerciales: Comisiones jaladores.
  - Maestros: Trabajadores (perfil + tarifas + turno) · Sedes (contacto + caja).
  - Auditoría: Accesos temporales · Snapshot completo (JSON).
- [x] Helpers `csvEscape`, `buildCSV`, `downloadBlob`, `downloadCSV`, `downloadJSON` y nombres de archivo con sufijo automático (`planilla_2026-04_Santa-Anita.csv`).

### 📅 Calendarios responsive (cross-vista)
- [x] Clases utilitarias en `globals.css`: `.cal-grid`, `.cal-cell`, `.cal-day-num`, `.cal-chip`, `.cal-btn`, `.cal-btn-label`, `.cal-tag-mini` con 4 breakpoints (≥768, ≤767, ≤540, ≤380).
- [x] En **móvil ≤540px**: solo iconos en botones del Multiverse (texto oculto), chips de estado/eventos colapsan a barrita de color (sin texto), etiquetas FDS/FER/sede ocultas, SVG dentro de chips ocultos para no romper la altura. Día y dot siempre visibles.
- [x] Aplicado a: `MultiverseCalendar`, `CalendarEvents`, `CalendarMultiView` (vista Mes), `(admin)/asistencia`, `(admin)/eventos`, `(worker)/mi-asistencia` (Cuadrar + Calendario), `(worker)/mis-eventos`.
- [x] **Cuadrar días en tablet:** nueva clase `.grid-2-lg` que mantiene 1 columna hasta `1023px` y solo abre 2 columnas a partir de laptop. Aplicada al panel "Cuadrar días" de `(worker)/mi-asistencia`.
- [x] **Día actual no se corta:** la franja de color del estado en el calendario worker pasa de `borderLeft` a `<span position:absolute>`, conservando el borde naranja del "hoy" continuo y permitiendo `flexShrink: 0` en el día.

### 🌓 Tema persistente entre login y panel
- [x] `login/page.tsx` ahora usa la **misma clave** `tramys-theme` que `ThemeProvider` y respeta `prefers-color-scheme` cuando no hay preferencia guardada.
- [x] Aplica/persiste en `localStorage` solo cuando el usuario toca el toggle manualmente. Listener del sistema solo activo si `themeUserSet === false`.
- [x] Sin flash en login gracias al `NO_FLASH_SCRIPT` ya en `<head>` del root layout.

### 💰 Override manual visible en todas las vistas
- [x] **Admin → Asistencia → modal de edición:** checkbox "Override manual del ingreso del día" + input numérico, se guarda como `overrideIngreso` (antes solo existía en Trabajadores → perfil).
- [x] **Worker → Mi Asistencia:** modal detalle muestra bloque "Ingreso ajustado por encargado" con monto destacado; celda del calendario lleva badge `S/` rojo cuando hay override.
- [x] **Worker → Mi Sueldo:** tabla de detalle marca el día con tipo "Ajustado" + icono `edit` + badge `MANUAL` junto al monto. Bloque "Ajustes manuales del encargado" con color brand.
- [x] **Admin → Trabajadores → perfil:**
  - `getDayData` devuelve `override` y `vacaciones`; `MultiverseCalendar` los renderiza como badges en la cabecera del día.
  - Historial reciente: nueva columna **"Ingreso"** + badge `MANUAL` cuando hay override.
  - Tab Sueldo: bloque "Ajustes manuales" sobre el "Neto a pagar".

### 🏖️ Vacaciones (sub-tipo de permiso)
- [x] `Permiso` extendido con `desde`, `hasta` y `pagado` (todos opcionales; `fecha` queda como compat).
- [x] `addPermiso` / `updatePermiso` "smart": al pasar a `aprobado`, automáticamente itera el rango `desde..hasta` y crea/actualiza registros de `asistencia` con `estado: "permiso"`, `overrideIngreso = tarifa correspondiente` si `pagado: true` (feriado / fin de semana / día normal) o `null` si no se paga, y `motivoEdit` con etiqueta tipo "Vacaciones (pagado)" o "Vacaciones".
- [x] Helper exportado `diasDePermiso(p): string[]` para iterar rangos desde otras vistas.
- [x] **Worker → mis-permisos:** modal con campos **Desde / Hasta**, contador de días, aviso amigable de antelación recomendada (no bloqueante: 7 días para vacaciones, 2 para personal). Lista muestra rango y badge `PAGADO / SIN PAGO` cuando está aprobado.
- [x] **Admin → Trabajadores → tab Permisos:** ModalPermiso con rango Desde/Hasta + checkbox "Se paga estos días". Lista muestra rango + número de días + badge PAGADO/SIN PAGO. Botones de aprobación: **"Aprobar sin pago"** (default) y **"Aprobar pagado"** (verde).
- [x] **Color cyan distintivo para vacaciones:** `VACACIONES_COLOR` en `lib/constants/estados.ts` + helpers `esVacaciones(rec)` y `estiloEstado(rec)`. Detecta el caso por `motivoEdit` que arranca con "Vacaciones".
- [x] Vacaciones se ven distinto en: calendario admin asistencia (chip cyan), tabla detalle (badge `VAC`), perfil trabajador → Multiverse + historial (badge `VAC`), worker → Mi Asistencia (chip cyan + label "Vacaciones" + badge `VACACIONES` en modal), leyenda del calendario.
- [x] El **estado en el modelo sigue siendo `permiso`** — no rompe planilla, sueldo ni los CSV existentes.

### 📱 Topbar worker rediseñado
- [x] Reloj **a la izquierda** (fecha + hora siempre visibles).
- [x] Tres controles **a la derecha** en orden: **Marcar asistencia → Notificaciones (bell) → Switch día/noche**.
- [x] Botón notificaciones **idéntico al del owner** (38×38, fondo transparente, dot rojo discreto cuando hay alertas, link a `/mis-alertas`). Contador derivado: pendientes de adelantos + permisos del propio worker.
- [x] Hero del worker (`mi-panel`): badge "HOY" cambia de bloque vertical (`HOY` arriba, fecha abajo) a **pill horizontal** `HOY · 28 abr 2026`, con flexShrink y nowrap para que nunca rompa.

### 📐 Móvil: botones de acción dentro de filtros
- [x] `(admin)/asistencia` y `(admin)/eventos`: el botón "Añadir registro" / "Agregar" se mueve **abajo del card de filtros** en móvil (`show-mobile`, ancho completo, `minHeight: 44`), evitando el wrap roto del header. En desktop se mantiene su posición original (`hide-mobile`).
- [x] Nueva utilidad CSS `.show-mobile` complementaria de `.hide-mobile`.

### 📅 Formato canónico de fechas: día → mes → año
- [x] `formatFecha` central en `lib/utils/formatters.ts` ahora devuelve `28 abr 2026`. Nuevo `formatFechaLarga` opcional con weekday.
- [x] Aplicado en: dashboard admin, eventos (admin y worker), trabajadores (fecha de ingreso, historial reciente, adelantos, rango de permisos), adelantos (modal, lista, tabla), jaladores (tabla ingresos), mi-sueldo (adelantos del mes, tabla días), mis-adelantos (worker), mis-permisos (rango), mi-asistencia (historial), `(admin)/asistencia` (header "Detalle de").
- [x] `useClock` se mantiene intacto (formato actual del topbar OK).
- [x] Hero del worker: pill HOY con `dd mmm yyyy`.

### 💰 Caja por sede: line items con MovimientoCaja
- [x] **Modelo:** `Sede` ya no almacena `cajaDia/cajaSemana/cajaMes`. Los movimientos viven en `MovimientoCaja` (line items con `fecha`, `tipo: ingreso | gasto-personal | gasto-fijo | gasto-manual`, `categoria` para gastos fijos: `luz/agua/internet/local/otro`, opcional `cantidad × unitario` para ingresos).
- [x] **Helper `agregadoCaja(state, sedeId, desdeISO, hastaISO)`** en `DataProvider` calcula totales (ingresos / gastoPersonal / gastoFijo / gastoManual) y devuelve los movimientos del rango. Reemplaza el estado pre-calculado por agregación en lectura.
- [x] **`(admin)/sedes`** rediseñada: bloque de Caja con 4 tarjetas (Ingresos / Personal / Fijos / Manuales) + Neta calculada en vivo, lista de movimientos con filtros por tipo, modal "Registrar movimiento" (auto-cálculo `cantidad × unitario` para ingresos, categoría visible solo para gasto-fijo).
- [x] **Encargado**: `/sedes` accesible (no solo owner). La página fuerza el detalle de su sede asignada y oculta el botón de "Editar sede" (datos maestros siguen siendo solo del owner). RLS de `movimientos_caja` (owner: todo, encargado: solo `sede_id = current_sede()`) lo refuerza en Supabase.
- [x] **Sidebar/BottomNav**: encargado ve "Mi sede" como navegación principal hacia `/sedes`.
- [x] **Migración cross-vista**: `(admin)/planilla` (`Queda empresa = Σ ingresos del mes − Neto`) y `(admin)/reportes` (export Sedes con totales día/sem/mes desde `agregadoCaja`, nuevo export "Movimientos caja", snapshot incluye `movimientosCaja`) ya consumen el nuevo modelo. `/middleware.ts` saca `/sedes` de owner-only.
- [x] **Supabase**: `movimientos_caja` + RLS scoped por sede + tipos `tipo_movimiento` y `categoria_fijo` documentados en `totalproject.md` §6.2 / §6.6. `Sede` ya no tiene caja_* (drop columns). Mappers `rowToMovimientoCaja` / `movimientoCajaToRow` y handlers `addMovimientoCaja` / `update` / `delete` integrados en `DataProviderSupabase`.

---

## 🆕 5c. Iteración: panel "Mis gastos", periodo Quincenal y jaladores en cuadre

### 💸 Nueva ruta `/mis-gastos` (owner + encargado)
- [x] **Componente reutilizable** `src/components/sedes/PanelMisGastos.tsx` — muestra solo gastos de una sede (sin ingresos), con cuadre Ganancias − Gastos = Balance, breakdown por subtipo (Personal/Fijo/Manual), filtros chip y tabla paginada con editar/eliminar.
- [x] **Página** `src/app/(admin)/mis-gastos/page.tsx`:
  - Owner: chips para alternar entre sedes activas; encargado: bloqueado a su sede asignada (mensaje guía si no tiene).
  - Toggle de periodo y panel renderizado a partir de la sede seleccionada.
- [x] **Sidebar** (`Sidebar.tsx`): nueva entrada **"Mis gastos"** con icono `money_bill` en `NAV_OWNER` y `NAV_ENC` (entre Adelantos y Eventos).
- [x] **BottomNav** (`BottomNav.tsx`): mismo ítem en `NAV_OWNER_MORE` y `NAV_ENC_MORE` (bottom-sheet "Más" en móvil).
- [x] **Middleware** (`src/middleware.ts`): `/mis-gastos` añadida a `rutasAdmin` (no entra en `rutasSoloOwner`, así que el encargado también accede).

### 🧾 `ModalMovimiento` extraído y con modos
- [x] Modal extraído de `(admin)/sedes/page.tsx` a **`src/components/sedes/ModalMovimiento.tsx`** (deduplica ~160 líneas; reutilizado por `/sedes` y `PanelMisGastos`).
- [x] Nueva prop **`modo`**: `"todos"` (default, `/sedes`), `"gastos"` (solo Personal/Fijo/Manual), `"ingresos"` (solo Ingreso, oculta el selector). Título dinámico: "Registrar gasto" / "Registrar ganancia" / "Registrar movimiento".
- [x] Nueva prop **`tipoInicial`** para preseleccionar el tipo al crear (ej. `gasto-personal` desde el botón rojo de "Mis gastos").
- [x] Etiquetas más limpias dentro del selector: **Personal · Fijo · Manual** (antes "Gasto personal", "Consumo fijo", "Gasto manual"), con subtítulo descriptivo (`Luz, agua, internet, local`, etc.). Al editar, el modo se queda en `"todos"` por si se cambia el subtipo.

### 🪙 Periodo Quincenal centralizado
- [x] Nuevo util **`src/lib/utils/periodos.ts`** con `Periodo = "diario" | "semanal" | "quincenal" | "mensual"`, `PERIODOS`, `PERIODO_LABEL` y `rangoPeriodo(periodo)`. Lógica de quincenal: si hoy ≤ 15 → desde día 1; si hoy ≥ 16 → desde día 16, siempre hasta hoy.
- [x] Adoptado en `(admin)/sedes` (toggle del cuadre de caja), `(admin)/jaladores` (Cuadre de caja, antes solo semanal/mensual; ahora también diario y quincenal), `(admin)/mis-gastos` y `PanelMisGastos`. Eliminadas todas las `rangoPeriodo` locales — todos los toggles consumen el util.

### 💰 Ingresos de jaladores como parte del cuadre por sede
- [x] Nuevo helper **`ingresosJaladoresEnRango(state, sedeId, desde, hasta) → { total, items }`** en `DataProvider.tsx`: cruza `ingresosJaladores` con `jaladores` por sede.
- [x] **`CajaBlock` de `(admin)/sedes`**: la card "Ingresos" ahora suma `MovimientoCaja[ingreso] + ingresos de jaladores`. Cuando hay aporte de jaladores se muestra el breakdown `caja S/. X · jaladores S/. Y`. La ganancia neta y el margen recalculan con el total combinado.
- [x] **`PanelMisGastos`**: cuadre superior **Ganancias − Gastos = Balance** que también incluye los ingresos de jaladores en "Ganancias" (con mismo breakdown si aplica).

### 📝 Registro de ganancias/gastos desde "Mis gastos"
- [x] Dos botones en el header del panel (y mobile): **"Registrar ganancia"** (verde, abre el modal con `modo="ingresos"`) y **"Registrar gasto"** (rojo, `modo="gastos"`).
- [x] Botones **editar / eliminar** por fila en la tabla de gastos.

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
- **SQL §6.2** — extender `public.asistencia`:
  ```sql
  alter table public.asistencia
    add column if not exists sede_id_dia    uuid references public.sedes(id) on delete set null,
    add column if not exists turno_entrada  text,
    add column if not exists turno_salida   text;
  create index if not exists idx_asist_sede_dia on public.asistencia(sede_id_dia);
  ```

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

## 🐘 6. Esquema Supabase (pegar en SQL Editor)

> Script idempotente. Crea extensiones, enums, tablas, índices, trigger de `updated_at`, RLS y políticas. Está pensado para correr **una sola vez** en un proyecto nuevo. Re-ejecutarlo no rompe datos: usa `IF NOT EXISTS` y `CREATE OR REPLACE` donde aplica.

### 6.1 Tabla `profiles` + bucket `avatars` (auth + foto de perfil)

```sql
/* ============================================================
   TRAMYS — Esquema Supabase completo
   Pegar tal cual en Project → SQL Editor → New query → Run
   ============================================================ */

/* ====== Extensiones ====== */
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

/* ====== Enums ====== */
do $$ begin
  create type rol_usuario as enum ('owner', 'encargado', 'trabajador');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_asist as enum ('presente', 'tardanza', 'ausente', 'permiso', 'feriado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_solicitud as enum ('pendiente', 'aprobado', 'rechazado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_permiso as enum ('personal', 'medico', 'vacaciones');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_evento as enum ('cumpleanos', 'feriado-nacional', 'feriado-empresa', 'otro');
exception when duplicate_object then null; end $$;

/* ====== Trigger genérico updated_at ====== */
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
```

### 6.2 Tablas operativas

```sql
/* ============================================================
   SEDES
   ============================================================ */
create table if not exists public.sedes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  color           text not null default '#C41A3A',
  direccion       text default '',
  telefono        text default '',
  horario         text default '',
  encargado_id    uuid,
  activa          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_sedes_activa on public.sedes(activa);
/* Limpia campos legacy si la tabla ya existía. La caja vive en movimientos_caja. */
alter table public.sedes drop column if exists caja_dia;
alter table public.sedes drop column if exists caja_semana;
alter table public.sedes drop column if exists caja_mes;

/* ============================================================
   PROFILES (1:1 con auth.users) — incluye perfil editable
   ============================================================ */
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text not null default '',
  apodo           text default '',
  avatar_base64   text,
  rol             rol_usuario not null default 'trabajador',
  sede_id         uuid references public.sedes(id) on delete set null,
  cargo           text default '',
  turno_entrada   text default '08:00',
  turno_salida    text default '18:00',
  tarifa_normal   numeric(10,2) not null default 0,
  tarifa_tardanza numeric(10,2) not null default 0,
  tarifa_finsem   numeric(10,2) not null default 0,
  tarifa_feriado  numeric(10,2) not null default 0,
  fecha_ingreso   date not null default current_date,
  email           text,
  dni             text,
  telefono        text,
  activo          boolean not null default true,
  rol_original    rol_usuario,            /* para accesos temporales */
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_profiles_sede   on public.profiles(sede_id);
create index if not exists idx_profiles_rol    on public.profiles(rol);
create index if not exists idx_profiles_activo on public.profiles(activo);

/* FK diferida sedes.encargado_id → profiles(id) */
alter table public.sedes
  drop constraint if exists fk_sedes_encargado,
  add  constraint fk_sedes_encargado
       foreign key (encargado_id) references public.profiles(id) on delete set null;

/* ============================================================
   ASISTENCIA
   ============================================================ */
create table if not exists public.asistencia (
  id                uuid primary key default gen_random_uuid(),
  worker_id         uuid not null references public.profiles(id) on delete cascade,
  fecha             date not null,
  entrada           text,
  salida            text,
  estado            estado_asist not null default 'presente',
  override_ingreso  numeric(10,2),
  motivo_edit       text,
  /* Multi-sede por día: si null, se usa profiles.sede_id (planta). */
  sede_id_dia       uuid references public.sedes(id) on delete set null,
  /* Horario esperado del día (override de profiles.turno_*). */
  turno_entrada     text,
  turno_salida      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (worker_id, fecha)
);
create index if not exists idx_asist_worker   on public.asistencia(worker_id);
create index if not exists idx_asist_fecha    on public.asistencia(fecha);
create index if not exists idx_asist_sede_dia on public.asistencia(sede_id_dia);

/* ============================================================
   ADELANTOS
   ============================================================ */
create table if not exists public.adelantos (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.profiles(id) on delete cascade,
  monto         numeric(10,2) not null,
  motivo        text default '',
  estado        estado_solicitud not null default 'pendiente',
  fecha         date not null default current_date,
  aprobado_por  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_adel_worker on public.adelantos(worker_id);
create index if not exists idx_adel_estado on public.adelantos(estado);

/* ============================================================
   PERMISOS
   ============================================================ */
create table if not exists public.permisos (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.profiles(id) on delete cascade,
  tipo          tipo_permiso not null,
  motivo        text default '',
  desde         date not null,
  hasta         date not null,
  estado        estado_solicitud not null default 'pendiente',
  aprobado_por  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_perm_worker on public.permisos(worker_id);
create index if not exists idx_perm_estado on public.permisos(estado);

/* ============================================================
   EVENTOS (cumpleaños, feriados empresa, otros)
   ============================================================ */
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        tipo_evento not null default 'otro',
  fecha       date not null,
  descripcion text default '',
  worker_id   uuid references public.profiles(id) on delete set null,
  sede_id     uuid references public.sedes(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_eventos_fecha on public.eventos(fecha);
create index if not exists idx_eventos_tipo  on public.eventos(tipo);

/* ============================================================
   JALADORES + INGRESOS (comisiones)
   ============================================================ */
create table if not exists public.jaladores (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  apodo                text default '',
  telefono             text default '',
  porcentaje_comision  numeric(5,2) not null default 10,
  sede_id              uuid references public.sedes(id) on delete set null,
  activo               boolean not null default true,
  fecha_ingreso        date not null default current_date,
  avatar_base64        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_jal_activo on public.jaladores(activo);

create table if not exists public.ingresos_jaladores (
  id          uuid primary key default gen_random_uuid(),
  jalador_id  uuid not null references public.jaladores(id) on delete cascade,
  fecha       date not null default current_date,
  monto       numeric(10,2) not null,
  nota        text default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_ij_jalador on public.ingresos_jaladores(jalador_id);
create index if not exists idx_ij_fecha   on public.ingresos_jaladores(fecha);

/* ============================================================
   ACCESOS TEMPORALES (impersonación con caducidad)
   ============================================================ */
create table if not exists public.accesos_temporales (
  id              uuid primary key default gen_random_uuid(),
  worker_id       uuid not null references public.profiles(id) on delete cascade,
  rol_otorgado    rol_usuario not null,
  rol_original    rol_usuario not null,
  motivo          text default '',
  desde           timestamptz not null default now(),
  hasta           timestamptz not null,
  creado_por      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_at_worker on public.accesos_temporales(worker_id);
create index if not exists idx_at_hasta  on public.accesos_temporales(hasta);

/* ============================================================
   MOVIMIENTOS DE CAJA (line items por sede)
   Reemplaza al agregado caja_* del modelo anterior. Permite
   distinguir ingresos, gasto-personal (sueldos extra al cálculo
   automático de planilla), gasto-fijo (luz/agua/internet/local…)
   y gasto-manual.
   ============================================================ */
do $$ begin
  create type tipo_movimiento as enum ('ingreso','gasto-personal','gasto-fijo','gasto-manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_fijo as enum ('luz','agua','internet','local','otro');
exception when duplicate_object then null; end $$;

create table if not exists public.movimientos_caja (
  id              uuid primary key default gen_random_uuid(),
  sede_id         uuid not null references public.sedes(id) on delete cascade,
  fecha           date not null,
  tipo            tipo_movimiento not null,
  monto           numeric(12,2) not null check (monto >= 0),
  cantidad        numeric(10,2),
  unitario        numeric(12,2),
  categoria       categoria_fijo,
  concepto        text not null default '',
  registrado_por  uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_mc_sede   on public.movimientos_caja(sede_id);
create index if not exists idx_mc_fecha  on public.movimientos_caja(fecha);
create index if not exists idx_mc_tipo   on public.movimientos_caja(tipo);

/* ============================================================
   AJUSTES GLOBALES (1 sola fila — singleton)
   ============================================================ */
create table if not exists public.ajustes (
  id                            int primary key default 1,
  mostrar_feriados_oficiales    boolean not null default true,
  updated_at                    timestamptz not null default now(),
  constraint ajustes_singleton check (id = 1)
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;
```

### 6.3 Triggers `updated_at`

```sql
do $$
declare t text;
begin
  foreach t in array array[
    'sedes','profiles','asistencia','adelantos','permisos',
    'eventos','jaladores','accesos_temporales','movimientos_caja','ajustes'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;
       create trigger trg_%1$s_updated
         before update on public.%1$s
         for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;
```

### 6.4 Auto-creación de `profiles` al registrar un usuario en `auth.users`

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 6.5 Helpers de RLS (rol del usuario actual)

```sql
create or replace function public.current_rol()
returns rol_usuario language sql stable as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_owner()
returns boolean language sql stable as $$
  select coalesce(public.current_rol() = 'owner', false);
$$;

create or replace function public.is_encargado()
returns boolean language sql stable as $$
  select coalesce(public.current_rol() = 'encargado', false);
$$;

create or replace function public.current_sede()
returns uuid language sql stable as $$
  select sede_id from public.profiles where id = auth.uid();
$$;
```

### 6.6 RLS — habilitar y crear políticas

```sql
/* Habilitar RLS en todas las tablas */
alter table public.sedes               enable row level security;
alter table public.profiles            enable row level security;
alter table public.asistencia          enable row level security;
alter table public.adelantos           enable row level security;
alter table public.permisos            enable row level security;
alter table public.eventos             enable row level security;
alter table public.jaladores           enable row level security;
alter table public.ingresos_jaladores  enable row level security;
alter table public.accesos_temporales  enable row level security;
alter table public.ajustes             enable row level security;

/* ====== SEDES ====== */
drop policy if exists sedes_read     on public.sedes;
drop policy if exists sedes_write    on public.sedes;
create policy sedes_read  on public.sedes for select using (auth.uid() is not null);
create policy sedes_write on public.sedes for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== PROFILES ====== */
drop policy if exists profiles_self        on public.profiles;
drop policy if exists profiles_read_team   on public.profiles;
drop policy if exists profiles_owner_all   on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self        on public.profiles for select using (id = auth.uid());
create policy profiles_read_team   on public.profiles for select using (
  public.is_owner()
  or (public.is_encargado() and sede_id = public.current_sede())
);
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_owner_all   on public.profiles for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== ASISTENCIA ====== */
drop policy if exists asist_self      on public.asistencia;
drop policy if exists asist_team_read on public.asistencia;
drop policy if exists asist_admin     on public.asistencia;
create policy asist_self      on public.asistencia for all
  using (worker_id = auth.uid()) with check (worker_id = auth.uid());
create policy asist_team_read on public.asistencia for select using (
  public.is_owner()
  or (public.is_encargado() and exists (
        select 1 from public.profiles p
        where p.id = asistencia.worker_id and p.sede_id = public.current_sede()))
);
create policy asist_admin     on public.asistencia for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== ADELANTOS ====== */
drop policy if exists adel_self  on public.adelantos;
drop policy if exists adel_admin on public.adelantos;
create policy adel_self  on public.adelantos for select using (worker_id = auth.uid());
create policy adel_self_insert on public.adelantos for insert
  with check (worker_id = auth.uid());
create policy adel_admin on public.adelantos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== PERMISOS ====== */
drop policy if exists perm_self  on public.permisos;
drop policy if exists perm_admin on public.permisos;
create policy perm_self  on public.permisos for select using (worker_id = auth.uid());
create policy perm_self_insert on public.permisos for insert
  with check (worker_id = auth.uid());
create policy perm_admin on public.permisos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== EVENTOS ====== */
drop policy if exists ev_read  on public.eventos;
drop policy if exists ev_write on public.eventos;
create policy ev_read  on public.eventos for select using (auth.uid() is not null);
create policy ev_write on public.eventos for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== JALADORES + INGRESOS ====== */
drop policy if exists jal_read   on public.jaladores;
drop policy if exists jal_write  on public.jaladores;
drop policy if exists ij_read    on public.ingresos_jaladores;
drop policy if exists ij_write   on public.ingresos_jaladores;
create policy jal_read  on public.jaladores for select using (auth.uid() is not null);
create policy jal_write on public.jaladores for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());
create policy ij_read   on public.ingresos_jaladores for select using (auth.uid() is not null);
create policy ij_write  on public.ingresos_jaladores for all
  using (public.is_owner() or public.is_encargado())
  with check (public.is_owner() or public.is_encargado());

/* ====== ACCESOS TEMPORALES ====== */
drop policy if exists at_read  on public.accesos_temporales;
drop policy if exists at_write on public.accesos_temporales;
create policy at_read  on public.accesos_temporales for select using (
  public.is_owner() or public.is_encargado() or worker_id = auth.uid()
);
create policy at_write on public.accesos_temporales for all
  using (public.is_owner()) with check (public.is_owner());

/* ====== MOVIMIENTOS DE CAJA ======
   Owner: todo. Encargado: solo movimientos de SU sede. Trabajador: nada. */
alter table public.movimientos_caja enable row level security;
drop policy if exists mc_owner_all  on public.movimientos_caja;
drop policy if exists mc_enc_read   on public.movimientos_caja;
drop policy if exists mc_enc_insert on public.movimientos_caja;
drop policy if exists mc_enc_update on public.movimientos_caja;
drop policy if exists mc_enc_delete on public.movimientos_caja;
create policy mc_owner_all on public.movimientos_caja for all
  using (public.is_owner()) with check (public.is_owner());
create policy mc_enc_read on public.movimientos_caja for select
  using (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_insert on public.movimientos_caja for insert
  with check (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_update on public.movimientos_caja for update
  using (public.is_encargado() and sede_id = public.current_sede())
  with check (public.is_encargado() and sede_id = public.current_sede());
create policy mc_enc_delete on public.movimientos_caja for delete
  using (public.is_encargado() and sede_id = public.current_sede());

/* ====== AJUSTES (solo owner edita; todos leen) ====== */
drop policy if exists aj_read  on public.ajustes;
drop policy if exists aj_write on public.ajustes;
create policy aj_read  on public.ajustes for select using (auth.uid() is not null);
create policy aj_write on public.ajustes for all
  using (public.is_owner()) with check (public.is_owner());
```

### 6.7 Storage para fotos (opcional — el modo demo usa base64)

```sql
/* Bucket público "avatars". Si prefieres mantener base64 en profiles.avatar_base64,
   puedes omitir esta sección entera. */
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read"   on storage.objects;
drop policy if exists "avatars_upload" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_read"   on storage.objects for select  using (bucket_id = 'avatars');
create policy "avatars_upload" on storage.objects for insert  with check (
  bucket_id = 'avatars' and auth.role() = 'authenticated'
);
create policy "avatars_update" on storage.objects for update  using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);
create policy "avatars_delete" on storage.objects for delete  using (
  bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid
);
```

### 6.8 Seed mínimo para empezar (opcional)

```sql
/* Inserta 2 sedes de ejemplo. Ajusta IDs/nombres según tu negocio. */
insert into public.sedes (nombre, color, direccion, telefono, horario)
values
  ('Santa Anita', '#C41A3A', 'Av. Los Eucaliptos 123', '+51 999 111 222', 'L-D 8:00-22:00'),
  ('Lima',        '#6366f1', 'Jr. de la Unión 456',    '+51 999 333 444', 'L-S 9:00-21:00')
on conflict do nothing;
```

### 6.9 Notas de aplicación

- **Crear el primer owner manualmente:** registra un usuario por Auth → ejecuta `update public.profiles set rol = 'owner' where id = '<uuid>';`.
- Las **tarifas viven en `profiles`** (no hay sueldo base): `tarifa_normal`, `tarifa_tardanza`, `tarifa_finsem`, `tarifa_feriado`.
- El campo `caja_*` en `sedes` está como `jsonb` para mantener la forma `{ ingresos, material }` que usa el `DataProvider`.
- `accesos_temporales`: el cliente debe escribir `rol_original` con el rol vigente del worker, aplicar `rol_otorgado` en `profiles.rol`, y al expirar (cron / acción manual) restaurar `rol_original`. La vista `Accesos` ya implementa este flujo en localStorage; al migrar a Supabase, replicar la misma lógica con un `update profiles set rol = at.rol_original ...`.
- Si decides **no usar el bucket `avatars`**, deja `profiles.avatar_base64` y guarda la imagen en base64 (igual que el modo demo actual).

### 6.10 Caducidad de accesos temporales en backend (pg_cron)

```sql
/* Requiere la extensión pg_cron habilitada en el proyecto Supabase
   (Database → Extensions → pg_cron). */
create extension if not exists pg_cron;

create or replace function public.expirar_accesos_temporales()
returns void language plpgsql security definer as $$
begin
  /* Restaura el rol original a todos los workers cuyo acceso ya venció */
  update public.profiles p
     set rol          = at.rol_original,
         rol_original = null
    from public.accesos_temporales at
   where at.worker_id = p.id
     and at.hasta    <= now();

  /* Elimina los accesos vencidos */
  delete from public.accesos_temporales where hasta <= now();
end $$;

/* Programa la ejecución cada minuto */
select cron.schedule(
  'tramys_expirar_accesos',
  '* * * * *',
  $$ select public.expirar_accesos_temporales(); $$
);
```

### 6.11 Toggle de backend en la app

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_USE_SUPABASE=true   # activa providers Supabase + Realtime
```

- Sin la flag (o `false`), la app funciona en modo demo con `localStorage` (los providers locales originales).
- Con `true`, se activan `DataProviderSupabase` + `SessionProviderSupabase`, suscripciones Realtime y sincronización de email/contraseña/avatar contra Supabase Auth + Storage.

---

## 🛠️ 7. Fases de migración a Supabase (E1–E4)

- [x] **E1 Adapter & Providers conectados** — `src/lib/data/mappers.ts`, `DataProviderSupabase`, `SessionProviderSupabase`, wrapper `Providers` que conmuta por `NEXT_PUBLIC_USE_SUPABASE`. Los pages siguen usando `useData()` / `useSession()` sin cambios.
- [x] **E2 Realtime** — `DataProviderSupabase` se suscribe a `postgres_changes` en todo el schema `public` y refresca el estado para mantener la interconexión Owner / Encargado / Trabajador.
- [x] **E3 Caducidad backend** — Función `expirar_accesos_temporales()` programada con `pg_cron` cada minuto. El ticker del cliente queda como defensa-en-profundidad.
- [x] **E4 Storage de avatares** — Helper `src/lib/storage/avatars.ts` con `subirAvatar`/`eliminarAvatar`. `MiPerfilModal` sube la foto al bucket `avatars/<uid>/avatar.png` y guarda la URL pública. Email y contraseña se sincronizan vía `supabase.auth.updateUser` cuando el modo Supabase está activo.
