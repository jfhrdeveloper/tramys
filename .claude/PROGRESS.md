# 📖 TRAMYS — Roadmap y Reglas del Proyecto

> Documento maestro de control de estado, decisiones arquitectónicas y reglas globales para mantener la consistencia en la base de código.

---

## 🎯 1. Reglas Globales del Proyecto

### 📝 Estándar Visual de Comentarios
Para mantener una legibilidad impecable, aplica estrictamente esta jerarquía en todos los archivos `.ts` y `.tsx`:

* **Nivel 1 (Bloques principales):** `/* ================= BLOQUE PRINCIPAL ================= */`
* **Nivel 2 (Secciones lógicas):** `/* ====== Sección secundaria ====== */`
* **Nivel 3 (Subsecciones):** `/* ==== Subsección ==== */`
* **Nivel 4 (Notas de una línea):** `// Nota específica` o `/* Elemento adicional */`

> **⚠️ Regla Crítica (React/JSX):** Dentro del JSX (en el `return`), usa **ÚNICA Y ESTRICTAMENTE** `{/* */}`. El uso de `//` dentro del JSX romperá la aplicación.

### 📱 Diseño Responsivo Adaptativo (Mobile-First)
Todo componente y vista debe escalar correctamente siguiendo los breakpoints de Tailwind:

| Nivel | Breakpoint | Dispositivo Objetivo | Reglas Base de Layout |
| :--- | :--- | :--- | :--- |
| **base** | `< 640px` | Móvil (360px–430px) | Layout 1 columna, bottom-nav / menú hamburguesa, touch targets ≥ 44px. |
| **sm** | `≥ 640px` | Móvil grande / Paisaje | 1 columna con márgenes holgados. |
| **md** | `≥ 768px` | Tablet (768px–1024px) | Grid de 2 columnas. Sidebar en overlay/colapsable. |
| **lg** | `≥ 1024px` | Laptop 13–14" | Sidebar fijo. Grid de 2-3 columnas. |
| **xl** | `≥ 1280px` | Laptop 15–16" estándar | Grid de ≥ 3 columnas sin scroll horizontal. |
| **2xl** | `≥ 1536px` | Monitor / PC 17"+ | `max-w-screen-xl` o `max-w-[1440px]` centrado. Layouts no estirados al 100%. |

* **Anchos:** Nunca usar anchos fijos en px para contenedores. Usar `w-full` y `max-w-*`. El sidebar PC es fijo (`w-64`/`w-72`), el contenido usa `flex-1 min-w-0`.
* **Imágenes:** Siempre `w-full h-auto` u `object-cover`.
* **Tipografía:** Responsiva (`text-sm md:text-base xl:text-lg`), nunca tamaños fijos.

### 🎨 Paleta TRAMYS y Tipografía
* **Modo Claro:** Brand `#C41A3A` · Claro `#e8304d` · Oscuro `#a01530` · Fondo `#f8f7f4` · Card `#ffffff` · Texto `#1a1917`
* **Modo Oscuro:** Fondo `#0e1117` · Card `#161b22` · Texto `#e8eaf0`
* **Fuentes:** *Bricolage Grotesque* (UI General) + *DM Mono* (Código, Fechas, Etiquetas)

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
- [ ] **D1** Pulido final (Cuadratura, centrado, QA de Responsive)

---

## 📂 4. Referencias: Archivos Core Creados
- `src/components/providers/DataProvider.tsx`
- `src/components/ui/PhotoUpload.tsx`
- `src/components/ui/Preloader.tsx`
- `src/components/ui/Skeleton.tsx` (Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonStats)
- `src/lib/utils/peruHolidays.ts`

---

## 🧠 5. Memoria de Requerimientos Detallados (Backlog Operativo)

### 👑 VISTA ADMINISTRADOR / OWNER
- [x] **1. Dashboard:** Rediseño completo, hero unificado, métricas correctas. Cards de KPI superiores eliminadas (todo dentro del hero).
- [x] **2. Sedes:** Mostrar en 2 cards apiladas (abrir al click). Reestructurado. Agregada sede Lima. Juntar "Caja". Color modificable.
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
  - [x] Tabla de activos con tiempo restante y opción "Revocar".
  - [x] Audit log con histórico completo.

### 👷 VISTA TRABAJADOR
- [x] **1. Asistencia:**
  - [x] Subpanel Multiverse exacto para que el trabajador cuadre ingresos.
  - [x] Subpanel de vista general (historial mensual).
- [x] **2. Mi Sueldo:** Desglose dinámico por tipo de día, tarifas, adelantos y detalle por día.
- [x] **3. Mis Adelantos:** Solicitud, filtros por estado, KPIs y descuento del mes.
- [x] **4. Mis Permisos:** Solicitud por tipo (personal/médico/vacaciones) con filtros y badges.
- [x] **5. Mis Alertas:** Notificaciones agregadas (solicitudes, tardanzas, eventos próximos).

### ⚙️ GENERAL (Reglas Transversales)
- [ ] Todo perfectamente cuadrado, centrado, bien diseñado.
- [x] **Regla de Sueldo:** Nadie gana sueldo base, todo es cálculo diario por tipo de día / manual override.
- [x] **Sidebar/Menú:** Línea divisora y botón SVG "Cerrar sesión" debajo del email/sede (admin y trabajador).
- [x] **Preloader:** Bienvenida al iniciar sesión con Nombre o Apodo.
- [x] **Funcionalidad:** Botones del owner ya conectados al `DataProvider` (CRUD + aprobaciones + accesos temporales). Las vistas del trabajador reflejan los cambios en tiempo real al compartir el mismo store.
- [ ] **Transiciones y Skeletons:** [x] Efecto suave (fade-in) implementado / [x] Skeleton (`Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable`, `SkeletonStats`) disponible — falta cablearlo en pantallas con carga.
