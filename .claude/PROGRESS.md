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
- [ ] **B7** Eventos (Toggle feriados oficiales, próximo evento, gráfico de torta)
- [ ] **B8** Reportes (Rediseño visual completo y nuevos gráficos)
- [ ] **B9** Accesos temporales (Modal y gestión de caducidad)
- [ ] **C1** Trabajador: Panel `mi-asistencia` (Calendario multiverse)
- [ ] **C2** Trabajador: Páginas restantes conectadas al `DataProvider`
- [ ] **D1** Pulido final (Cuadratura, centrado, QA de Responsive)

---

## 📂 4. Referencias: Archivos Core Creados
- `src/components/providers/DataProvider.tsx`
- `src/components/ui/PhotoUpload.tsx`
- `src/components/ui/Preloader.tsx`
- `src/lib/utils/peruHolidays.ts`

---

## 🧠 5. Memoria de Requerimientos Detallados (Backlog Operativo)

### 👑 VISTA ADMINISTRADOR / OWNER
- [ ] **1. Dashboard:** Rediseño completo e intuitivo. Métricas correctas. **ELIMINAR** cards superiores.
- [x] **2. Sedes:** Mostrar en 2 cards apiladas (abrir al click). Reestructurado. Agregada sede Lima. Juntar "Caja". Color modificable.
- [ ] **3. Trabajadores:** 
  - [ ] Botón "Nuevo trabajador" funcional (incluir **apodo**).
  - [x] Agregar foto 1x1 cuadrable (Upload base64).
  - [ ] **ELIMINAR** progreso del mes.
  - [ ] Asistencia: Subpanel tipo Multiverse (calendario) + historial reciente abajo. Click en fecha = ver horario.
  - [ ] Editar registro completamente funcional.
  - [ ] "Mi sueldo": Cambiar icono a billete. Todo modificable (tarifas: normal, feriado, fds, evento). Todo derivado de la asistencia.
  - [ ] Adelantos y permisos: Rediseño, botones funcionales.
  - [ ] Perfil y Turnos completamente editables.
- [ ] **4. Jaladores:** 
  - [ ] Subpanel de lista + vista de movimiento.
  - [ ] Botón "Registrar ingreso" (monto ganado en el día) + Editable.
  - [ ] **ELIMINAR** concepto de "Captación", cambiar a "Comisiones". 
  - [ ] Perfil: Dashboard dinámico de rendimiento por ingresos.
  - [ ] **ELIMINAR** KPIs superiores (total jaladores, captación de hoy, comisiones totales).
- [x] **5. Asistencia:** 
  - [x] Mejorar contraste (actualmente fondo y letras muy blancas).
  - [x] Mostrar **Apodo** (prioridad) o Nombre. NO mostrar cantidad de asistentes.
  - [x] Agregar Dropdown Mes/Año (manteniendo vista actual).
  - [x] **ELIMINAR** KPIs superiores (Presencias, Tardanzas, Ausencias).
- [ ] **6. Planilla:** 
  - [ ] Añadir cálculo: `Total Bruto - Neto = Ganancia Compañía`.
  - [ ] Mostrar días trabajados separados por tipo (normal, tardanza, fds, feriado).
  - [x] Eliminar Sueldo Base (ya es suma de días).
- [ ] **7. Eventos:** 
  - [ ] Checkbox para mostrar feriados oficiales de Perú + los agregados.
  - [ ] **ELIMINAR** KPIs de totales. Reemplazar por 1 card de "Próximo evento".
  - [ ] SVG cumpleaños = Torta por defecto. Todos los eventos deben tener SVG según tipo.
  - [ ] Agregar Dropdown Mes/Año.
- [ ] **8. Reportes:** 
  - [ ] Rediseño visual completo e intuitivo. 
  - [ ] **ELIMINAR** todos los cards superiores (planilla total, asistencia promedio).
  - [ ] Mejorar fuertemente la estética de los gráficos.
- [ ] **9. Accesos:** 
  - [x] Poder asignar un rol temporal por X cantidad de tiempo.

### 👷 VISTA TRABAJADOR
- [ ] **1. Asistencia:**
  - [ ] Subpanel Multiverse exacto para que el trabajador cuadre ingresos.
  - [ ] Subpanel de vista general.

### ⚙️ GENERAL (Reglas Transversales)
- [ ] Todo perfectamente cuadrado, centrado, bien diseñado.
- [x] **Regla de Sueldo:** Nadie gana sueldo base, todo es cálculo diario por tipo de día / manual override.
- [ ] **Sidebar/Menú:** Debajo del correo del Owner debe haber una línea divisora y botón SVG "Cerrar sesión".
- [x] **Preloader:** Bienvenida al iniciar sesión con Nombre o Apodo.
- [ ] **Funcionalidad:** Todos los botones deben ser funcionales y afectar vistas de trabajador/encargado según sus permisos.
- [ ] **Transiciones y Skeletons:** [x] Efecto suave (fade-in) implementado en layouts / [ ] Skeleton loaders pendientes.
