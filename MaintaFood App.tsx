import { useState, useCallback } from "react";

const ResponsiveContainer = ({ children, style }: any) => (
  <div style={{ width: "100%", height: "100%", ...(style || {}) }}>{children}</div>
);
const BarChart = ({ children, style }: any) => <div style={style}>{children}</div>;
const PieChart = ({ children, style }: any) => <div style={style}>{children}</div>;
const LineChart = ({ children, style }: any) => <div style={style}>{children}</div>;
const Bar = (_props: any) => null;
const XAxis = (_props: any) => null;
const YAxis = (_props: any) => null;
const CartesianGrid = (_props: any) => null;
const Tooltip = (_props: any) => null;
const Cell = (_props: any) => null;
const Pie = (_props: any) => null;
const Line = (_props: any) => null;

// ════════════════════════════════════════════════════════════
// BRAND CONFIG
// ════════════════════════════════════════════════════════════
const BRAND = {
  name: "MaintaFood",
  tagline: "GMAO · Industrie Alimentaire · Plateforme sécurisée",
  accent: "#22c55e",
  accentDim: "rgba(34,197,94,0.12)",
  accentHover: "#16a34a",
};

const LogoSVG = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" stroke={BRAND.accent} strokeWidth="4"/>
    <path d="M20 34c6-14 18-14 24 0" stroke={BRAND.accent} strokeWidth="4" strokeLinecap="round"/>
    <path d="M26 38h12" stroke={BRAND.accent} strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

// ════════════════════════════════════════════════════════════
// DATABASE LAYER — localStorage persistence
// ════════════════════════════════════════════════════════════
const DB_KEY = "maintafood_db_v1";
const DEFAULT_DB = {
  users: [
    { id:"u0", name:"Alexandre Moreau",  email:"admin@maintafood.io",  password:"Admin@2024!",  role:"admin",      color:"#e8643c", active:true, createdAt:"2024-01-01" },
    { id:"u1", name:"Bernard Lefebvre",  email:"chef@maintafood.io",   password:"Chef@2024!",   role:"chef",       color:"#a855f7", active:true, createdAt:"2024-01-01" },
    { id:"u2", name:"Lucas Martin",      email:"lucas@maintafood.io",  password:"Tech@2024!",   role:"technician", color:"#3c82e8", active:true, createdAt:"2024-01-01" },
    { id:"u3", name:"Sophie Bernard",    email:"sophie@maintafood.io", password:"Tech@2024!",   role:"technician", color:"#e8643c", active:true, createdAt:"2024-01-01" },
    { id:"u4", name:"Karim Benali",      email:"karim@maintafood.io",  password:"Tech@2024!",   role:"technician", color:"#3cb87a", active:true, createdAt:"2024-01-01" },
    { id:"u5", name:"Marie Durand",      email:"marie@maintafood.io",  password:"Tech@2024!",   role:"technician", color:"#f59e0b", active:true, createdAt:"2024-01-01" },
  ],
  equipments: [
    { id:"e1", name:"Compresseur Atlas #3",    location:"Atelier B",       zone:"B", category:"Pneumatique",   status:"ok",          foodSafe:false, serial:"ATL-003", manualRef:"ATL-C55-MAN", nextInspection:"2025-07-02", lastInspection:"2025-04-02", parts:["p1","p5"], color:"#3c82e8", x:14,y:24,w:14,h:10, description:"Compresseur à vis 11kW, pression max 13 bar." },
    { id:"e2", name:"Tour CNC Mazak",          location:"Usinage",         zone:"A", category:"Machine-outil", status:"maintenance", foodSafe:false, serial:"MAZ-T2", manualRef:"MAZ-QT2-MAN", nextInspection:"2025-06-15", lastInspection:"2025-01-15", parts:["p6","p7"], color:"#e8643c", x:35,y:10,w:16,h:12, description:"Tour CNC 2 axes, capacité Ø320mm." },
    { id:"e3", name:"Tapis convoyeur ligne A", location:"Production",      zone:"C", category:"Convoyeur",     status:"ok",          foodSafe:true,  serial:"CNV-A1", manualRef:"CNV-A1-MAN", nextInspection:"2025-08-18", lastInspection:"2025-02-18", parts:["p3","p4"], color:"#a855f7", x:55,y:42,w:18,h:8,  description:"Convoyeur bande PU alimentaire, vitesse 0.5-2m/s." },
    { id:"e4", name:"Groupe électrogène",      location:"Local technique", zone:"D", category:"Électrique",    status:"ok",          foodSafe:false, serial:"GRP-G1", manualRef:"GRP-G1-MAN", nextInspection:"2025-06-05", lastInspection:"2025-03-05", parts:["p5","p6"], color:"#f59e0b", x:70,y:10,w:14,h:10, description:"Groupe 45kVA, autonomie 8h." },
    { id:"e5", name:"Chambre froide +4°C",     location:"Zone stockage",   zone:"B", category:"Froid",         status:"ok",          foodSafe:true,  serial:"CF-001", manualRef:"CF-001-MAN", nextInspection:"2025-06-12", lastInspection:"2025-03-12", parts:["p2","p6"], color:"#06b6d4", x:14,y:42,w:14,h:14, description:"Chambre froide positive 18m³, R452A." },
    { id:"e6", name:"Doseuse automatique",     location:"Production",      zone:"C", category:"Dosage",         status:"ok",          foodSafe:true,  serial:"DOS-A2", manualRef:"DOS-A2-MAN", nextInspection:"2025-07-20", lastInspection:"2025-04-20", parts:["p2","p8"], color:"#22c55e", x:55,y:58,w:14,h:10, description:"Doseuse volumétrique inox AISI 316L." },
  ],
  stock: [
    { id:"p1", ref:"FLT-AIR-001", name:"Filtre à air 50µm",           category:"Filtration",   unit:"pcs", qty:2,  minQty:3, price:12.5,  location:"A1", locationDetail:"Armoire filtre, étagère 2", supplier:"Filtech SAS",    supplierRef:"FT-50-A1",  supplierContact:"03 20 11 22 33", compatibleWith:["e1"] },
    { id:"p2", ref:"JNT-INOX-022",name:"Joint EPDM alimentaire Ø22",  category:"Joints",       unit:"pcs", qty:8,  minQty:5, price:3.2,   location:"B2", locationDetail:"Tiroir joints alim.",        supplier:"JointPro",       supplierRef:"EP-022-FG", supplierContact:"03 20 33 44 55", compatibleWith:["e5","e6"] },
    { id:"p3", ref:"RLT-6205-2RS",name:"Roulement 6205-2RS inox",     category:"Roulements",   unit:"pcs", qty:1,  minQty:2, price:18.9,  location:"C1", locationDetail:"Bac roulements inox",        supplier:"SKF France",     supplierRef:"6205-2RS",  supplierContact:"01 47 56 78 90", compatibleWith:["e3"] },
    { id:"p4", ref:"BND-PU-600",  name:"Bande PU alimentaire 600mm",  category:"Convoyeurs",   unit:"m",   qty:0,  minQty:1, price:145,   location:"C3", locationDetail:"Rack convoyage, sol",        supplier:"ConveyBelt FR",  supplierRef:"PU-600-AA", supplierContact:"02 40 88 99 11", compatibleWith:["e3"] },
    { id:"p5", ref:"HUI-FG-VG46", name:"Huile alimentaire FG VG46",   category:"Lubrifiants",  unit:"bidon",qty:4, minQty:2, price:28.5,  location:"D1", locationDetail:"Local technique, sol",       supplier:"Klüber Lubrication",supplierRef:"KLÜBER-FG46",supplierContact:"03 88 12 34 56",compatibleWith:["e1","e4"] },
    { id:"p6", ref:"FUS-10A-250V",name:"Fusible 10A 250V",            category:"Électrique",   unit:"pcs", qty:15, minQty:5, price:1.1,   location:"A3", locationDetail:"Armoire élec., tiroir F",   supplier:"Schneider Elec.", supplierRef:"DF2BA10",   supplierContact:"0800 003 353",   compatibleWith:["e2","e4","e5"] },
    { id:"p7", ref:"CON-MOT-LC1D",name:"Contacteur moteur LC1D09",    category:"Électrique",   unit:"pcs", qty:3,  minQty:2, price:42.0,  location:"A2", locationDetail:"Armoire élec., étagère 1",  supplier:"Schneider Elec.", supplierRef:"LC1D09B7",  supplierContact:"0800 003 353",   compatibleWith:["e2"] },
    { id:"p8", ref:"VAN-INOX-24V",name:"Vanne inox solénoïde 24V",    category:"Pneumatique",  unit:"pcs", qty:1,  minQty:2, price:89.0,  location:"B1", locationDetail:"Armoire pneumatique A",     supplier:"Inoxia Pro",     supplierRef:"VN-24-316", supplierContact:"04 72 33 44 55", compatibleWith:["e6"] },
  ],
  interventions: [
    { id:"i1", title:"Fuite huile compresseur joint principal", equipmentId:"e1", technicianId:"u2", createdBy:"u1", status:"valide",   priority:"critique", createdAt:"2025-01-08T08:00:00", updatedAt:"2025-01-08T11:30:00", description:"Fuite constatée au niveau du joint principal.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:true,  report:{ completedAt:"2025-01-08T11:30:00", duration:"210", actions:"Remplacement joint principal + vidange huile complète. Vérification étanchéité sous pression.", observations:"Joint d'origine défaillant après 3 ans de service.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u2" } },
    { id:"i2", title:"Recalibration axe Z CNC",                equipmentId:"e2", technicianId:"u3", createdBy:"u1", status:"valide",   priority:"haute",    createdAt:"2025-01-15T09:00:00", updatedAt:"2025-01-15T12:00:00", description:"Dérive mesurée sur l'axe Z, tolérance dépassée.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:false, report:{ completedAt:"2025-01-15T12:00:00", duration:"180", actions:"Recalibration complète axe Z, vérification jeu mécanique et compensation thermique.", observations:"Dérive de 0.08mm corrigée à 0.01mm.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u3" } },
    { id:"i3", title:"Nettoyage CIP doseuse ligne A",           equipmentId:"e6", technicianId:"u4", createdBy:"u1", status:"valide",   priority:"normale",  createdAt:"2025-02-03T07:00:00", updatedAt:"2025-02-03T09:30:00", description:"Nettoyage préventif hebdomadaire CIP.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:false, report:{ completedAt:"2025-02-03T09:30:00", duration:"150", actions:"Cycle CIP complet : prérinçage eau froide, lavage soude 2%, rinçage, désinfection acide peracétique, rinçage final.", observations:"RAS — conforme protocole HACCP.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u4" } },
    { id:"i4", title:"Remplacement roulement convoyeur",        equipmentId:"e3", technicianId:"u2", createdBy:"u1", status:"valide",   priority:"haute",    createdAt:"2025-02-18T10:00:00", updatedAt:"2025-02-18T13:00:00", description:"Bruit anormal côté moteur, vibrations mesurées.", photos:[], comments:[], partsUsed:[{id:"p3",qty:1}], foodImpact:false, productionStopped:true,  report:{ completedAt:"2025-02-18T13:00:00", duration:"180", actions:"Démontage motoréducteur, remplacement roulement 6205-2RS inox, remontage et alignement laser.", observations:"Roulement usé prématurément — vérifier alignement.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u2" } },
    { id:"i5", title:"Contrôle groupe électrogène mensuel",     equipmentId:"e4", technicianId:"u5", createdBy:"u1", status:"valide",   priority:"normale",  createdAt:"2025-03-05T08:00:00", updatedAt:"2025-03-05T09:30:00", description:"Contrôle mensuel préventif.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:false, report:{ completedAt:"2025-03-05T09:30:00", duration:"90",  actions:"Contrôle huile, niveau eau, batterie, test démarrage automatique 10 minutes.", observations:"Huile à changer au prochain cycle (500h).", hygieneRespected:true, cleaningDone:false, verdict:"conforme", signedBy:"u5" } },
    { id:"i6", title:"Alarme température chambre froide",       equipmentId:"e5", technicianId:"u3", createdBy:"u1", status:"valide",   priority:"critique", createdAt:"2025-03-12T02:00:00", updatedAt:"2025-03-12T04:00:00", description:"Alarme +8°C déclenchée à 2h du matin.", photos:[], comments:[], partsUsed:[], foodImpact:true,  productionStopped:false, report:{ completedAt:"2025-03-12T04:00:00", duration:"120", actions:"Diagnostic : sonde NTC défaillante. Remplacement sonde + recalibration régulateur froid. Vérification stock (T°C maintenue < 6°C).", observations:"Stock non compromis — température max relevée 7.2°C pendant 45 min.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u3" } },
    { id:"i7", title:"Maintenance préventive compresseur",      equipmentId:"e1", technicianId:"u2", createdBy:"u1", status:"valide",   priority:"normale",  createdAt:"2025-04-02T08:00:00", updatedAt:"2025-04-02T11:00:00", description:"Maintenance 2000h selon plan constructeur.", photos:[], comments:[], partsUsed:[{id:"p1",qty:1},{id:"p5",qty:1}], foodImpact:false, productionStopped:false, report:{ completedAt:"2025-04-02T11:00:00", duration:"180", actions:"Changement filtre air + filtre huile, vidange huile compresseur, vérification courroie et tension, test pression.", observations:"Courroie à surveiller — usure 60%.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u2" } },
    { id:"i8", title:"Panne vanne solénoïde doseuse",           equipmentId:"e6", technicianId:"u4", createdBy:"u1", status:"valide",   priority:"critique", createdAt:"2025-04-20T14:00:00", updatedAt:"2025-04-20T16:30:00", description:"Arrêt ligne — vanne bloquée fermée.", photos:[], comments:[], partsUsed:[{id:"p8",qty:1}], foodImpact:true,  productionStopped:true,  report:{ completedAt:"2025-04-20T16:30:00", duration:"150", actions:"Remplacement vanne inox solénoïde 24V + test étanchéité sous pression + contrôle temps réponse.", observations:"Vanne d'origine — 4 ans de service. Prévoir stock 2 unités.", hygieneRespected:true, cleaningDone:true, verdict:"conforme", signedBy:"u4" } },
    { id:"i9", title:"Contrôle convoyeur ligne A",              equipmentId:"e3", technicianId:"u5", createdBy:"u1", status:"en_cours", priority:"normale",  createdAt:"2025-05-10T09:00:00", updatedAt:"2025-05-10T09:00:00", description:"Contrôle trimestriel tension bande et graissage.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:false, report:null },
    { id:"i10",title:"Fuite circuit hydraulique CNC",           equipmentId:"e2", technicianId:"u3", createdBy:"u1", status:"a_faire",  priority:"haute",    createdAt:"2025-05-25T08:00:00", updatedAt:"2025-05-25T08:00:00", description:"Tache huile sous le bâti CNC — localisation à faire.", photos:[], comments:[], partsUsed:[], foodImpact:false, productionStopped:false, report:null },
  ],
  stockMoves: [],
  auditLog: [
    { id:"a1", date:"2025-04-20T08:30:00", userId:"u1", action:"Création intervention", target:"Panne vanne solénoïde doseuse", detail:"Priorité critique" },
    { id:"a2", date:"2025-04-18T14:30:00", userId:"u4", action:"Rapport signé",         target:"Nettoyage CIP doseuse",        detail:"Verdict : conforme" },
    { id:"a3", date:"2025-04-02T11:00:00", userId:"u2", action:"Rapport signé",         target:"Maintenance préventive compresseur", detail:"Verdict : conforme" },
  ],
  siteConfig: { name:"Usine Agroalimentaire Nord", address:"ZI des Bruyères, 59000 Lille", siret:"823 456 789 00012", certifications:"IFS Food v8 · BRC · ISO 22000" },
};

function useDB() {
  const [db, setDbRaw] = useState(() => {
    try { const s = localStorage.getItem(DB_KEY); if (s) return JSON.parse(s); } catch {}
    return DEFAULT_DB;
  });
  const setDb = useCallback((updater) => {
    setDbRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(DB_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const resetDb = () => { localStorage.removeItem(DB_KEY); setDbRaw(DEFAULT_DB); };
  return { db, setDb, resetDb };
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════
const ROLES = {
  admin:      { label:"Administrateur",  color:"#e8643c", perms:["all"] },
  chef:       { label:"Chef technique",  color:"#a855f7", perms:["create_task","edit_intervention","view_audit"] },
  technician: { label:"Technicien",      color:"#3c82e8", perms:["fill_report","change_status"] },
};
const STATUS = {
  a_faire:  { label:"À faire",  color:"#f59e0b", bg:"rgba(245,158,11,.12)" },
  en_cours: { label:"En cours", color:"#3c82e8", bg:"rgba(60,130,232,.12)" },
  termine:  { label:"Terminé",  color:"#3cb87a", bg:"rgba(60,184,122,.12)" },
  valide:   { label:"Validé",   color:"#a855f7", bg:"rgba(168,85,247,.12)" },
};
const PRIO = {
  normale:  { label:"Normale",  color:"#8b9bb4" },
  haute:    { label:"Haute",    color:"#f59e0b" },
  critique: { label:"Critique", color:"#ef4444" },
};
const EQS = {
  ok:          { label:"Opérationnel", color:"#3cb87a" },
  panne:       { label:"En panne",     color:"#ef4444" },
  maintenance: { label:"Maintenance",  color:"#f59e0b" },
};

const canDo = (user, perm) => user?.role === "admin" || ROLES[user?.role]?.perms.includes("all") || ROLES[user?.role]?.perms.includes(perm);
const genId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

// ════════════════════════════════════════════════════════════
// ICONS
// ════════════════════════════════════════════════════════════
const IC = ({ n, s = 18 }) => {
  const p = {
    home:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    map:     "M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z",
    tool:    "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    box:     "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
    users:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 3a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
    audit:   "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    alert:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
    plus:    "M12 5v14 M5 12h14",
    x:       "M18 6L6 18 M6 6l12 12",
    check:   "M20 6L9 17l-5-5",
    arrow:   "M5 12h14 M12 5l7 7-7 7",
    logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
    cam:     "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 9a4 4 0 100 8 4 4 0 000-8z",
    pen:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    info:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 8h.01 M11 12h1v4h1",
    file:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    clock:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
    trash:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
    settings:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    mobile:  "M12 18h.01 M8 6h8 M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z",
    download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    msg:     "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    chart:   "M18 20V10 M12 20V4 M6 20v-6",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {p[n]?.split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
};

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0f14;--s1:#111827;--s2:#161c26;--s3:#1f2937;--s4:#252f3e;
  --b0:rgba(255,255,255,0.04);--b1:rgba(255,255,255,0.08);--b2:rgba(255,255,255,0.14);
  --t1:#e4e8f0;--t2:#9ca3af;--t3:#374151;
  --acc:#22c55e;--acc-dim:rgba(34,197,94,0.12);--acc-hover:#16a34a;
  --red:#ff4757;--yel:#ffa502;--blu:#3c82e8;--pur:#a855f7;
  --ff:'Outfit',sans-serif;--fm:'JetBrains Mono',monospace;
  --r:10px;--r2:6px;--r3:14px;
}
html,body{height:100%;background:var(--bg);color:var(--t1);font-family:var(--ff);font-size:14px;line-height:1.5}
/* ─ LAYOUT ─ */
.app{display:flex;height:100dvh;overflow:hidden}
.sidebar{width:224px;min-width:224px;background:var(--s1);border-right:1px solid var(--b0);display:flex;flex-direction:column}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:52px;min-height:52px;background:var(--s1);border-bottom:1px solid var(--b0);display:flex;align-items:center;padding:0 20px;gap:12px}
.content{flex:1;overflow-y:auto;padding:20px}
/* ─ SIDEBAR ─ */
.logo-wrap{padding:16px 14px 12px;border-bottom:1px solid var(--b0)}
.logo-badge{display:inline-flex;align-items:center;gap:10px}
.logo-text{font-size:17px;font-weight:800;color:var(--acc);letter-spacing:-.4px}
.logo-sub{font-family:var(--fm);font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-top:3px}
.nav{flex:1;padding:8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-sec{font-family:var(--fm);font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--t3);padding:8px 10px 4px}
.ni{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:var(--r2);cursor:pointer;color:var(--t2);font-size:13px;font-weight:500;border:none;background:transparent;width:100%;text-align:left;position:relative;transition:all .1s}
.ni:hover{color:var(--t1);background:var(--b0)}
.ni.on{color:var(--t1);background:var(--b1)}
.ni.on::before{content:'';position:absolute;left:0;top:20%;height:60%;width:2.5px;background:var(--acc);border-radius:0 2px 2px 0}
.nbadge{margin-left:auto;background:var(--red);color:#fff;font-size:9px;font-family:var(--fm);padding:1px 5px;border-radius:10px;font-weight:700}
.nbadge.y{background:var(--yel);color:#000}
.sfooter{margin:8px;padding:10px;background:var(--s3);border-radius:var(--r2);display:flex;align-items:center;gap:8px}
.sf-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sf-role{font-family:var(--fm);font-size:9px;color:var(--t2);margin-top:1px}
.av{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--fm);font-weight:700;flex-shrink:0}
/* ─ MOBILE NAV ─ */
.mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;background:var(--s1);border-top:1px solid var(--b0)}
.mnav-items{display:flex}
.mnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border:none;background:transparent;color:var(--t2);font-size:9px;font-family:var(--ff);cursor:pointer;position:relative}
.mnav-btn.on{color:var(--acc)}
/* ─ BUTTONS ─ */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--r2);font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:var(--ff);transition:all .12s;white-space:nowrap}
.btn-p{background:var(--acc);color:#000}
.btn-p:hover{background:var(--acc-hover);transform:translateY(-1px)}
.btn-g{background:transparent;color:var(--t2);border:1px solid var(--b1)}
.btn-g:hover{border-color:var(--b2);color:var(--t1)}
.btn-r{background:transparent;color:var(--red);border:1px solid rgba(255,71,87,.25)}
.btn-r:hover{background:rgba(255,71,87,.08)}
.btn-sm{padding:5px 10px;font-size:12px}
.btn-xs{padding:3px 8px;font-size:11px}
.btn-icon{padding:6px;width:34px;height:34px;justify-content:center}
.btn-full{width:100%;justify-content:center;padding:11px}
/* ─ CARDS ─ */
.card{background:var(--s1);border:1px solid var(--b0);border-radius:var(--r);overflow:hidden}
.card:hover{border-color:var(--b1)}
.ch{padding:14px 18px 12px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:8px}
.cht{font-size:14px;font-weight:700;flex:1}
.cb{padding:16px 18px}
/* ─ KPI STATS ─ */
.stat{background:var(--s1);border:1px solid var(--b0);border-radius:var(--r);padding:16px;position:relative;overflow:hidden;transition:all .15s;cursor:default}
.stat:hover{border-color:var(--b1);transform:translateY(-1px)}
.stat-v{font-size:32px;font-weight:800;line-height:1;margin-bottom:2px;font-family:var(--fm)}
.stat-l{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--t2)}
.stat-sub{font-size:10px;color:var(--t3);margin-top:5px;font-family:var(--fm)}
.stat-bg{position:absolute;right:-6px;top:-6px;opacity:.05;pointer-events:none}
.stat-trend{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-family:var(--fm);padding:2px 7px;border-radius:20px;margin-top:6px}
/* ─ TABLE ─ */
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-size:10px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.8px;color:var(--t2);padding:10px 14px;border-bottom:1px solid var(--b0);text-align:left;white-space:nowrap}
.tbl td{padding:11px 14px;border-bottom:1px solid var(--b0);vertical-align:middle}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .08s;cursor:pointer}
.tbl tbody tr:hover{background:rgba(255,255,255,.015)}
/* ─ BADGE / TAG ─ */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.bdot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:4px;font-size:11px;background:var(--s3);color:var(--t2)}
.food-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:rgba(34,197,94,.1);color:var(--acc);border:1px solid rgba(34,197,94,.2)}
/* ─ MODAL ─ */
.ov{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center}
.modal{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r3) var(--r3) 0 0;width:100%;max-width:720px;max-height:92dvh;display:flex;flex-direction:column;animation:slideUp .2s ease}
.modal.center{border-radius:var(--r3);max-height:90dvh;align-self:center;margin:20px}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:18px 20px 14px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:10px}
.mt{font-size:17px;font-weight:700}
.mb{padding:18px 20px;display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.mf{padding:12px 20px;border-top:1px solid var(--b0);display:flex;gap:8px;justify-content:flex-end}
/* ─ FORM ─ */
.fg{display:flex;flex-direction:column;gap:5px}
.fl{font-size:10px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.6px}
.fi,.fsel,.fta{background:var(--s3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);padding:9px 12px;font-size:13px;font-family:var(--ff);outline:none;transition:border-color .1s}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--acc);box-shadow:0 0 0 2px rgba(34,197,94,.15)}
.fta{resize:vertical;min-height:80px;line-height:1.5}
.fsel option{background:var(--s3)}
.fi::placeholder{color:var(--t3)}
/* ─ GRID ─ */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
/* ─ ALERT BAR ─ */
.alert-bar{padding:8px 14px;border-radius:var(--r2);font-size:12px;display:flex;align-items:center;gap:8px}
/* ─ REPORT FORM ─ */
.step-indicator{display:flex;align-items:center;gap:6px;padding:12px 16px;border-bottom:1px solid var(--b0)}
.step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-family:var(--fm);flex-shrink:0;transition:all .2s}
.checkbox-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--s4);border-radius:var(--r2);cursor:pointer}
.checkbox-row input{width:16px;height:16px;accent-color:var(--acc);cursor:pointer}
.report-section{background:var(--s3);border:1px solid var(--b0);border-radius:var(--r2);padding:12px}
.report-label{font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:var(--t2);margin-bottom:8px}
.photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.photo-thumb{aspect-ratio:1;background:var(--s4);border:1px dashed var(--b1);border-radius:var(--r2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:10px;color:var(--t2);cursor:pointer;transition:all .1s}
.photo-thumb:hover{border-color:var(--acc);color:var(--acc)}
.photo-thumb.filled{background:var(--s3);border-style:solid;border-color:var(--b1)}
.verdict-btn{flex:1;padding:12px 8px;border-radius:var(--r2);border:1px solid var(--b1);background:var(--s4);color:var(--t1);cursor:pointer;font-size:13px;font-weight:600;font-family:var(--ff);transition:all .12s}
/* ─ AUDIT ─ */
.audit-row{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--b0)}
.audit-time{font-family:var(--fm);font-size:10px;color:var(--t2);white-space:nowrap;padding-top:2px}
.audit-dot{width:8px;height:8px;border-radius:50%;background:var(--acc);flex-shrink:0;margin-top:4px}
/* ─ SITE PLAN ─ */
.plan-container{background:var(--bg);border:1px solid var(--b0);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
.plan-toolbar{padding:10px 14px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.plan-legend{padding:8px 14px;border-top:1px solid var(--b0);display:flex;gap:16px;flex-wrap:wrap}
.pleg{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--t2);font-family:var(--fm)}
/* ─ PDF DOC ─ */
.doc-wrap{background:#fff;color:#111;font-family:'Outfit',sans-serif;padding:36px}
.doc-header-pdf{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid #22c55e}
.doc-logo-pdf{font-size:20px;font-weight:800;color:#22c55e}
.doc-section-pdf{margin-bottom:18px}
.doc-section-title-pdf{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#999;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #eee}
.doc-field-pdf{background:#f8f9fa;border-radius:6px;padding:11px}
.doc-field-label-pdf{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
.doc-field-value-pdf{font-size:13px;font-weight:600;color:#111}
.doc-check-pdf{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 10px;border-radius:4px;margin-bottom:5px}
/* ─ CHART TOOLTIP ─ */
.ctt{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r2);padding:10px 14px;font-family:var(--fm);font-size:11px}
/* ─ UTILS ─ */
.flex{display:flex}.fai{align-items:center}.fjb{justify-content:space-between}.fdc{flex-direction:column}.fwrap{flex-wrap:wrap}
.g4p{gap:4px}.g6{gap:6px}.g8{gap:8px}.g10{gap:10px}.g12{gap:12px}.g16{gap:16px}.g20{gap:20px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.mb20{margin-bottom:20px}
.pt{font-size:20px;font-weight:800;letter-spacing:-.3px;margin-bottom:2px}
.ps{font-size:12.5px;color:var(--t2);margin-bottom:18px}
.tm{color:var(--t2)}.ts{font-size:12px}.tmo{font-family:var(--fm);font-size:11px}
.sep{height:1px;background:var(--b0);margin:14px 0}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:var(--t2);font-size:13px}
.fw7{font-weight:700}.fw6{font-weight:600}
.clamp1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:var(--b1);border-radius:2px}
/* ─ AUTH ─ */
.auth{min-height:100dvh;display:flex;background:var(--bg)}
.auth-left{flex:1;background:radial-gradient(circle at top left,#1f2937,#0b0f14);display:flex;flex-direction:column;justify-content:center;padding:60px;position:relative;overflow:hidden}
.auth-left::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 30% 40%,rgba(34,197,94,.07),transparent);pointer-events:none}
.auth-right{flex:1;display:flex;justify-content:center;align-items:center;padding:20px}
.auth-box{width:100%;max-width:360px;background:var(--s1);padding:32px;border-radius:var(--r3);border:1px solid var(--b1)}
.auth-demo{margin-top:20px;background:var(--s3);border-radius:var(--r2);border:1px solid var(--b0);padding:10px}
.auth-demo-title{font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--t3);margin-bottom:8px}
.auth-demo-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:5px;cursor:pointer}
.auth-demo-row:hover{background:var(--b0)}
.auth-err{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.25);border-radius:var(--r2);padding:8px 12px;font-size:12px;color:var(--red)}
/* ─ RESPONSIVE ─ */
@media(max-width:768px){
  .sidebar{display:none}
  .mobile-nav{display:block}
  .content{padding:12px!important;padding-bottom:72px!important}
  .hide-mobile{display:none!important}
  .g4{grid-template-columns:1fr 1fr!important}
  .g3{grid-template-columns:1fr!important}
  .g2{grid-template-columns:1fr!important}
  .topbar{padding:0 12px;height:48px;min-height:48px}
  .pt{font-size:17px}
  .fi,.fsel,.fta{font-size:16px!important;padding:12px 14px!important}
  .modal{max-width:100%!important;max-height:95dvh!important}
  .modal.center{border-radius:14px 14px 0 0!important;margin:0!important;align-self:flex-end!important}
  .auth-left{display:none}
  .auth-right{background:var(--bg)}
}
@media(min-width:769px){
  .hide-desktop-show-mobile{display:none!important}
}
`;

// ════════════════════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════════════════════
function AuthScreen({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = () => {
    if (loading) return;
    setLoading(true); setErr("");
    setTimeout(() => {
      const u = users.find(u => u.email === email.trim().toLowerCase() && u.password === pass);
      if (u) { onLogin(u); }
      else { setErr("Email ou mot de passe incorrect."); setLoading(false); }
    }, 150);
  };

  return (
    <div className="auth">
      {/* LEFT */}
      <div className="auth-left">
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
          <LogoSVG size={48} />
          <div>
            <div style={{ fontSize:32, fontWeight:800, color:BRAND.accent, letterSpacing:"-.5px" }}>MaintaFood</div>
            <div style={{ fontSize:12, color:"var(--t2)", marginTop:2 }}>GMAO · Industrie Alimentaire</div>
          </div>
        </div>
        <p style={{ color:"#9ca3af", maxWidth:400, fontSize:15, lineHeight:1.7, marginBottom:32 }}>
          Gérez la maintenance de vos équipements agroalimentaires avec une plateforme simple, fiable et conforme HACCP.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {["✅ Conformité IFS Food v8 · BRC · ISO 22000", "📄 Rapports PDF signés et horodatés", "📊 KPIs de maintenance en temps réel", "🛡 Traçabilité complète pour les audits"].map(t => (
            <div key={t} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#9ca3af" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:BRAND.accent, flexShrink:0 }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <div className="auth-box">
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <LogoSVG size={30} />
            <div style={{ fontSize:20, fontWeight:800, color:BRAND.accent }}>MaintaFood</div>
          </div>
          <div style={{ fontSize:13, color:"var(--t2)", marginBottom:24 }}>Connexion à votre espace</div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div className="fg">
              <label className="fl">Email</label>
              <input className="fi" type="email" placeholder="votre@email.fr" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} />
            </div>
            <div className="fg">
              <label className="fl">Mot de passe</label>
              <input className="fi" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} />
            </div>
            {err && <div className="auth-err">⚠ {err}</div>}
            <button className="btn btn-p btn-full" style={{ marginTop:4, background:BRAND.accent }} onClick={doLogin} disabled={loading}>
              {loading ? "Connexion…" : <><IC n="arrow" s={15} /> Se connecter</>}
            </button>
            <div style={{ fontSize:11, color:"var(--t2)", textAlign:"center", cursor:"pointer" }}>Mot de passe oublié ?</div>
          </div>

          <div className="auth-demo">
            <div className="auth-demo-title">Comptes de démonstration</div>
            {users.map(u => (
              <div key={u.id} className="auth-demo-row" onClick={() => { setEmail(u.email); setPass(u.password); }}>
                <div className="av" style={{ width:22, height:22, fontSize:9, background:u.color+"22", color:u.color }}>{u.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500 }}>{u.name}</div>
                  <div style={{ fontSize:10, fontFamily:"var(--fm)", color:"var(--t2)" }}>{u.email}</div>
                </div>
                <span style={{ fontSize:9, fontFamily:"var(--fm)", background:ROLES[u.role].color+"18", color:ROLES[u.role].color, padding:"1px 6px", borderRadius:4 }}>
                  {ROLES[u.role].label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:"var(--t3)" }}>
            🔒 Connexion sécurisée · Données hébergées en Europe
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// KPI DASHBOARD
// ════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ctt">
      <div style={{ color:"var(--t2)", marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, fontWeight:700 }}>{p.name} : {p.value}</div>
      ))}
    </div>
  );
};

function calcKPIs(db) {
  const done = db.interventions.filter(i => i.report);
  const totalMin = done.reduce((s, i) => s + parseInt(i.report?.duration || 0), 0);
  const avgDur = done.length ? Math.round(totalMin / done.length) : 0;
  const conformes = done.filter(i => i.report?.verdict === "conforme").length;
  const conformRate = done.length ? Math.round((conformes / done.length) * 100) : 100;
  const months = ["Jan","Fév","Mar","Avr","Mai"];
  const byMonth = [1,2,3,4,5].map((m, idx) => ({
    mois: months[idx],
    total: db.interventions.filter(i => new Date(i.createdAt).getMonth()+1 === m).length,
    critiques: db.interventions.filter(i => new Date(i.createdAt).getMonth()+1 === m && i.priority==="critique").length,
  }));
  const mtbf = db.equipments.map(eq => ({
    name: eq.name.slice(0,16),
    pannes: db.interventions.filter(i => i.equipmentId === eq.id && i.report).length,
  }));
  const pieData = [
    { name:"Validés",  value:db.interventions.filter(i=>i.status==="valide").length,   color:"#a855f7" },
    { name:"Terminés", value:db.interventions.filter(i=>i.status==="termine").length,  color:"#22c55e" },
    { name:"En cours", value:db.interventions.filter(i=>i.status==="en_cours").length, color:"#3c82e8" },
    { name:"À faire",  value:db.interventions.filter(i=>i.status==="a_faire").length,  color:"#f59e0b" },
  ].filter(s => s.value > 0);
  return { done:done.length, avgDur, conformRate, byMonth, mtbf, pieData,
    foodRisk: db.interventions.filter(i=>i.foodImpact&&i.status!=="valide").length,
    critique: db.interventions.filter(i=>i.priority==="critique").length,
    prodStop: db.interventions.filter(i=>i.productionStopped).length,
  };
}

function Dashboard({ db, currentUser, setPage, onOpenPDF }) {
  const kpi = calcKPIs(db);
  const lowStock = db.stock.filter(p => p.qty <= p.minQty);
  const myOT = currentUser.role==="technician" ? db.interventions.filter(i=>i.technicianId===currentUser.id) : db.interventions;
  const upcoming = db.equipments.map(eq=>({...eq,days:Math.floor((new Date(eq.nextInspection)-new Date())/86400000)})).sort((a,b)=>a.days-b.days).slice(0,4);

  const statsTop = currentUser.role==="technician" ? [
    {l:"Mes OT",        v:myOT.length,                                       c:"var(--acc)",  sub:`${myOT.filter(i=>i.status==="a_faire").length} à faire`},
    {l:"En cours",      v:myOT.filter(i=>i.status==="en_cours").length,      c:"var(--blu)",  sub:"interventions actives"},
    {l:"Terminés",      v:myOT.filter(i=>["termine","valide"].includes(i.status)).length, c:"var(--pur)", sub:"ce mois"},
    {l:"Rapports signés",v:myOT.filter(i=>i.report).length,                  c:"var(--acc)",  sub:"documents PDF"},
  ] : [
    {l:"Équipements",   v:db.equipments.length,                              c:"var(--acc)",  sub:`${db.equipments.filter(e=>e.status==="panne").length} en panne`},
    {l:"Conformité",    v:`${kpi.conformRate}%`,                             c:kpi.conformRate>=90?"var(--acc)":"var(--yel)", sub:"IFS/BRC · obj ≥95%"},
    {l:"OT en attente", v:db.interventions.filter(i=>i.status==="a_faire").length, c:"var(--yel)", sub:"à planifier"},
    {l:"Alertes alim.", v:kpi.foodRisk,                                      c:kpi.foodRisk>0?"var(--red)":"var(--acc)", sub:"risques non clôturés"},
  ];

  return (
    <div>
      <div className="pt">Bonjour, {currentUser.name.split(" ")[0]} 👋</div>
      <div className="ps">{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>

      {kpi.foodRisk>0 && <div className="alert-bar mb16" style={{background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)"}}>
        <IC n="shield" s={16}/> {kpi.foodRisk} intervention(s) avec risque alimentaire non clôturée(s) — action requise
      </div>}
      {lowStock.length>0 && <div className="alert-bar mb16" style={{background:"rgba(255,165,2,.08)",border:"1px solid rgba(255,165,2,.2)"}}>
        <IC n="box" s={16}/> {lowStock.length} référence(s) en stock critique
      </div>}

      {/* KPI Row */}
      <div className="g4 mb20">
        {statsTop.map(s => (
          <div className="stat" key={s.l}>
            <div className="stat-v" style={{color:s.c}}>{s.v}</div>
            <div className="stat-l">{s.l}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {currentUser.role !== "technician" && (
        <div className="g2 mb20">
          {/* Bar chart */}
          <div className="card">
            <div className="ch"><IC n="chart" s={15}/><span className="cht">Interventions par mois</span><span style={{fontSize:10,color:"var(--t2)",fontFamily:"var(--fm)"}}>2025</span></div>
            <div className="cb">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={kpi.byMonth} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                  <XAxis dataKey="mois" tick={{fill:"var(--t2)",fontSize:11,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--t2)",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="total" name="Total" fill={BRAND.accent} radius={[4,4,0,0]} opacity={0.7}/>
                  <Bar dataKey="critiques" name="Critiques" fill="var(--red)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie */}
          <div className="card">
            <div className="ch"><IC n="chart" s={15}/><span className="cht">Répartition par statut</span></div>
            <div className="cb">
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={kpi.pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                      {kpi.pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                  {kpi.pieData.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                      <span style={{color:"var(--t2)",flex:1}}>{s.name}</span>
                      <span style={{fontFamily:"var(--fm)",fontWeight:700,color:s.color}}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="g2">
        {/* Liste OT */}
        <div className="card">
          <div className="ch"><IC n="tool" s={15}/><span className="cht">{currentUser.role==="technician"?"Mes interventions":"Dernières interventions"}</span></div>
          {myOT.slice(0,6).map(i=>{
            const eq=db.equipments.find(e=>e.id===i.equipmentId);
            const sc=STATUS[i.status];
            return (
              <div key={i.id} className="flex fai g10" style={{padding:"10px 16px",borderBottom:"1px solid var(--b0)"}}>
                <div style={{width:3,height:34,background:sc.color,borderRadius:2,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>
                  <div className="ts tm">{eq?.name} {i.productionStopped&&<span style={{color:"var(--red)",fontSize:10}}>⚠ Prod.</span>}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <span className="badge" style={{background:sc.bg,color:sc.color,fontSize:10}}>{sc.label}</span>
                  {i.report && <button className="btn btn-p btn-xs" onClick={()=>onOpenPDF(i)}>PDF</button>}
                </div>
              </div>
            );
          })}
          {myOT.length===0 && <div className="empty"><IC n="check" s={28}/><span>Aucune intervention</span></div>}
        </div>

        <div>
          {/* Inspections */}
          <div className="card mb12">
            <div className="ch"><IC n="clock" s={15}/><span className="cht">Prochaines inspections</span></div>
            <div className="cb">
              {upcoming.map(eq=>{
                const urgent=eq.days<30;
                return (
                  <div key={eq.id} className="flex fai fjb mb8">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{eq.name}</div>
                      <div className="ts tm">{fmtDate(eq.nextInspection)}</div>
                    </div>
                    <span style={{fontSize:11,fontFamily:"var(--fm)",color:urgent?"var(--red)":"var(--t2)",flexShrink:0}}>
                      {eq.days>0?`J−${eq.days}`:"Dépassé"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certifications */}
          <div className="card" style={{border:`1px solid rgba(34,197,94,.15)`,background:"rgba(34,197,94,.03)"}}>
            <div className="cb">
              <div className="flex fai g8 mb8" style={{color:"var(--acc)"}}><IC n="shield" s={15}/><span style={{fontWeight:700,fontSize:13}}>Certifications actives</span></div>
              <div className="ts tm" style={{lineHeight:1.7}}>{db.siteConfig.certifications}</div>
              <div className="tmo tm" style={{marginTop:6}}>SIRET : {db.siteConfig.siret}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PDF EXPORT
// ════════════════════════════════════════════════════════════
function PDFDoc({ interv, db }) {
  const eq = db.equipments.find(e=>e.id===interv.equipmentId);
  const tech = db.users.find(u=>u.id===interv.technicianId);
  const r = interv.report;
  const PRIO_C = {normale:"#6b7280",haute:"#f59e0b",critique:"#ef4444"};
  return (
    <div className="doc-wrap" id="pdf-doc">
      <div className="doc-header-pdf">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="#22c55e" strokeWidth="4"/><path d="M20 34c6-14 18-14 24 0" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"/><path d="M26 38h12" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"/></svg>
            <div className="doc-logo-pdf">MaintaFood</div>
          </div>
          <div style={{fontSize:10,color:"#999",fontFamily:"monospace"}}>RAPPORT D'INTERVENTION — GMAO</div>
        </div>
        <div style={{textAlign:"right",fontSize:11,color:"#666",lineHeight:1.6}}>
          <div style={{fontWeight:700,fontSize:12,color:"#111"}}>{db.siteConfig.name}</div>
          <div>{db.siteConfig.address}</div>
          <div>SIRET : {db.siteConfig.siret}</div>
          <div style={{color:"#22c55e",fontWeight:600,marginTop:2}}>{db.siteConfig.certifications}</div>
        </div>
      </div>

      <div style={{fontSize:17,fontWeight:800,color:"#111",marginBottom:8}}>{interv.title}</div>
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <span style={{background:PRIO_C[interv.priority]+"18",color:PRIO_C[interv.priority],padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>● {interv.priority}</span>
        <span style={{background:"#f3f4f6",color:"#374151",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>#{interv.id?.toUpperCase()}</span>
        {interv.foodImpact && <span style={{background:"#fff7ed",color:"#ea580c",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>🛡 Impact alimentaire</span>}
        {interv.productionStopped && <span style={{background:"#fef2f2",color:"#dc2626",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>⚠ Production arrêtée</span>}
      </div>

      <div className="doc-section-pdf">
        <div className="doc-section-title-pdf">Informations générales</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div className="doc-field-pdf">
            <div className="doc-field-label-pdf">Équipement</div>
            <div className="doc-field-value-pdf">{eq?.name||"—"}</div>
            <div style={{fontSize:11,color:"#999",marginTop:2}}>{eq?.location} · {eq?.category}</div>
          </div>
          <div className="doc-field-pdf">
            <div className="doc-field-label-pdf">Technicien</div>
            <div className="doc-field-value-pdf">{tech?.name||"—"}</div>
          </div>
          <div className="doc-field-pdf">
            <div className="doc-field-label-pdf">Date création</div>
            <div className="doc-field-value-pdf">{fmtDateTime(interv.createdAt)}</div>
          </div>
          <div className="doc-field-pdf">
            <div className="doc-field-label-pdf">Date clôture</div>
            <div className="doc-field-value-pdf">{r?fmtDateTime(r.completedAt):"—"}</div>
          </div>
        </div>
      </div>

      {r && (<>
        <div className="doc-section-pdf">
          <div className="doc-section-title-pdf">Travaux effectués</div>
          <div style={{background:"#f8f9fa",borderRadius:6,padding:14,fontSize:13,lineHeight:1.7,color:"#333"}}>{r.actions||"—"}</div>
        </div>
        {r.observations && (
          <div className="doc-section-pdf">
            <div className="doc-section-title-pdf">Observations / Anomalies</div>
            <div style={{background:"#fff9f0",borderRadius:6,padding:14,fontSize:13,lineHeight:1.7,color:"#333",border:"1px solid #fed7aa"}}>{r.observations}</div>
          </div>
        )}
        <div className="doc-section-pdf">
          <div className="doc-section-title-pdf">Résultat & durée</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div className="doc-field-pdf">
              <div className="doc-field-label-pdf">Durée</div>
              <div className="doc-field-value-pdf">{r.duration?`${r.duration} minutes`:"—"}</div>
            </div>
            <div className="doc-field-pdf">
              <div className="doc-field-label-pdf">Verdict</div>
              <div style={{marginTop:4}}>
                {r.verdict==="conforme"
                  ? <span style={{background:"#e8faf3",color:"#00a066",border:"1px solid #b3ecd7",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>✅ Conforme</span>
                  : <span style={{background:"#fff0f0",color:"#dc2626",border:"1px solid #fca5a5",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>❌ Non conforme</span>
                }
              </div>
            </div>
          </div>
        </div>
        <div className="doc-section-pdf">
          <div className="doc-section-title-pdf">Check-list hygiène alimentaire (IFS/BRC/HACCP)</div>
          {[
            [r.hygieneRespected, "Tenue et hygiène personnelle respectées (charlotte, gants, tenue)"],
            [r.cleaningDone??false, "Nettoyage/désinfection post-intervention effectué"],
            [!interv.foodImpact, "Aucun risque de contamination alimentaire identifié"],
          ].map(([ok,label],i)=>(
            <div key={i} className="doc-check-pdf" style={{background:ok?"#e8faf3":"#fff0f0"}}>
              <span style={{fontSize:14}}>{ok?"✅":"❌"}</span>
              <span style={{fontSize:12,color:ok?"#065f46":"#7f1d1d"}}>{label}</span>
            </div>
          ))}
        </div>
        <div className="doc-section-pdf">
          <div className="doc-section-title-pdf">Signature et certification</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{border:"1px solid #ddd",borderRadius:8,padding:16,textAlign:"center"}}>
              <div style={{fontSize:10,color:"#999",marginBottom:4}}>Technicien responsable</div>
              <div style={{fontSize:18,fontWeight:700,color:"#22c55e",fontFamily:"monospace",margin:"8px 0"}}>{tech?.name}</div>
              <div style={{fontSize:10,color:"#aaa"}}>{fmtDateTime(r.completedAt)}</div>
            </div>
            <div style={{border:"1px solid #ddd",borderRadius:8,padding:16,background:"#f8fffe"}}>
              <div style={{fontSize:10,color:"#999",marginBottom:8}}>Certification</div>
              <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>Je certifie que les informations sont exactes et que les procédures de sécurité alimentaire ont été respectées.</div>
            </div>
          </div>
        </div>
      </>)}

      <div style={{marginTop:28,paddingTop:14,borderTop:"1px solid #eee",display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa"}}>
        <span>MaintaFood GMAO · Généré le {fmtDateTime(new Date().toISOString())}</span>
        <span>{db.siteConfig.certifications}</span>
        <span>Page 1/1</span>
      </div>
    </div>
  );
}

function PDFModal({ interv, db, onClose }) {
  const handlePrint = () => {
    const el = document.getElementById("pdf-doc");
    if (!el) return;
    const win = window.open("","_blank");
    win.document.write(`<html><head><title>Rapport ${interv.id}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Outfit',sans-serif}
      .doc-wrap{background:#fff;color:#111;padding:36px}
      .doc-header-pdf{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid #22c55e}
      .doc-logo-pdf{font-size:20px;font-weight:800;color:#22c55e}
      .doc-section-pdf{margin-bottom:18px}
      .doc-section-title-pdf{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#999;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #eee}
      .doc-field-pdf{background:#f8f9fa;border-radius:6px;padding:11px}
      .doc-field-label-pdf{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
      .doc-field-value-pdf{font-size:13px;font-weight:600;color:#111}
      .doc-check-pdf{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 10px;border-radius:4px;margin-bottom:5px}
      @media print{@page{margin:12mm}}
    </style></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(()=>win.print(), 400);
  };

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal center" style={{maxWidth:760,maxHeight:"92dvh"}}>
        <div className="mh">
          <div style={{flex:1}}>
            <div className="mt">Aperçu PDF — {interv.title}</div>
            <div className="tmo tm" style={{marginTop:2}}>#{interv.id?.toUpperCase()} · {fmtDate(interv.report?.completedAt)}</div>
          </div>
          <button className="btn btn-g btn-icon" onClick={onClose}><IC n="x" s={15}/></button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          <PDFDoc interv={interv} db={db}/>
        </div>
        <div className="mf">
          <button className="btn btn-g" onClick={onClose}>Fermer</button>
          <button className="btn btn-p" onClick={handlePrint}><IC n="download" s={14}/>Imprimer / PDF</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REPORT FORM (multi-step)
// ════════════════════════════════════════════════════════════
function ReportForm({ interv, equipment, currentUser, onSave, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    actions: interv.report?.actions||"",
    observations: interv.report?.observations||"",
    duration: interv.report?.duration||"",
    photos: interv.photos||[],
    foodImpact: interv.foodImpact||false,
    productionStopped: interv.productionStopped||false,
    hygieneRespected: interv.report?.hygieneRespected||false,
    cleaningDone: interv.report?.cleaningDone||false,
    verdict: interv.report?.verdict||"",
  });
  const s = (k,v) => setForm(p=>({...p,[k]:v}));
  const steps = ["Travaux","Hygiène","Vérification","Signature"];

  const submit = () => {
    const report = { completedAt:now(), duration:form.duration, actions:form.actions, observations:form.observations, hygieneRespected:form.hygieneRespected, cleaningDone:form.cleaningDone, verdict:form.verdict, signedBy:currentUser.id };
    onSave({...interv, report, photos:form.photos, foodImpact:form.foodImpact, productionStopped:form.productionStopped, status:"termine", updatedAt:now()});
    onClose();
  };

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mh">
          <div>
            <div className="mt">Rapport d'intervention</div>
            <div className="tmo tm" style={{marginTop:2}}>{equipment?.name} · {fmtDate(now())}</div>
          </div>
          <button className="btn btn-g btn-icon" onClick={onClose}><IC n="x" s={15}/></button>
        </div>
        <div className="step-indicator">
          {steps.map((st,i)=>(
            <div key={i} className="flex fai" style={{gap:6,flex:i<steps.length-1?1:"none"}}>
              <div className="step-dot" style={{background:i<step?"var(--acc)":i===step?"var(--acc)":"var(--s3)",color:i<=step?"#000":"var(--t2)"}}>
                {i<step?<IC n="check" s={12}/>:i+1}
              </div>
              {i<steps.length-1 && <div style={{flex:1,height:1,background:i<step?"var(--acc)":"var(--b1)"}}/>}
            </div>
          ))}
        </div>
        <div className="mb">
          {step===0&&<>
            <div className="report-section">
              <div className="report-label">Travaux effectués *</div>
              <textarea className="fta" placeholder="Décrivez précisément les travaux réalisés…" value={form.actions} onChange={e=>s("actions",e.target.value)}/>
            </div>
            <div className="report-section">
              <div className="report-label">Observations / Anomalies</div>
              <textarea className="fta" placeholder="Anomalies constatées, points d'attention…" value={form.observations} onChange={e=>s("observations",e.target.value)}/>
            </div>
            <div className="g2">
              <div className="fg"><label className="fl">Durée (minutes)</label><input className="fi" type="number" placeholder="ex: 90" value={form.duration} onChange={e=>s("duration",e.target.value)}/></div>
              <div className="fg"><label className="fl">Impact production</label>
                <label className="checkbox-row"><input type="checkbox" checked={form.productionStopped} onChange={e=>s("productionStopped",e.target.checked)}/><span style={{fontSize:13}}>Production arrêtée</span></label>
              </div>
            </div>
          </>}
          {step===1&&<>
            <div className="alert-bar" style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)"}}>
              <IC n="shield" s={16}/> Zone alimentaire — vérifications obligatoires (IFS/BRC/HACCP)
            </div>
            <div className="report-section">
              <div className="report-label" style={{marginBottom:10}}>Check-list hygiène</div>
              {[["hygieneRespected","Tenue et hygiène personnelle respectées (charlotte, gants, tenue)"],["cleaningDone","Nettoyage/désinfection post-intervention effectué"],["foodImpact","Risque de contamination alimentaire identifié"]].map(([key,label])=>(
                <label key={key} className="checkbox-row" style={{marginBottom:6}}>
                  <input type="checkbox" checked={form[key]} onChange={e=>s(key,e.target.checked)}/>
                  <span style={{fontSize:13}}>{label}</span>
                </label>
              ))}
            </div>
            {form.foodImpact&&<div className="alert-bar" style={{background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)"}}>
              <IC n="alert" s={15}/> Risque alimentaire déclaré — le responsable qualité sera notifié
            </div>}
          </>}
          {step===2&&<>
            <div className="report-section">
              <div className="report-label" style={{marginBottom:10}}>Verdict de l'intervention</div>
              <div style={{display:"flex",gap:8}}>
                {[["conforme","✅ Conforme","var(--acc)"],["non_conforme","❌ Non conforme","var(--red)"]].map(([v,l,c])=>(
                  <button key={v} className="verdict-btn" onClick={()=>s("verdict",v)} style={{borderColor:form.verdict===v?c:"var(--b1)",color:form.verdict===v?c:"var(--t2)"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="report-section">
              <div className="report-label">Récapitulatif</div>
              {[["Durée",form.duration?`${form.duration} min`:"—"],["Hygiène",form.hygieneRespected?"✅ Respectée":"⚠ Non confirmée"],["Nettoyage",form.cleaningDone?"✅ Effectué":"⚠ Non effectué"],["Risque alim.",form.foodImpact?"⚠ Oui — à signaler":"✅ Non"]].map(([k,v])=>(
                <div key={k} className="flex fjb" style={{padding:"6px 0",borderBottom:"1px solid var(--b0)"}}><span className="tm">{k}</span><span style={{fontWeight:500}}>{v}</span></div>
              ))}
            </div>
          </>}
          {step===3&&<>
            <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)",borderRadius:"var(--r2)",padding:16,textAlign:"center"}}>
              <div className="ts tm" style={{marginBottom:4}}>Rapport certifié par</div>
              <div style={{fontSize:20,fontWeight:700,color:"var(--acc)",fontFamily:"var(--fm)",margin:"8px 0"}}>{currentUser.name}</div>
              <div className="tmo tm">{fmtDateTime(now())}</div>
              <div style={{marginTop:12,padding:"10px",background:"var(--s3)",borderRadius:"var(--r2)",fontSize:12,color:"var(--t2)",lineHeight:1.6}}>
                En signant ce rapport, je certifie que les informations sont exactes et que les procédures de sécurité alimentaire ont été respectées.
              </div>
            </div>
            {!form.verdict&&<div className="alert-bar" style={{background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)"}}><IC n="alert" s={14}/>Veuillez renseigner un verdict à l'étape précédente.</div>}
            {!form.actions&&<div className="alert-bar" style={{background:"rgba(255,165,2,.08)",border:"1px solid rgba(255,165,2,.2)"}}><IC n="alert" s={14}/>Veuillez décrire les travaux effectués.</div>}
          </>}
        </div>
        <div className="mf">
          {step>0&&<button className="btn btn-g" onClick={()=>setStep(s=>s-1)}>← Retour</button>}
          <div style={{flex:1}}/>
          {step<steps.length-1
            ? <button className="btn btn-p" onClick={()=>setStep(s=>s+1)}>Suivant →</button>
            : <button className="btn btn-p" onClick={submit} disabled={!form.verdict||!form.actions}><IC n="check" s={14}/>Signer et clôturer</button>
          }
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// INTERVENTION DETAIL
// ════════════════════════════════════════════════════════════
function IntDetail({ interv, db, currentUser, onClose, onUpdate, onOpenPDF }) {
  const [comment, setComment] = useState("");
  const [showReport, setShowReport] = useState(false);
  const equipment = db.equipments.find(e=>e.id===interv.equipmentId);
  const tech = db.users.find(u=>u.id===interv.technicianId);
  const sc = STATUS[interv.status];
  const isMine = interv.technicianId===currentUser.id;
  const canEdit = canDo(currentUser,"edit_intervention")||isMine;

  const addComment = () => {
    if(!comment.trim()) return;
    const c = {id:genId(),text:comment,authorId:currentUser.id,date:now()};
    onUpdate({...interv,comments:[...interv.comments,c],updatedAt:now()});
    setComment("");
  };

  return (
    <>
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal center" style={{maxWidth:680}}>
        <div className="mh">
          <div style={{flex:1,minWidth:0}}>
            <div className="mt clamp1">{interv.title}</div>
            <div className="tmo tm" style={{marginTop:2,fontSize:10}}>#{interv.id?.toUpperCase()}</div>
          </div>
          <button className="btn btn-g btn-icon" onClick={onClose}><IC n="x" s={15}/></button>
        </div>
        <div className="mb">
          {canEdit&&<div>
            <div className="fl mb8">Statut</div>
            <div className="flex g6" style={{flexWrap:"wrap"}}>
              {Object.entries(STATUS).filter(([k])=>k!=="valide"||canDo(currentUser,"edit_intervention")).map(([k,v])=>(
                <button key={k} className="btn btn-g btn-sm" onClick={()=>onUpdate({...interv,status:k,updatedAt:now()})}
                  style={{borderColor:interv.status===k?v.color:undefined,color:interv.status===k?v.color:undefined}}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>}

          <div className="g2">
            <div style={{background:"var(--s3)",borderRadius:"var(--r2)",padding:12}}>
              <div className="fl mb8">Équipement</div>
              <div style={{fontWeight:600,fontSize:13}}>{equipment?.name||"—"}</div>
              <div className="ts tm">{equipment?.location}</div>
              {equipment?.foodSafe&&<span className="food-badge" style={{marginTop:6}}><IC n="shield" s={10}/>Zone alimentaire</span>}
            </div>
            <div style={{background:"var(--s3)",borderRadius:"var(--r2)",padding:12}}>
              <div className="fl mb8">Technicien</div>
              {tech&&<div className="flex fai g8"><div className="av" style={{width:28,height:28,fontSize:10,background:tech.color+"22",color:tech.color}}>{tech.name[0]}</div><span style={{fontWeight:600}}>{tech.name}</span></div>}
            </div>
          </div>

          <div className="flex fai g8" style={{flexWrap:"wrap"}}>
            <span className="badge" style={{background:PRIO[interv.priority].color+"18",color:PRIO[interv.priority].color}}>{PRIO[interv.priority].label}</span>
            {interv.productionStopped&&<span className="badge" style={{background:"rgba(255,71,87,.1)",color:"var(--red)"}}>⚠ Production arrêtée</span>}
            {interv.foodImpact&&<span className="food-badge"><IC n="shield" s={11}/>Impact alimentaire</span>}
            <span className="tag"><IC n="clock" s={10}/>{fmtDate(interv.createdAt)}</span>
          </div>

          {interv.description&&<div style={{background:"var(--s3)",borderRadius:"var(--r2)",padding:12,fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{interv.description}</div>}

          {interv.report&&<div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)",borderRadius:"var(--r2)",padding:14}}>
            <div className="flex fai fjb mb8">
              <span style={{fontWeight:600,color:"var(--acc)",fontSize:13}}>✅ Rapport complété</span>
              <span className="tmo tm">{fmtDateTime(interv.report.completedAt)}</span>
            </div>
            <div className="ts" style={{color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>{interv.report.actions}</div>
            {[["Verdict",interv.report.verdict==="conforme"?"✅ Conforme":"❌ Non conforme"],["Durée",interv.report.duration?`${interv.report.duration} min`:"—"],["Hygiène",interv.report.hygieneRespected?"✅ Respectée":"—"]].map(([k,v])=>(
              <div key={k} className="flex fjb ts" style={{marginBottom:4}}><span className="tm">{k}</span><span style={{fontWeight:500}}>{v}</span></div>
            ))}
          </div>}

          <div>
            <div className="fl mb8">Commentaires ({(interv.comments||[]).length})</div>
            {(interv.comments||[]).map(c=>{
              const au=db.users.find(u=>u.id===c.authorId);
              return <div key={c.id} style={{background:"var(--s3)",borderRadius:"var(--r2)",padding:10,marginBottom:8}}>
                <div className="flex fai g8 mb8"><div className="av" style={{width:20,height:20,fontSize:8,background:au?.color+"22",color:au?.color}}>{au?.name[0]}</div><span style={{fontSize:12,fontWeight:600}}>{au?.name}</span><span className="tmo tm" style={{marginLeft:"auto",fontSize:10}}>{fmtDateTime(c.date)}</span></div>
                <div style={{fontSize:13}}>{c.text}</div>
              </div>;
            })}
            <div className="flex g8" style={{marginTop:8}}>
              <input className="fi" placeholder="Ajouter un commentaire…" value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()}/>
              <button className="btn btn-p btn-sm" onClick={addComment}><IC n="arrow" s={14}/></button>
            </div>
          </div>
        </div>
        <div className="mf">
          {isMine&&interv.status!=="termine"&&interv.status!=="valide"&&(
            <button className="btn btn-p" onClick={()=>setShowReport(true)}><IC n="file" s={14}/>Remplir rapport</button>
          )}
          {canDo(currentUser,"edit_intervention")&&interv.status==="termine"&&(
            <button className="btn btn-p" onClick={()=>onUpdate({...interv,status:"valide",updatedAt:now()})}>✅ Valider</button>
          )}
          {interv.report&&(
            <button className="btn btn-g" onClick={()=>onOpenPDF(interv)}><IC n="download" s={14}/>PDF</button>
          )}
          <button className="btn btn-g" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
    {showReport&&<ReportForm interv={interv} equipment={equipment} currentUser={currentUser}
      onSave={(updated)=>onUpdate(updated)} onClose={()=>setShowReport(false)}/>}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// NEW INTERVENTION
// ════════════════════════════════════════════════════════════
function NewIntModal({ db, currentUser, preEq, onClose, onSave }) {
  const [f, setF] = useState({ title:"", equipmentId:preEq||"", technicianId:currentUser.role==="technician"?currentUser.id:"", priority:"normale", description:"", productionStopped:false, foodImpact:false, comments:[], photos:[], partsUsed:[] });
  const sv = (k,v) => setF(p=>({...p,[k]:v}));
  const eq = db.equipments.find(e=>e.id===f.equipmentId);
  const save = () => {
    if(!f.title||!f.equipmentId) return;
    onSave({...f,id:genId(),status:"a_faire",createdAt:now(),updatedAt:now(),createdBy:currentUser.id,report:null});
    onClose();
  };
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal center" style={{maxWidth:600}}>
        <div className="mh"><div className="mt">Nouvelle intervention</div><button className="btn btn-g btn-icon" onClick={onClose}><IC n="x" s={15}/></button></div>
        <div className="mb">
          <div className="fg"><label className="fl">Titre *</label><input className="fi" placeholder="Ex: Remplacement joint pompe P3…" value={f.title} onChange={e=>sv("title",e.target.value)}/></div>
          <div className="g2">
            <div className="fg"><label className="fl">Équipement *</label>
              <select className="fsel" value={f.equipmentId} onChange={e=>sv("equipmentId",e.target.value)}>
                <option value="">Sélectionner…</option>
                {db.equipments.map(eq=><option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            {(canDo(currentUser,"edit_intervention")||currentUser.role==="chef")&&(
              <div className="fg"><label className="fl">Technicien</label>
                <select className="fsel" value={f.technicianId} onChange={e=>sv("technicianId",e.target.value)}>
                  <option value="">Non assigné</option>
                  {db.users.filter(u=>u.role==="technician"&&u.active).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="fg"><label className="fl">Priorité</label>
            <div className="flex g6">
              {Object.entries(PRIO).map(([k,v])=>(
                <button key={k} className="btn btn-g btn-sm" onClick={()=>sv("priority",k)} style={{borderColor:f.priority===k?v.color:undefined,color:f.priority===k?v.color:undefined}}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="fg"><label className="fl">Description</label><textarea className="fta" placeholder="Contexte, symptômes observés…" value={f.description} onChange={e=>sv("description",e.target.value)}/></div>
          <div className="g2">
            <label className="checkbox-row"><input type="checkbox" checked={f.productionStopped} onChange={e=>sv("productionStopped",e.target.checked)}/><span style={{fontSize:13}}>Production arrêtée</span></label>
            <label className="checkbox-row"><input type="checkbox" checked={f.foodImpact} onChange={e=>sv("foodImpact",e.target.checked)}/><span style={{fontSize:13}}>Impact alimentaire</span></label>
          </div>
          {eq?.foodSafe&&<div className="alert-bar" style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)"}}><IC n="shield" s={14}/>Équipement en zone alimentaire — procédures HACCP applicables</div>}
        </div>
        <div className="mf"><button className="btn btn-g" onClick={onClose}>Annuler</button><button className="btn btn-p" disabled={!f.title||!f.equipmentId} onClick={save}><IC n="check" s={14}/>Créer l'intervention</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// INTERVENTIONS PAGE
// ════════════════════════════════════════════════════════════
function InterventionsPage({ db, setDb, currentUser, onOpenPDF }) {
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const list = currentUser.role==="technician" ? db.interventions.filter(i=>i.technicianId===currentUser.id) : db.interventions;
  const filtered = filter==="all" ? list : list.filter(i=>i.status===filter);

  const saveInt = (i) => {
    setDb(d=>({...d,
      interventions:d.interventions.find(x=>x.id===i.id)?d.interventions.map(x=>x.id===i.id?i:x):[i,...d.interventions],
      auditLog:[{id:genId(),date:now(),userId:currentUser.id,action:"Intervention mise à jour",target:i.title,detail:`Statut: ${i.status}`},...d.auditLog],
    }));
    if(selected?.id===i.id) setSelected(i);
  };
  const newInt = (i) => {
    setDb(d=>({...d,interventions:[i,...d.interventions],auditLog:[{id:genId(),date:now(),userId:currentUser.id,action:"Création intervention",target:i.title,detail:`Priorité: ${i.priority}`},...d.auditLog]}));
    setShowNew(false);
  };

  return (
    <div>
      <div className="flex fai fjb mb16">
        <div><div className="pt">Interventions</div><div className="ps">{list.length} ordre(s) de travail</div></div>
        <button className="btn btn-p" onClick={()=>setShowNew(true)}><IC n="plus" s={14}/>Nouvelle intervention</button>
      </div>
      <div className="flex g6 mb16" style={{flexWrap:"wrap"}}>
        {[["all","Tous",list.length],...Object.entries(STATUS).map(([k,v])=>[k,v.label,list.filter(i=>i.status===k).length])].map(([k,l,c])=>{
          const sc=k!=="all"?STATUS[k]:null;
          return <button key={k} className="btn btn-g btn-sm" onClick={()=>setFilter(k)} style={filter===k?{borderColor:sc?.color||"var(--acc)",color:sc?.color||"var(--acc)",background:sc?.bg||"var(--acc-dim)"}:{}}>
            {l} <span style={{fontFamily:"var(--fm)",fontSize:10,opacity:.7}}>{c}</span>
          </button>;
        })}
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Titre</th><th>Équipement</th><th>Technicien</th><th>Prio.</th><th>Statut</th><th>Rapport</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan="7"><div className="empty"><IC n="check" s={28}/><span>Aucune intervention</span></div></td></tr>}
            {filtered.map(i=>{
              const eq=db.equipments.find(e=>e.id===i.equipmentId);
              const tech=db.users.find(u=>u.id===i.technicianId);
              const sc=STATUS[i.status]; const pc=PRIO[i.priority];
              return <tr key={i.id} onClick={()=>setSelected(i)}>
                <td>
                  <div style={{fontWeight:600,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.title}</div>
                  {i.productionStopped&&<div style={{fontSize:10,color:"var(--red)"}}>⚠ Prod. arrêtée</div>}
                  {i.foodImpact&&<span className="food-badge" style={{marginTop:2}}><IC n="shield" s={10}/>Alim.</span>}
                </td>
                <td><div className="ts clamp1" style={{maxWidth:130}}>{eq?.name||"—"}</div></td>
                <td>{tech?<div className="flex fai g6"><div className="av" style={{width:22,height:22,fontSize:9,background:tech.color+"22",color:tech.color}}>{tech.name[0]}</div><span style={{fontSize:12}}>{tech.name.split(" ")[0]}</span></div>:"—"}</td>
                <td><span style={{fontSize:11,color:pc.color,fontWeight:600}}>{pc.label}</span></td>
                <td><span className="badge" style={{background:sc.bg,color:sc.color,fontSize:10}}>{sc.label}</span></td>
                <td>{i.report
                  ? <button className="btn btn-p btn-xs" onClick={e=>{e.stopPropagation();onOpenPDF(i);}}><IC n="download" s={11}/>PDF</button>
                  : <span style={{color:"var(--t3)",fontSize:11}}>—</span>}
                </td>
                <td><span className="tmo tm">{fmtDate(i.createdAt)}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {showNew&&<NewIntModal db={db} currentUser={currentUser} preEq={null} onClose={()=>setShowNew(false)} onSave={newInt}/>}
      {selected&&<IntDetail interv={selected} db={db} currentUser={currentUser} onClose={()=>setSelected(null)} onUpdate={saveInt} onOpenPDF={onOpenPDF}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STORE PAGE
// ════════════════════════════════════════════════════════════
function StorePage({ db, setDb, currentUser }) {
  const [search, setSearch] = useState("");
  const [showAdj, setShowAdj] = useState(null);
  const [adjQty, setAdjQty] = useState(0);
  const isTech = currentUser.role==="technician";
  const canEdit = canDo(currentUser,"all")||currentUser.role==="chef";
  const filtered = db.stock.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.ref.toLowerCase().includes(search.toLowerCase()));
  const lowCount = db.stock.filter(p=>p.qty<=p.minQty).length;

  const adjust = () => {
    setDb(d=>({...d,stock:d.stock.map(p=>p.id===showAdj.id?{...p,qty:Math.max(0,p.qty+adjQty)}:p),auditLog:[{id:genId(),date:now(),userId:currentUser.id,action:"Ajustement stock",target:showAdj.name,detail:`${adjQty>0?"+":""}${adjQty}`},...d.auditLog]}));
    setShowAdj(null); setAdjQty(0);
  };

  return (
    <div>
      <div className="pt">Magasin</div>
      <div className="ps">Pièces de rechange · {db.stock.length} références</div>
      {lowCount>0&&<div className="alert-bar mb16" style={{background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)"}}><IC n="alert" s={15}/>{lowCount} pièce(s) en stock critique</div>}
      <div className="g4 mb16">
        {[{l:"Références",v:db.stock.length,c:"var(--acc)"},{l:"Stock critique",v:lowCount,c:lowCount>0?"var(--red)":"var(--acc)"},...(!isTech?[{l:"Valeur totale",v:`${db.stock.reduce((s,p)=>s+p.qty*p.price,0).toFixed(0)}€`,c:"var(--t1)"}]:[])].map(s=>(
          <div key={s.l} className="stat"><div className="stat-v" style={{color:s.c,fontSize:26}}>{s.v}</div><div className="stat-l">{s.l}</div></div>
        ))}
      </div>
      <div style={{position:"relative",marginBottom:14}}>
        <input className="fi" placeholder="Chercher par nom, référence…" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:36}}/>
        <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--t2)"}}><IC n="star" s={14}/></div>
      </div>
      <div className="card">
        <table className="tbl" style={{minWidth:600}}>
          <thead><tr><th>Réf.</th><th>Désignation</th><th>Emplacement</th><th>Fournisseur</th><th>Qté</th>{!isTech&&<th>P.U.</th>}<th></th></tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan="7"><div className="empty"><IC n="box" s={28}/><span>Aucune pièce</span></div></td></tr>}
            {filtered.map(p=>{
              const low=p.qty<=p.minQty;
              return <tr key={p.id}>
                <td><span style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--acc)"}}>{p.ref}</span></td>
                <td><div style={{fontWeight:600,fontSize:13}}>{p.name}</div><div style={{fontSize:10,color:"var(--t2)"}}>{p.category}</div>{low&&<div style={{fontSize:9,color:"var(--red)",fontFamily:"var(--fm)"}}>⚠ STOCK BAS</div>}</td>
                <td><span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--t2)"}}>{p.location||"—"}</span></td>
                <td><div style={{fontSize:12}}>{p.supplier||"—"}</div></td>
                <td><span style={{fontSize:18,fontWeight:700,fontFamily:"var(--fm)",color:low?"var(--red)":"var(--t1)"}}>{p.qty}</span><span className="tmo tm" style={{marginLeft:4}}>{p.unit}</span></td>
                {!isTech&&<td className="tmo tm">{p.price?.toFixed(2)}€</td>}
                <td onClick={e=>e.stopPropagation()}>
                  {canEdit&&<button className="btn btn-g btn-xs" onClick={()=>{setShowAdj(p);setAdjQty(0);}}><IC n="pen" s={11}/></button>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {showAdj&&(
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdj(null)}>
          <div className="modal center" style={{maxWidth:380}}>
            <div className="mh"><div className="mt">Ajuster le stock</div><button className="btn btn-g btn-icon" onClick={()=>setShowAdj(null)}><IC n="x" s={15}/></button></div>
            <div className="mb">
              <div style={{background:"var(--s3)",borderRadius:"var(--r2)",padding:14}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{showAdj.name}</div>
                <div className="tmo tm">{showAdj.ref}</div>
                <div className="sep"/>
                <div className="tmo tm">Stock actuel</div>
                <div style={{fontSize:28,fontWeight:700,fontFamily:"var(--fm)",marginTop:4}}>{showAdj.qty} <span className="tmo tm" style={{fontSize:14}}>{showAdj.unit}</span></div>
              </div>
              <div className="fg"><label className="fl">Quantité (+ réception / − retrait)</label><input className="fi" type="number" value={adjQty} onChange={e=>setAdjQty(parseInt(e.target.value)||0)}/></div>
              <div style={{padding:"10px 12px",background:"var(--s3)",borderRadius:"var(--r2)",fontSize:13}}>Nouveau stock : <strong style={{color:"var(--acc)"}}>{Math.max(0,showAdj.qty+adjQty)} {showAdj.unit}</strong></div>
            </div>
            <div className="mf"><button className="btn btn-g" onClick={()=>setShowAdj(null)}>Annuler</button><button className="btn btn-p" onClick={adjust}><IC n="check" s={13}/>Confirmer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SITE PLAN
// ════════════════════════════════════════════════════════════
function SitePlan({ db, setDb, currentUser }) {
  const [hov, setHov] = useState(null);
  const [statusF, setStatusF] = useState("all");
  const ZONES=[
    {id:"A",name:"Usinage",x:33,y:8,w:26,h:42,c:"rgba(232,100,60,0.06)",bc:"rgba(232,100,60,0.4)"},
    {id:"B",name:"Atelier & Stockage",x:12,y:22,w:26,h:50,c:"rgba(34,197,94,0.05)",bc:"rgba(34,197,94,0.35)"},
    {id:"C",name:"Production Ligne A",x:54,y:40,w:32,h:28,c:"rgba(168,85,247,0.05)",bc:"rgba(168,85,247,0.3)"},
    {id:"D",name:"Local technique",x:68,y:8,w:22,h:24,c:"rgba(245,158,11,0.06)",bc:"rgba(245,158,11,0.35)"},
  ];
  const eqs = statusF==="all" ? db.equipments : db.equipments.filter(e=>e.status===statusF);
  return (
    <div>
      <div className="pt">Plan du site</div>
      <div className="ps">Vue interactive des équipements</div>
      <div className="plan-container mb16">
        <div className="plan-toolbar">
          {["all","ok","panne","maintenance"].map(k=>(
            <button key={k} className="btn btn-g btn-sm" onClick={()=>setStatusF(k)} style={statusF===k?{borderColor:k==="panne"?"var(--red)":k==="maintenance"?"var(--yel)":"var(--acc)",color:k==="panne"?"var(--red)":k==="maintenance"?"var(--yel)":"var(--acc)"}:{}}>
              {k==="all"?"Tous":EQS[k].label}
            </button>
          ))}
          <span className="tmo tm" style={{marginLeft:"auto"}}>{db.equipments.length} équip.</span>
        </div>
        <svg viewBox="0 0 100 100" style={{width:"100%",display:"block",minHeight:360,cursor:"default"}}>
          <rect width="100" height="100" fill="#0b0f14"/>
          <defs><pattern id="pg" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0L0 0 0 5" fill="none" stroke="rgba(255,255,255,.025)" strokeWidth=".3"/></pattern></defs>
          <rect width="100" height="100" fill="url(#pg)"/>
          {[{n:"Entrée",x:0,y:0,w:12,h:20},{n:"Bureaux",x:0,y:20,w:12,h:46},{n:"Sanitaires",x:0,y:66,w:12,h:34}].map(r=>(
            <g key={r.n}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#111315" stroke="rgba(255,255,255,.04)" strokeWidth=".3"/>
            <text x={r.x+r.w/2} y={r.y+r.h/2+.5} textAnchor="middle" fill="rgba(255,255,255,.15)" fontSize="2.2" fontFamily="JetBrains Mono">{r.n}</text></g>
          ))}
          {ZONES.map(z=>(
            <g key={z.id}><rect x={z.x} y={z.y} width={z.w} height={z.h} fill={z.c} stroke={z.bc} strokeWidth=".4" rx="1"/>
            <text x={z.x+2} y={z.y+4} fill={z.bc.replace(",0.",",0.8)")} fontSize="2.4" fontFamily="JetBrains Mono">{z.name}</text></g>
          ))}
          <rect x="59" y="8" width="9" height="78" fill="rgba(255,255,255,.015)" stroke="rgba(255,255,255,.03)" strokeWidth=".3"/>
          {eqs.map(eq=>{
            const sc=EQS[eq.status]; const isH=hov===eq.id;
            return (
              <g key={eq.id} style={{cursor:"pointer"}} onMouseEnter={()=>setHov(eq.id)} onMouseLeave={()=>setHov(null)}>
                <rect x={eq.x} y={eq.y} width={eq.w} height={eq.h} fill={isH?eq.color+"28":eq.color+"14"} stroke={isH?eq.color:eq.color+"88"} strokeWidth={isH?".6":".4"} rx="1.5"/>
                {eq.foodSafe&&<text x={eq.x+1} y={eq.y+3} fill="rgba(34,197,94,.5)" fontSize="2" fontFamily="JetBrains Mono">ALIM</text>}
                <circle cx={eq.x+eq.w-1.5} cy={eq.y+1.5} r="1.1" fill={sc.color}/>
                <text x={eq.x+eq.w/2} y={eq.y+eq.h/2+.8} textAnchor="middle" fill={isH?eq.color:"rgba(255,255,255,.7)"} fontSize="2.4" fontFamily="JetBrains Mono">
                  {eq.name.slice(0,14)}{eq.name.length>14?"…":""}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="plan-legend">
          {Object.entries(EQS).map(([k,v])=><div key={k} className="pleg"><div style={{width:7,height:7,borderRadius:"50%",background:v.color}}/>{v.label}</div>)}
          <div className="pleg" style={{marginLeft:"auto"}}><div style={{width:8,height:8,borderRadius:2,background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.4)"}}/>Zone alimentaire</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// AUDIT PAGE
// ════════════════════════════════════════════════════════════
function AuditPage({ db }) {
  return (
    <div>
      <div className="pt">Journal d'audit</div>
      <div className="ps">Traçabilité complète — conforme IFS Food v8 · BRC · ISO 22000</div>
      <div className="alert-bar mb16" style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)"}}>
        <IC n="shield" s={16}/>Ce journal est horodaté et non modifiable — disponible pour les inspecteurs
      </div>
      <div className="card">
        <div style={{padding:"0 18px"}}>
          {db.auditLog.map((l,i)=>{
            const u=db.users.find(u=>u.id===l.userId);
            return <div key={l.id} className="audit-row">
              <div className="audit-time">{fmtDateTime(l.date)}</div>
              <div className="audit-dot" style={{background:l.action.includes("Rapport")||l.action.includes("Création")?"var(--acc)":"var(--blu)"}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:500}}>{l.action}</div>
                <div className="ts tm">{l.target} · {l.detail}</div>
              </div>
              {u&&<div className="flex fai g6" style={{flexShrink:0}}>
                <div className="av" style={{width:20,height:20,fontSize:8,background:u.color+"22",color:u.color}}>{u.name[0]}</div>
                <span className="ts tm">{u.name.split(" ")[0]}</span>
              </div>}
            </div>;
          })}
          {db.auditLog.length===0&&<div className="empty"><IC n="audit" s={28}/><span>Aucun événement</span></div>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USERS PAGE
// ════════════════════════════════════════════════════════════
function UsersPage({ db, currentUser }) {
  return (
    <div>
      <div className="pt">Utilisateurs</div>
      <div className="ps">{db.users.length} comptes · {db.users.filter(u=>u.active).length} actifs</div>
      <div className="g2">
        {db.users.map(u=>{
          const rc=ROLES[u.role];
          const myOT=db.interventions.filter(i=>i.technicianId===u.id);
          return <div key={u.id} className="card">
            <div className="cb">
              <div className="flex fai g12">
                <div className="av" style={{width:46,height:46,fontSize:14,background:u.color+"22",color:u.color}}>{u.name[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{u.name}</div>
                  <div className="tmo tm" style={{marginBottom:6}}>{u.email}</div>
                  <div className="flex fai g6">
                    <span style={{fontSize:10,fontFamily:"var(--fm)",background:rc.color+"18",color:rc.color,padding:"1px 7px",borderRadius:4}}>{rc.label}</span>
                    {u.role==="technician"&&<span className="tag">{myOT.length} OT</span>}
                    {currentUser.id===u.id&&<span style={{fontSize:10,color:"var(--acc)",fontFamily:"var(--fm)"}}>← vous</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════
function SettingsPage({ db, setDb, resetDb }) {
  const [cfg, setCfg] = useState(db.siteConfig);
  const save = () => { setDb(d=>({...d,siteConfig:cfg})); alert("Sauvegardé !"); };
  return (
    <div>
      <div className="pt">Paramètres</div>
      <div className="ps">Configuration du site</div>
      <div className="g2">
        <div className="card">
          <div className="ch"><IC n="settings" s={15}/><span className="cht">Informations du site</span></div>
          <div className="cb" style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="fg"><label className="fl">Nom du site</label><input className="fi" value={cfg.name} onChange={e=>setCfg(p=>({...p,name:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Adresse</label><input className="fi" value={cfg.address} onChange={e=>setCfg(p=>({...p,address:e.target.value}))}/></div>
            <div className="fg"><label className="fl">SIRET</label><input className="fi" value={cfg.siret} onChange={e=>setCfg(p=>({...p,siret:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Certifications</label><input className="fi" value={cfg.certifications} onChange={e=>setCfg(p=>({...p,certifications:e.target.value}))}/></div>
            <button className="btn btn-p" onClick={save}><IC n="check" s={14}/>Sauvegarder</button>
          </div>
        </div>
        <div>
          <div className="card" style={{border:"1px solid rgba(255,71,87,.2)"}}>
            <div className="cb">
              <div style={{fontWeight:600,color:"var(--red)",marginBottom:8}}>⚠ Zone dangereuse</div>
              <p style={{fontSize:12.5,color:"var(--t2)",marginBottom:12}}>Réinitialiser toutes les données (démonstration)</p>
              <button className="btn btn-r btn-sm" onClick={()=>{if(window.confirm("Réinitialiser ?")) resetDb();}}><IC n="trash" s={13}/>Réinitialiser</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════
export default function App() {
  const { db, setDb, resetDb } = useDB();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [pdfInterv, setPdfInterv] = useState(null);

  if (!user) return <><style>{CSS}</style><AuthScreen users={db.users} onLogin={u => { setUser(u); setPage("dashboard"); }} /></>;

  const isAdmin = user.role==="admin";
  const isChef = user.role==="chef";
  const isTech = user.role==="technician";

  const NAV = [
    { id:"dashboard",      label:"Dashboard",         icon:"home" },
    { id:"plan",           label:"Plan du site",       icon:"map" },
    { id:"interventions",  label:isTech?"Mes OT":"Interventions", icon:"tool", badge:db.interventions.filter(i=>i.status==="a_faire"&&(isTech?i.technicianId===user.id:true)).length||null },
    { id:"store",          label:"Magasin",            icon:"box",  badge:db.stock.filter(p=>p.qty<=p.minQty).length||null, badgeY:true },
    (isAdmin||isChef)&&{ id:"audit",   label:"Audit",          icon:"audit" },
    (isAdmin||isChef)&&{ id:"users",   label:"Utilisateurs",   icon:"users" },
    isAdmin&&            { id:"settings",label:"Paramètres",    icon:"settings" },
  ].filter(Boolean);

  const TITLES = { dashboard:"Tableau de bord", plan:"Plan du site", interventions:isTech?"Mes ordres de travail":"Interventions", store:"Magasin", audit:"Journal d'audit", users:"Utilisateurs", settings:"Paramètres" };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Sidebar desktop */}
        <aside className="sidebar hide-mobile">
          <div className="logo-wrap">
            <div className="logo-badge">
              <LogoSVG size={30} />
              <div>
                <div className="logo-text">{BRAND.name}</div>
                <div className="logo-sub">{db.siteConfig.name}</div>
              </div>
            </div>
          </div>
          <nav className="nav">
            <div className="nav-sec">Navigation</div>
            {NAV.map(item => (
              <button key={item.id} className={`ni ${page===item.id?"on":""}`} onClick={()=>setPage(item.id)}>
                <IC n={item.icon} s={15}/>{item.label}
                {item.badge&&<span className={`nbadge ${item.badgeY?"y":""}`}>{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="sfooter">
            <div className="av" style={{width:30,height:30,fontSize:11,background:user.color+"22",color:user.color}}>{user.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="sf-name">{user.name}</div>
              <div className="sf-role" style={{color:ROLES[user.role].color}}>{ROLES[user.role].label}</div>
            </div>
            <button className="btn btn-g btn-icon" style={{width:28,height:28,padding:5}} onClick={()=>setUser(null)}><IC n="logout" s={14}/></button>
          </div>
        </aside>

        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="hide-desktop-show-mobile" style={{display:"flex",alignItems:"center",gap:8}}>
              <LogoSVG size={22}/><span style={{fontWeight:800,color:BRAND.accent,fontSize:15}}>{BRAND.name}</span>
            </div>
            <div style={{flex:1,fontWeight:700,fontSize:15}} className="hide-mobile">{TITLES[page]}</div>
            <div className="flex fai g8">
              {db.stock.filter(p=>p.qty<=p.minQty).length>0&&(
                <button className="btn btn-g btn-sm hide-mobile" onClick={()=>setPage("store")} style={{color:"var(--yel)",borderColor:"rgba(255,165,2,.3)"}}>
                  <IC n="alert" s={13}/>{db.stock.filter(p=>p.qty<=p.minQty).length} stock bas
                </button>
              )}
              <div className="av" style={{width:30,height:30,fontSize:11,background:user.color+"22",color:user.color}}>{user.name[0]}</div>
              <button className="btn btn-g btn-icon hide-mobile" style={{width:30,height:30,padding:5}} onClick={()=>setUser(null)}><IC n="logout" s={14}/></button>
            </div>
          </div>

          {/* Content */}
          <div className="content">
            {page==="dashboard"    && <Dashboard db={db} currentUser={user} setPage={setPage} onOpenPDF={setPdfInterv}/>}
            {page==="plan"         && <SitePlan db={db} setDb={setDb} currentUser={user}/>}
            {page==="interventions"&& <InterventionsPage db={db} setDb={setDb} currentUser={user} onOpenPDF={setPdfInterv}/>}
            {page==="store"        && <StorePage db={db} setDb={setDb} currentUser={user}/>}
            {page==="audit"        && <AuditPage db={db}/>}
            {page==="users"        && <UsersPage db={db} currentUser={user}/>}
            {page==="settings"     && <SettingsPage db={db} setDb={setDb} resetDb={resetDb}/>}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="mobile-nav">
          <div className="mnav-items">
            {NAV.slice(0,5).map(item=>(
              <button key={item.id} className={`mnav-btn ${page===item.id?"on":""}`} onClick={()=>setPage(item.id)} style={{position:"relative"}}>
                <IC n={item.icon} s={20}/>
                <span>{item.label.slice(0,7)}</span>
                {item.badge&&<span style={{position:"absolute",top:4,right:"calc(50% - 16px)",background:"var(--red)",color:"#fff",fontSize:8,fontFamily:"var(--fm)",padding:"1px 4px",borderRadius:8,fontWeight:700}}>{item.badge}</span>}
              </button>
            ))}
            <button className="mnav-btn" onClick={()=>setUser(null)}><IC n="logout" s={20}/>Quitter</button>
          </div>
        </nav>
      </div>

      {/* PDF Modal global */}
      {pdfInterv && <PDFModal interv={pdfInterv} db={db} onClose={()=>setPdfInterv(null)}/>}
    </>
  );
}
