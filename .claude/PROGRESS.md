# TRAMYS — Progreso de implementación

Diario plano para retomar si se cae la sesión.

## Decisiones tomadas (sin preguntar)
- **Persistencia**: localStorage (no Supabase Storage aquí). Store global en `DataProvider`.
- **Feriados Perú**: precargados solo los fijos de 2026 (Año Nuevo, Día del Trabajo, San Pedro y San Pablo, Fiestas Patrias 28/29 jul, Santa Rosa, Combate de Angamos, Todos los Santos, Inmaculada, Navidad). Checkbox en Eventos para mostrarlos.
- **Accesos temporales**: rol completo por duración (1h, 4h, 1d, 7d, custom hasta fecha). Expiración visible en la tabla.
- **Foto 1:1**: base64 en localStorage vía canvas crop.
- **Sueldo**: NO existe sueldo base. Tarifas por trabajador: diaNormal, tardanza, finSemana, feriado. Total = Σ (asistencia × tarifa) + manual overrides.

## Bloques y estado
- [x] A1 Store global (DataProvider)
- [x] A2 PhotoUpload + icono cake + icono money_bill
- [x] A3 Preloader login + cerrar sesión footer
- [x] B1 Dashboard rediseñado
- [x] B2 Sedes grid + Lima + color
- [x] B3 Trabajadores (nuevo/editar/asistencia/sueldo por día)
- [x] B4 Jaladores (lista+perfil, registrar ingreso)
- [x] B5 Asistencia admin
- [x] B6 Planilla (ganancia empresa, días reales)
- [ ] B7 Eventos (feriados oficiales toggle, próximo evento, torta)
- [ ] B8 Reportes
- [ ] B9 Accesos temporales
- [ ] C1 Trabajador asistencia multiverse
- [ ] C2 Trabajador páginas restantes
- [ ] D1 Pulido

## Archivos nuevos
- src/components/providers/DataProvider.tsx
- src/components/ui/PhotoUpload.tsx
- src/components/ui/Preloader.tsx
- src/lib/utils/peruHolidays.ts
