export const PROJECTS = [
  {
    id: "paint_room",
    name: "Paint a Room",
    blurb: "Walls only — materials + labor.",
    fields: [
      { key:"L", label:"Room length (ft)", type:"number", min:1, step:1, def:12 },
      { key:"W", label:"Room width (ft)", type:"number", min:1, step:1, def:10 },
      { key:"H", label:"Ceiling height (ft)", type:"number", min:7, step:1, def:8 },
      { key:"openings", label:"Doors + windows", type:"number", min:0, step:1, def:2 },
      { key:"quality", label:"Paint quality", type:"select", def:"basic", options:[
        { value:"basic", label:"Basic" },
        { value:"premium", label:"Premium" }
      ]}
    ],
    compute: (a)=>{
      const L=n(a.L), W=n(a.W), H=n(a.H), openings=n(a.openings);
      const wallSqft = Math.max(0, 2*(L+W)*H - openings*20);
      const gallons = Math.max(1, Math.ceil(wallSqft/350));
      const paintPerGal = a.quality === "premium" ? 70 : 35;

      const materials = gallons*paintPerGal + 25; // rollers/tape/plastic
      const labor = wallSqft*1.5;                 // $/sqft labor
      const total = materials + labor;

      return range(materials, labor, total*0.85, total*1.15, [
        `Wall area: ${r(wallSqft)} sq ft`,
        `Paint needed: ${gallons} gallon(s)`
      ]);
    },
    tips: [
      "Ask if prep work (patching/sanding) is included.",
      "Confirm number of coats (1 vs 2).",
      "Ask if moving furniture / protecting floors is included."
    ]
  },

  {
    id: "water_heater",
    name: "Replace Water Heater",
    blurb: "Unit + install labor (basic estimate).",
    fields: [
      { key:"size", label:"Tank size", type:"select", def:"50", options:[
        { value:"40", label:"40 gallon" },
        { value:"50", label:"50 gallon" },
        { value:"75", label:"75 gallon" }
      ]},
      { key:"fuel", label:"Type", type:"select", def:"gas", options:[
        { value:"gas", label:"Gas" },
        { value:"electric", label:"Electric" }
      ]},
      { key:"access", label:"Access", type:"select", def:"garage", options:[
        { value:"garage", label:"Garage / easy" },
        { value:"closet", label:"Closet / moderate" },
        { value:"attic", label:"Attic / hard" }
      ]}
    ],
    compute: (a)=>{
      const unitBase = ({ "40":700, "50":900, "75":1400 })[a.size] ?? 900;
      const fuelAdj  = a.fuel === "gas" ? 150 : 0;
      const unit     = unitBase + fuelAdj;

      const laborBase = ({ garage:600, closet:850, attic:1200 })[a.access] ?? 850;

      const materials = unit + 75;  // fittings + disposal allowance
      const labor = laborBase;
      const total = materials + labor;

      return range(materials, labor, total*0.85, total*1.20, [
        `Unit estimate: ${money(unit)}`,
        `Access: ${a.access}`
      ]);
    },
    tips: [
      "Ask if permit/inspection is required and included.",
      "Confirm disposal of the old unit is included.",
      "Ask about warranty (unit + labor)."
    ]
  },

  {
    id: "flooring",
    name: "Install Flooring",
    blurb: "By square footage (materials + labor).",
    fields: [
      { key:"sqft", label:"Total square feet", type:"number", min:50, step:10, def:300 },
      { key:"type", label:"Flooring type", type:"select", def:"vinyl", options:[
        { value:"laminate", label:"Laminate" },
        { value:"vinyl", label:"Luxury vinyl (LVP)" },
        { value:"hardwood", label:"Hardwood" }
      ]},
      { key:"removal", label:"Remove old flooring?", type:"select", def:"yes", options:[
        { value:"yes", label:"Yes" },
        { value:"no", label:"No" }
      ]}
    ],
    compute: (a)=>{
      const sqft = n(a.sqft);
      const wasteSqft = sqft*1.10; // 10% waste

      const materialPer = ({ laminate:3, vinyl:4, hardwood:8 })[a.type] ?? 4;
      const laborPer = 2.5;
      const removalPer = a.removal === "yes" ? 1.25 : 0;

      const materials = wasteSqft*materialPer;
      const labor = wasteSqft*(laborPer+removalPer);
      const total = materials + labor;

      return range(materials, labor, total*0.88, total*1.18, [
        `Area w/ waste: ${r(wasteSqft)} sq ft`,
        `Material rate: $${materialPer}/sqft`,
        `Labor rate: $${(laborPer+removalPer)}/sqft`
      ]);
    },
    tips: [
      "Ask if subfloor prep/leveling is included.",
      "Ask if transitions/baseboards are included.",
      "Confirm disposal and moving furniture."
    ]
  }
];

// Helpers
function n(x){ const v = Number(x); return Number.isFinite(v) ? v : 0; }
function r(x){ return Math.round(x*10)/10; }
function money(x){ return `$${Math.round(x).toLocaleString()}`; }
function range(materials, labor, low, high, details){
  return { materials, labor, low, high, details };
}
