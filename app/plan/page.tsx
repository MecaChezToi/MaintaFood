'use client'
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

const FLOORS: Record<string, any> = {
  "RDC": {
    label: "Rez-de-chaussée",
    zones: [
      { id:"3R01", name:"Hall principal / Couloir central", type:"corridor", x:180, y:280, w:320, h:60 },
      { id:"3R02", name:"Zone de production", type:"production", x:180, y:340, w:320, h:120 },
      { id:"3R03", name:"Atelier", type:"atelier", x:100, y:430, w:140, h:60 },
      { id:"3R04", name:"Couloir latéral", type:"corridor", x:100, y:370, w:80, h:60 },
      { id:"3R05", name:"Zone stockage", type:"stockage", x:60, y:300, w:120, h:70 },
      { id:"3R06", name:"Atelier Nord-Ouest", type:"atelier", x:20, y:140, w:180, h:160 },
      { id:"3R07", name:"Local technique", type:"technique", x:155, y:200, w:80, h:70 },
      { id:"3R08", name:"Local équipements", type:"technique", x:240, y:200, w:80, h:70 },
      { id:"3R09", name:"Zone process", type:"production", x:170, y:130, w:130, h:70 },
      { id:"3R10", name:"Zone process 2", type:"production", x:300, y:130, w:110, h:80 },
      { id:"3R11", name:"Grande salle production", type:"production", x:410, y:130, w:90, h:80 },
      { id:"3R13", name:"Accès Nord", type:"corridor", x:155, y:90, w:50, h:40 },
      { id:"3R14", name:"Local Nord", type:"technique", x:210, y:90, w:60, h:40 },
      { id:"3R16", name:"Couloir Nord", type:"corridor", x:270, y:90, w:100, h:40 },
      { id:"3R17", name:"Zone Nord centrale", type:"production", x:370, y:90, w:120, h:45 },
      { id:"3R18", name:"Local Nord-Est", type:"technique", x:455, y:70, w:60, h:45 },
      { id:"3R19", name:"Zone Nord-Est", type:"production", x:490, y:90, w:60, h:45 },
      { id:"3P01", name:"Poste de pilotage", type:"bureau", x:235, y:250, w:55, h:35 },
    ]
  },
  "4R": {
    label: "Zone 4R — Production Est",
    zones: [
      { id:"4R01", name:"Accès principal Est", type:"acces", x:540, y:490, w:60, h:40 },
      { id:"4R02", name:"Sas entrée", type:"corridor", x:610, y:490, w:50, h:40 },
      { id:"4R03", name:"Couloir Est", type:"corridor", x:540, y:450, w:80, h:40 },
      { id:"4R04", name:"Zone transition", type:"corridor", x:540, y:410, w:80, h:40 },
      { id:"4R05", name:"Salle process A", type:"production", x:540, y:330, w:80, h:80 },
      { id:"4R06", name:"Grande zone production Est", type:"production", x:630, y:360, w:250, h:160 },
      { id:"4R07", name:"Zone B", type:"production", x:630, y:330, w:80, h:70 },
      { id:"4R08", name:"Local technique Est", type:"technique", x:630, y:250, w:80, h:80 },
      { id:"4R09", name:"Zone C", type:"production", x:630, y:170, w:80, h:80 },
      { id:"4R10", name:"Couloir Est Nord", type:"corridor", x:540, y:120, w:320, h:50 },
      { id:"4R11", name:"Zone Nord-Est A", type:"production", x:750, y:120, w:100, h:100 },
      { id:"4R12", name:"Local Nord-Est", type:"technique", x:800, y:60, w:60, h:60 },
      { id:"4R13", name:"Zone Nord-Est B", type:"production", x:740, y:60, w:60, h:60 },
      { id:"4R14", name:"Zone Est supérieure", type:"production", x:660, y:90, w:140, h:55 },
      { id:"4R15", name:"Zone Est principale", type:"production", x:710, y:170, w:170, h:190 },
      { id:"4R16", name:"Sas sécurité", type:"corridor", x:610, y:460, w:40, h:30 },
    ]
  },
  "0R": {
    label: "Niveau 0 — Logistique",
    zones: [
      { id:"0R01", name:"Entrée logistique", type:"acces", x:340, y:560, w:70, h:50 },
      { id:"0R02", name:"Zone chargement", type:"stockage", x:340, y:620, w:80, h:60 },
      { id:"0R03", name:"Couloir logistique", type:"corridor", x:340, y:520, w:70, h:40 },
      { id:"0R04", name:"Local stockage A", type:"stockage", x:340, y:590, w:80, h:50 },
      { id:"0R05", name:"Local stockage B", type:"stockage", x:295, y:560, w:50, h:50 },
      { id:"0R06", name:"Zone réception", type:"stockage", x:295, y:500, w:90, h:60 },
      { id:"0R08", name:"Local technique 0", type:"technique", x:360, y:490, w:60, h:50 },
      { id:"0R09", name:"Local équip. 0", type:"technique", x:295, y:490, w:60, h:45 },
    ]
  },
  "1R": {
    label: "Bâtiment 1 — Ateliers",
    zones: [
      { id:"1R01", name:"Atelier A", type:"atelier", x:30, y:610, w:60, h:45 },
      { id:"1R02", name:"Atelier B", type:"atelier", x:100, y:610, w:60, h:45 },
      { id:"1R03", name:"Local équip. 1", type:"technique", x:150, y:570, w:50, h:40 },
      { id:"1R04", name:"Couloir bat.1", type:"corridor", x:100, y:680, w:80, h:30 },
      { id:"1R05", name:"Atelier C", type:"atelier", x:30, y:655, w:60, h:40 },
      { id:"1R06", name:"Local stockage 1", type:"stockage", x:100, y:570, w:50, h:40 },
      { id:"1R07", name:"Bureau 1", type:"bureau", x:100, y:615, w:50, h:40 },
      { id:"1R08", name:"Salle de repos", type:"bureau", x:30, y:570, w:60, h:40 },
      { id:"1R10", name:"Local 1-10", type:"technique", x:100, y:540, w:50, h:35 },
      { id:"1R11", name:"Zone Nord bat.1", type:"atelier", x:30, y:540, w:60, h:35 },
      { id:"1R12", name:"Local 1-12", type:"technique", x:160, y:540, w:45, h:35 },
    ]
  },
  "2R": {
    label: "Bâtiment 2 — Zone intermédiaire",
    zones: [
      { id:"2R01", name:"Couloir bat.2", type:"corridor", x:200, y:470, w:120, h:50 },
      { id:"2R02", name:"Zone process 2", type:"production", x:270, y:530, w:80, h:55 },
      { id:"2R03", name:"Local 2-3", type:"technique", x:270, y:480, w:70, h:50 },
      { id:"2R04", name:"Local 2-4", type:"technique", x:220, y:560, w:55, h:45 },
      { id:"2R05", name:"Couloir 2-5", type:"corridor", x:100, y:470, w:100, h:40 },
      { id:"2R06", name:"Zone 2-6", type:"atelier", x:150, y:560, w:70, h:45 },
      { id:"2R07", name:"Zone 2-7", type:"atelier", x:30, y:490, w:80, h:60 },
      { id:"2R08", name:"Local 2-8", type:"technique", x:155, y:460, w:55, h:40 },
    ]
  }
};

const ROOM_TYPES: Record<string, { color: string; label: string }> = {
  production: { color:"#00c896", label:"Production" },
  technique:  { color:"#ffa502", label:"Local technique" },
  corridor:   { color:"#7a8599", label:"Couloir / Accès" },
  stockage:   { color:"#3c82e8", label:"Stockage" },
  bureau:     { color:"#a855f7", label:"Bureau" },
  atelier:    { color:"#e8643c", label:"Atelier" },
  acces:      { color:"#3cb87a", label:"Accès / Entrée" },
};

const SAFETY_ICONS = [
  { type:"ext",   x:172, y:105, floor:"RDC" }, { type:"ext",   x:282, y:105, floor:"RDC" },
  { type:"ext",   x:395, y:105, floor:"RDC" }, { type:"ext",   x:128, y:195, floor:"RDC" },
  { type:"ext",   x:302, y:255, floor:"RDC" }, { type:"ext",   x:410, y:305, floor:"RDC" },
  { type:"ext",   x:188, y:375, floor:"RDC" }, { type:"ext",   x:695, y:175, floor:"4R" },
  { type:"ext",   x:870, y:215, floor:"4R" }, { type:"ext",   x:355, y:565, floor:"0R" },
  { type:"exit",  x:22,  y:170, floor:"RDC" }, { type:"exit",  x:285, y:490, floor:"RDC" },
  { type:"exit",  x:535, y:455, floor:"4R" }, { type:"exit",  x:875, y:390, floor:"4R" },
  { type:"exit",  x:35,  y:620, floor:"1R" },
  { type:"ria",   x:238, y:258, floor:"RDC" }, { type:"ria",   x:345, y:580, floor:"0R" },
  { type:"dae",   x:495, y:425, floor:"4R" },
  { type:"alarm", x:382, y:305, floor:"RDC" }, { type:"alarm", x:618, y:380, floor:"4R" },
  { type:"elec",  x:620, y:505, floor:"4R" },
  { type:"gaz",   x:132, y:165, floor:"RDC" },
  { type:"inflam",x:75,  y:170, floor:"RDC" },
];

const ICON_CFG: Record<string, { label: string; color: string; symbol: string }> = {
  ext:    { label:"Extincteur",         color:"#ff4757", symbol:"F" },
  exit:   { label:"Sortie de secours",  color:"#00c896", symbol:"→" },
  ria:    { label:"RIA (30m)",           color:"#cc2200", symbol:"R" },
  dae:    { label:"Défibrillateur",     color:"#00a878", symbol:"D" },
  alarm:  { label:"Bouton alarme",      color:"#ff6600", symbol:"A" },
  elec:   { label:"Tableau électrique", color:"#ffa502", symbol:"E" },
  gaz:    { label:"Vanne gaz",          color:"#ff8800", symbol:"G" },
  inflam: { label:"Produit inflammable",color:"#cc4400", symbol:"!" },
};

export default function PlanPage() {
  const [floor, setFloor] = useState("RDC");
  const [selected, setSelected] = useState<any>(null);
  const [hovered, setHovered] = useState<string|null>(null);
  const [tooltip, setTooltip] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x:0, y:0 });
  const [dragging, setDragging] = useState(false);
  const [showSafety, setShowSafety] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const floorData = FLOORS[floor];
  const rooms = floorData?.zones || [];
  const icons = SAFETY_ICONS.filter(i => i.floor === floor);
  const filtered = filterType === "all" ? rooms : rooms.filter((r:any) => r.type === filterType);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px",
    borderRadius:6, fontSize:12, fontWeight:500, cursor:"pointer",
    border:`1px solid ${active ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.08)"}`,
    background: active ? "rgba(255,255,255,.06)" : "transparent",
    color: active ? "var(--t1)" : "var(--t2)",
    fontFamily:"var(--font-outfit)", transition:"all .12s",
  });

  const floorTabStyle = (active: boolean): React.CSSProperties => ({
    padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer",
    fontFamily:"var(--font-mono)",
    border:`1px solid ${active ? "rgba(0,200,150,.3)" : "rgba(255,255,255,.08)"}`,
    background: active ? "rgba(0,200,150,.1)" : "transparent",
    color: active ? "var(--acc)" : "var(--t2)",
    transition:"all .12s",
  });

  return (
    <AppLayout>
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 52px)", margin:"-20px", overflow:"hidden" }}>

        {/* Toolbar */}
        <div style={{ background:"var(--s1)", borderBottom:"1px solid var(--b0)", padding:"8px 16px", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginRight:8 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>Chocolaterie Galler</span>
            <span style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--t2)", background:"var(--s3)", padding:"2px 7px", borderRadius:4 }}>v08/04/2024</span>
          </div>

          {/* Tabs niveaux */}
          <div style={{ display:"flex", gap:4 }}>
            {Object.entries(FLOORS).map(([k,v]:[string,any]) => (
              <button key={k} style={floorTabStyle(floor===k)} onClick={()=>{setFloor(k);setSelected(null);}}>
                {k}
              </button>
            ))}
          </div>

          <div style={{ width:1, height:24, background:"var(--b0)", margin:"0 4px" }}/>

          <select value={filterType} onChange={e=>setFilterType(e.target.value)}
            style={{ background:"var(--s3)", border:"1px solid var(--b1)", borderRadius:6, color:"var(--t1)", fontFamily:"var(--font-outfit)", fontSize:12, padding:"5px 10px", outline:"none" }}>
            <option value="all">Tous les types</option>
            {Object.entries(ROOM_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>

          <button style={btnStyle(showSafety)} onClick={()=>setShowSafety(s=>!s)}>🛡️ Sécurité</button>
          <button style={btnStyle(showLabels)} onClick={()=>setShowLabels(s=>!s)}>🏷️ Labels</button>

          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex", border:"1px solid var(--b1)", borderRadius:6, overflow:"hidden" }}>
              <button onClick={()=>setZoom(z=>Math.max(.4,parseFloat((z-.2).toFixed(1))))} style={{ width:30,height:30,background:"var(--s3)",border:"none",color:"var(--t1)",fontSize:16,cursor:"pointer" }}>−</button>
              <div style={{ width:46,height:30,background:"var(--bg)",color:"var(--t2)",fontFamily:"var(--font-mono)",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",borderLeft:"1px solid var(--b1)",borderRight:"1px solid var(--b1)" }}>{Math.round(zoom*100)}%</div>
              <button onClick={()=>setZoom(z=>Math.min(3,parseFloat((z+.2).toFixed(1))))} style={{ width:30,height:30,background:"var(--s3)",border:"none",color:"var(--t1)",fontSize:16,cursor:"pointer" }}>+</button>
            </div>
            <button style={btnStyle(false)} onClick={()=>{setZoom(1);setPan({x:0,y:0});}}>⊡ Reset</button>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* SVG Plan */}
          <div style={{ flex:1, overflow:"hidden", position:"relative", background:"var(--bg)", cursor:dragging?"grabbing":"grab" }}
            onMouseDown={()=>setDragging(true)}
            onMouseUp={()=>setDragging(false)}
            onMouseLeave={()=>{setDragging(false);setTooltip(null);setHovered(null);}}
            onMouseMove={e=>{if(dragging)setPan(p=>({x:p.x+e.movementX,y:p.y+e.movementY}));}}
            onWheel={e=>{e.preventDefault();e.deltaY<0?setZoom(z=>Math.min(3,parseFloat((z+.15).toFixed(2)))):setZoom(z=>Math.max(.4,parseFloat((z-.15).toFixed(2))));}}
          >
            <svg viewBox="0 0 1000 750" style={{ width:"100%", height:"100%", transform:`scale(${zoom}) translate(${pan.x/zoom}px,${pan.y/zoom}px)`, transformOrigin:"center center", transition:dragging?"none":"transform .1s" }}>
              <rect width="1000" height="750" fill="#0b0c0e"/>
              <defs>
                <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
                </pattern>
              </defs>
              <rect width="1000" height="750" fill="url(#pg)"/>

              {/* Salles */}
              {filtered.map((room:any) => {
                const tc = ROOM_TYPES[room.type] || ROOM_TYPES.corridor;
                const isH = hovered===room.id, isS = selected?.id===room.id;
                return (
                  <g key={room.id}>
                    <rect x={room.x} y={room.y} width={room.w} height={room.h} rx="3"
                      fill={isS?tc.color+"28":isH?tc.color+"18":tc.color+"0e"}
                      stroke={isS?tc.color:isH?tc.color+"99":tc.color+"55"}
                      strokeWidth={isS?1.5:isH?1:.6}
                      style={{ cursor:"pointer", transition:"all .15s", filter:isS?`drop-shadow(0 0 6px ${tc.color}55)`:"none" }}
                      onClick={()=>setSelected(isS?null:room)}
                      onMouseEnter={e=>{setHovered(room.id);const r=e.currentTarget.closest("svg")?.parentElement?.getBoundingClientRect();r&&setTooltip({room,x:e.clientX-r.left+16,y:e.clientY-r.top-10});}}
                      onMouseLeave={()=>{setHovered(null);setTooltip(null);}}
                      onMouseMove={e=>{const r=e.currentTarget.closest("svg")?.parentElement?.getBoundingClientRect();r&&setTooltip({room,x:e.clientX-r.left+16,y:e.clientY-r.top-10});}}
                    />
                    <rect x={room.x} y={room.y} width={room.w} height={3} rx="2" fill={tc.color+"99"} style={{pointerEvents:"none"}}/>
                    {showLabels && (
                      <g style={{pointerEvents:"none"}}>
                        <text x={room.x+room.w/2} y={room.y+room.h/2+(room.h>50?-5:3)} textAnchor="middle"
                          fill={isS?tc.color:isH?tc.color+"cc":"rgba(255,255,255,.6)"}
                          fontSize={room.w>80?9:8} fontFamily="JetBrains Mono" fontWeight="600">
                          {room.id}
                        </text>
                        {room.h>55&&<text x={room.x+room.w/2} y={room.y+room.h/2+7} textAnchor="middle" fill="rgba(255,255,255,.3)" fontSize="7" fontFamily="JetBrains Mono">
                          {room.name.length>20?room.name.slice(0,19)+"…":room.name}
                        </text>}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Icônes sécurité */}
              {showSafety && icons.map((ic:any,i:number)=>{
                const cfg = ICON_CFG[ic.type];
                return (
                  <g key={i}>
                    <circle cx={ic.x} cy={ic.y} r="5" fill={cfg.color+"33"} stroke={cfg.color} strokeWidth=".8"/>
                    <text x={ic.x} y={ic.y+3} textAnchor="middle" fontSize="6" fontFamily="Arial" fill={cfg.color}>{cfg.symbol}</text>
                  </g>
                );
              })}

              {/* Marqueur vous êtes ici (zone 4R) */}
              {floor==="4R"&&<g>
                <circle cx={578} cy={520} r="8" fill="rgba(0,200,150,.2)" stroke="var(--acc)" strokeWidth="1.5">
                  <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx={578} cy={520} r="4" fill="var(--acc)"/>
                <text x={578} y={536} textAnchor="middle" fill="var(--acc)" fontSize="7" fontFamily="JetBrains Mono">vous êtes ici</text>
              </g>}

              {/* Parking véhicules électriques */}
              {floor==="4R"&&<g>
                <rect x={930} y={210} width={50} height={40} rx="3" fill="rgba(59,130,246,.15)" stroke="#3b82f6" strokeWidth="1"/>
                <text x={955} y={228} textAnchor="middle" fill="#3b82f6" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">P</text>
                <text x={955} y={242} textAnchor="middle" fill="#3b82f6" fontSize="6" fontFamily="JetBrains Mono">VÉ</text>
              </g>}

              {/* Nord */}
              <g transform="translate(960,30)">
                <circle cx="0" cy="0" r="14" fill="#111315" stroke="rgba(255,255,255,.08)" strokeWidth=".8"/>
                <text x="0" y="4" textAnchor="middle" fill="#e4e8f0" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">N</text>
                <line x1="0" y1="-8" x2="0" y2="-14" stroke="#00c896" strokeWidth="1.5" strokeLinecap="round"/>
              </g>

              {/* Titre niveau */}
              <text x="500" y="735" textAnchor="middle" fill="rgba(255,255,255,.07)" fontSize="10" fontFamily="JetBrains Mono">
                {floorData?.label?.toUpperCase()} — CHOCOLATERIE GALLER
              </text>
            </svg>

            {/* Tooltip */}
            {tooltip&&<div style={{ position:"fixed", zIndex:200, left:tooltip.x, top:tooltip.y, background:"#181a1d", border:"1px solid rgba(255,255,255,.15)", borderRadius:8, padding:"10px 14px", pointerEvents:"none", minWidth:180, boxShadow:"0 8px 24px rgba(0,0,0,.5)" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--acc)", marginBottom:3 }}>{tooltip.room.id}</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{tooltip.room.name}</div>
              <div style={{ fontSize:11, color:ROOM_TYPES[tooltip.room.type]?.color||"#888" }}>● {ROOM_TYPES[tooltip.room.type]?.label}</div>
              <div style={{ fontSize:9, color:"var(--t3)", marginTop:5, fontFamily:"var(--font-mono)" }}>Cliquer pour les détails</div>
            </div>}
          </div>

          {/* Sidebar */}
          <div style={{ width:260, minWidth:260, background:"var(--s1)", borderLeft:"1px solid var(--b0)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--b0)" }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{selected ? `Salle ${selected.id}` : "Détail zone"}</div>
              <div style={{ fontSize:10, fontFamily:"var(--font-mono)", color:"var(--t2)" }}>{selected ? ROOM_TYPES[selected.type]?.label : "Cliquez sur une zone"}</div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:10 }}>
              {!selected ? (
                <>
                  <div style={{ fontSize:10, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:1, color:"var(--t3)", marginBottom:10 }}>
                    {floorData?.label} — {rooms.length} zones
                  </div>
                  {rooms.map((room:any) => {
                    const tc = ROOM_TYPES[room.type];
                    return (
                      <div key={room.id} onClick={()=>setSelected(room)}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:6, marginBottom:4, cursor:"pointer", background:"var(--s2)", border:"1px solid var(--b0)", transition:"border-color .12s" }}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,.15)")}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,.05)")}>
                        <div style={{ width:8, height:8, borderRadius:2, background:tc?.color||"#888", flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{room.name}</div>
                          <div style={{ fontSize:9, fontFamily:"var(--font-mono)", color:"var(--t3)" }}>{room.id}</div>
                        </div>
                        <span style={{ fontSize:9, fontFamily:"var(--font-mono)", color:tc?.color||"#888", flexShrink:0 }}>{tc?.label?.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div>
                  <div style={{ background:"var(--s2)", border:`1px solid ${ROOM_TYPES[selected.type]?.color||"#888"}44`, borderRadius:10, overflow:"hidden", marginBottom:12 }}>
                    <div style={{ height:4, background:ROOM_TYPES[selected.type]?.color||"#888" }}/>
                    <div style={{ padding:14 }}>
                      <div style={{ fontSize:24, fontWeight:800, fontFamily:"var(--font-mono)", color:ROOM_TYPES[selected.type]?.color||"#888", marginBottom:4 }}>{selected.id}</div>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>{selected.name}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontFamily:"var(--font-mono)", padding:"2px 8px", borderRadius:4, background:(ROOM_TYPES[selected.type]?.color||"#888")+"18", color:ROOM_TYPES[selected.type]?.color||"#888" }}>
                          {ROOM_TYPES[selected.type]?.label}
                        </span>
                        <span style={{ fontSize:10, fontFamily:"var(--font-mono)", padding:"2px 8px", borderRadius:4, background:"var(--s3)", color:"var(--t2)" }}>{floorData?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Équipements placeholder */}
                  <div style={{ background:"rgba(0,200,150,.05)", border:"1px solid rgba(0,200,150,.15)", borderRadius:8, padding:12, marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"var(--acc)", marginBottom:6 }}>⚙️ Équipements</div>
                    <div style={{ fontSize:11, color:"var(--t2)", lineHeight:1.6 }}>
                      Aucune machine référencée dans cette zone.<br/>Ajoutez-les via la page <strong style={{color:"var(--t1)"}}>Équipements</strong>.
                    </div>
                    <a href="/equipments" style={{ display:"block", marginTop:10, background:"var(--acc)", color:"#000", borderRadius:6, padding:"7px 12px", fontSize:12, fontWeight:600, textDecoration:"none", textAlign:"center" }}>
                      + Ajouter un équipement
                    </a>
                  </div>

                  {/* Icônes sécu dans la zone */}
                  {(() => {
                    const zIcons = icons.filter((ic:any) =>
                      ic.x>=selected.x && ic.x<=selected.x+selected.w &&
                      ic.y>=selected.y && ic.y<=selected.y+selected.h
                    );
                    return zIcons.length>0 ? (
                      <div style={{ background:"var(--s2)", border:"1px solid var(--b0)", borderRadius:8, padding:12 }}>
                        <div style={{ fontSize:10, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:.8, color:"var(--t3)", marginBottom:8 }}>Sécurité dans la zone</div>
                        {zIcons.map((ic:any,i:number)=>{
                          const cfg=ICON_CFG[ic.type];
                          return (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--b0)", fontSize:12 }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:cfg.color, flexShrink:0 }}/>
                              <span>{cfg.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null;
                  })()}

                  <button onClick={()=>setSelected(null)} style={{ marginTop:10, background:"transparent", border:"1px solid var(--b1)", borderRadius:6, padding:"7px 12px", fontSize:12, color:"var(--t2)", cursor:"pointer", fontFamily:"var(--font-outfit)", width:"100%" }}>
                    ← Retour à la liste
                  </button>
                </div>
              )}
            </div>

            {/* Légende */}
            <div style={{ padding:"10px 14px", borderTop:"1px solid var(--b0)", display:"flex", flexDirection:"column", gap:4 }}>
              <div style={{ fontSize:9, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:1, color:"var(--t3)", marginBottom:4 }}>Légende</div>
              {Object.entries(ROOM_TYPES).map(([k,v])=>(
                <div key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"var(--t2)" }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:v.color, flexShrink:0 }}/>
                  {v.label}
                </div>
              ))}
              {showSafety&&<>
                <div style={{ fontSize:9, fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:1, color:"var(--t3)", marginTop:6, marginBottom:4 }}>Sécurité</div>
                {Object.entries(ICON_CFG).slice(0,4).map(([k,v])=>(
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"var(--t2)" }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:v.color+"33", border:`1px solid ${v.color}`, flexShrink:0 }}/>
                    {v.label}
                  </div>
                ))}
              </>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
