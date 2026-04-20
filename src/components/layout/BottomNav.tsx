"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ================= BOTTOM NAV MOBILE (ADMIN) ================= */
const BOTTOM_NAV = [
  { href:"/dashboard",    icon:"⬛", label:"Inicio"    },
  { href:"/trabajadores", icon:"👥", label:"Personal"  },
  { href:"/asistencia",   icon:"📅", label:"Asistencia"},
  { href:"/adelantos",    icon:"💳", label:"Adelantos" },
  { href:"/reportes",     icon:"📊", label:"Reportes"  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="bottom-nav" style={{ justifyContent:"space-around" }}>
      {BOTTOM_NAV.map(item=>{
        const isActive = pathname===item.href||pathname.startsWith(item.href+"/");
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration:"none",flex:1 }}>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",color:isActive?"var(--brand)":"var(--text-muted)" }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:9,fontWeight:isActive?700:500 }}>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
