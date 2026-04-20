# TRAMYS — Panel de Gestión Operativa

Sistema de gestión para dos sedes: **Santa Anita** y **Puente Piedra**.

## Stack
- Next.js 15.5.9 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 3. Configurar base de datos
# Ir a Supabase Dashboard → SQL Editor → New Query
# Pegar y ejecutar el contenido de: supabase-schema.sql

# 4. Crear usuarios en Supabase Auth
# Dashboard → Authentication → Users → Add user
# owner@tramys.pe    / password → luego UPDATE profiles SET rol='owner'
# enc@tramys.pe      / password → luego UPDATE profiles SET rol='encargado', sede_id='...'
# trab@tramys.pe     / password → ya tiene rol='trabajador' por defecto

# 5. Correr el proyecto
npm run dev
```

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
```

## Roles
| Rol         | Acceso                                    |
|-------------|-------------------------------------------|
| Owner       | Todo el sistema, ambas sedes              |
| Encargado   | Solo su sede, sin pagos ni adelantos      |
| Trabajador  | Solo su información personal              |

## Rutas
**Admin:** `/dashboard` `/sedes` `/trabajadores` `/jaladores` `/asistencia` `/planilla` `/adelantos` `/feriados` `/cumpleanos` `/reportes` `/accesos`

**Trabajador:** `/mi-panel` `/mi-asistencia` `/mi-sueldo` `/mis-adelantos` `/mis-permisos` `/mis-alertas`

## Módulos implementados
- ✅ Auth con redirección por rol
- ✅ Middleware de protección de rutas
- ✅ Layout responsive (mobile/tablet/desktop 16"+)
- ✅ Sidebar colapsable + Bottom nav mobile
- ✅ Dark/Light mode
- ✅ Dashboard con datos en vivo
- ✅ Módulo Sedes
- ✅ Modal de asistencia con foto de evidencia
- ✅ Schema Supabase completo con RLS, triggers y vistas

## Habilitar Realtime en Supabase
Dashboard → Database → Replication → Activar para:
`asistencia`, `adelantos`, `captaciones`, `audit_log`
