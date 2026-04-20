"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { iniciales } from "@/lib/utils/formatters";

interface Props { collapsed:boolean; onCollapse:()=>void; mobileOpen:boolean; onMobileClose:()=>void; }

const NAV = [
  { href:"/mi-panel",      label:"Mi Panel"    },
  { href:"/mi-asistencia", label:"Asistencia"  },
  { href:"/mi-sueldo",     label:"Mi Sueldo"   },
  { href:"/mis-adelantos", label:"Adelantos"   },
  { href:"/mis-permisos",  label:"Permisos"    },
  { href:"/mis-alertas",   label:"Alertas", badge:2 },
];

export function SidebarWorker({ collapsed, onCollapse, mobileOpen, onMobileClose }: Props) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const Inner = () => (
    <div style={{ width:collapsed?56:210,background:"var(--card)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",height:"100%",transition:"width 0.3s",overflow:"hidden" }}>
      <div style={{ height:60,display:"flex",alignItems:"center",padding:collapsed?"0 12px":"0 16px",gap:10,borderBottom:"1px solid var(--border)",flexShrink:0 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0,cursor:"pointer" }} onClick={onCollapse}>T</div>
        {!collapsed && <div><div style={{ fontWeight:800,fontSize:15,letterSpacing:-0.3 }}>TRAMYS</div><div style={{ fontSize:9,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>PANEL TRABAJADOR</div></div>}
      </div>
      <nav style={{ flex:1,padding:"10px 6px",overflowY:"auto" }}>
        {NAV.map(item=>{
          const isActive = pathname===item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onMobileClose} style={{ textDecoration:"none" }}>
              <div style={{ display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:8,cursor:"pointer",marginBottom:2,background:isActive?"rgba(196,26,58,0.1)":"transparent",color:isActive?"var(--brand)":"var(--text-muted)",fontWeight:isActive?600:500,fontSize:13,transition:"all 0.15s",whiteSpace:"nowrap",justifyContent:collapsed?"center":"flex-start" }}
                onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="var(--hover)";}}
                onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background="transparent";}}
              >
                <div style={{ width:6,height:6,borderRadius:"50%",background:isActive?"var(--brand)":"var(--border)",flexShrink:0 }} />
                {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                {!collapsed && (item as {badge?:number}).badge && <span style={{ background:"var(--brand)",color:"#fff",borderRadius:99,fontSize:9,fontWeight:700,padding:"1px 6px" }}>{(item as {badge?:number}).badge}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding:collapsed?"12px":"12px 14px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,justifyContent:collapsed?"center":"flex-start" }}>
        <Avatar initials={profile?iniciales(profile.nombre):"?"} size={30} color={profile?.sede?.nombre?.toLowerCase().includes("santa")?"#C41A3A":"#1d6fa4"} />
        {!collapsed && profile && <div style={{ flex:1,overflow:"hidden" }}><div style={{ fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{profile.nombre}</div><div style={{ fontSize:9,color:"var(--text-muted)",fontFamily:"'DM Mono',monospace" }}>{profile.sede?.nombre}</div></div>}
        {!collapsed && <button onClick={signOut} style={{ background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:16 }}>↩</button>}
      </div>
    </div>
  );

  return (
    <>
      <div className="sidebar-desktop" style={{ height:"100vh",position:"sticky",top:0,flexShrink:0 }}><Inner /></div>
      {mobileOpen && <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40 }} onClick={onMobileClose} />}
      {mobileOpen && <div className="animate-slide-left" style={{ position:"fixed",top:0,left:0,height:"100vh",zIndex:50,width:220 }}><Inner /></div>}
    </>
  );
}
