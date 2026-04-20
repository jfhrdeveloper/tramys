"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_NAV = [
  { href:"/mi-panel",      icon:"🏠", label:"Inicio"    },
  { href:"/mi-asistencia", icon:"📅", label:"Asistencia"},
  { href:"/mi-sueldo",     icon:"💰", label:"Mi Sueldo" },
  { href:"/mis-adelantos", icon:"💳", label:"Adelantos" },
  { href:"/mis-alertas",   icon:"🔔", label:"Alertas"   },
];

export function BottomNavWorker() {
  const pathname = usePathname();
  return (
    <div className="bottom-nav" style={{ justifyContent:"space-around" }}>
      {BOTTOM_NAV.map(item=>{
        const isActive = pathname===item.href;
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
