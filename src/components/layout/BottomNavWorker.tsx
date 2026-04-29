"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { Icon } from "@/components/ui/Icons";
import { MiPerfilModal } from "@/components/ui/MiPerfilModal";

const PRIMARY = [
  { href:"/mi-panel",      icon:"home",      label:"Inicio"     },
  { href:"/mi-asistencia", icon:"clock",     label:"Asistencia" },
  { href:"/mi-sueldo",     icon:"money_bill", label:"Sueldo"    },
  { href:"/mis-adelantos", icon:"adelantos", label:"Adelantos"  },
];
const MORE = [
  { href:"/mis-permisos", icon:"file_check", label:"Permisos" },
  { href:"/mis-eventos",  icon:"calendar",   label:"Eventos"  },
  { href:"/mis-alertas",  icon:"bell",       label:"Alertas"  },
];

export function BottomNavWorker() {
  const pathname = usePathname();
  const { signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const moreActive = MORE.some(i => pathname===i.href);

  return (
    <>
      <div className="bottom-nav" style={{ justifyContent:"space-around" }}>
        {PRIMARY.map(item=>{
          const isActive = pathname===item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration:"none",flex:1 }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",color:isActive?"var(--brand)":"var(--text-muted)" }}>
                <Icon name={item.icon} size={20} color={isActive?"var(--brand)":"var(--text-muted)"} />
                <span style={{ fontSize:9,fontWeight:isActive?700:500 }}>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {MORE.length > 0 && (
          <button onClick={()=>setOpen(true)} style={{ background:"transparent",border:"none",cursor:"pointer",flex:1,padding:0 }}>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",color:(open||moreActive)?"var(--brand)":"var(--text-muted)" }}>
              <Icon name="menu" size={20} color={(open||moreActive)?"var(--brand)":"var(--text-muted)"} />
              <span style={{ fontSize:9,fontWeight:(open||moreActive)?700:500 }}>Ver más</span>
            </div>
          </button>
        )}
      </div>

      {open && (
        <>
          <div onClick={()=>setOpen(false)} className="animate-fade-in" style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:60,backdropFilter:"blur(2px)" }} />
          <div className="animate-slide-up" style={{ position:"fixed",left:0,right:0,bottom:0,background:"var(--card)",borderTopLeftRadius:20,borderTopRightRadius:20,zIndex:70,paddingBottom:"max(16px, env(safe-area-inset-bottom))",boxShadow:"0 -8px 32px rgba(0,0,0,0.2)",maxHeight:"70vh",display:"flex",flexDirection:"column" }}>
            <div style={{ display:"flex",justifyContent:"center",padding:"10px 0 6px" }}>
              <div style={{ width:40,height:4,borderRadius:99,background:"var(--border)" }} />
            </div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 20px 12px",borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontWeight:700,fontSize:14 }}>Más opciones</div>
              <button onClick={()=>setOpen(false)} style={{ background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",padding:4 }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="bottom-sheet-scroll" style={{ overflowY:"auto",padding:"10px 12px" }}>
              {MORE.map(item=>{
                const isActive = pathname===item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} style={{ textDecoration:"none" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:10,marginBottom:4,background:isActive?"rgba(196,26,58,0.1)":"transparent",color:isActive?"var(--brand)":"var(--text)",fontWeight:isActive?600:500,fontSize:13 }}>
                      <Icon name={item.icon} size={20} color={isActive?"var(--brand)":"var(--text-muted)"} />
                      <span style={{ flex:1 }}>{item.label}</span>
                      <Icon name="chevron_right" size={14} color="var(--text-muted)" />
                    </div>
                  </Link>
                );
              })}

              <div style={{ height:1,background:"var(--border)",margin:"10px 4px" }} />

              <button onClick={()=>{ setOpen(false); setPerfilOpen(true); }} style={{ width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:0,textAlign:"left" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:10,color:"var(--text)",fontWeight:600,fontSize:13 }}>
                  <Icon name="user" size={20} color="var(--text-muted)" />
                  <span style={{ flex:1 }}>Mi perfil</span>
                  <Icon name="chevron_right" size={14} color="var(--text-muted)" />
                </div>
              </button>

              <button onClick={()=>{ setOpen(false); signOut(); }} style={{ width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:0,textAlign:"left" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:10,color:"var(--brand)",fontWeight:600,fontSize:13 }}>
                  <Icon name="logout" size={20} color="var(--brand)" />
                  <span style={{ flex:1 }}>Cerrar sesión</span>
                  <Icon name="chevron_right" size={14} color="var(--brand)" />
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <MiPerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </>
  );
}
