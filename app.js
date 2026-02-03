import { PROJECTS } from "./projects.js";

const $ = (id) => document.getElementById(id);

const scrProjects = $("screenProjects");
const scrForm = $("screenForm");
const scrResult = $("screenResult");

let current = null;
let answers = {};
const HISTORY_KEY = "hre_v2_history";
renderProjectList();

function show(which){
  scrProjects.classList.toggle("hidden", which !== "projects");
  scrForm.classList.toggle("hidden", which !== "form");
  scrResult.classList.toggle("hidden", which !== "result");
}

function renderProjectList(){
  current = null;

  scrProjects.innerHTML = `
    <h2>Choose a project</h2>
    <div class="grid" id="grid"></div>
  `;
  const grid = $("grid");

  PROJECTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>${p.name}</strong>
      <div><small>${p.blurb}</small></div>
      <div style="margin-top:10px">
        <button class="btn primary">Start</button>
      </div>
    `;
    card.querySelector("button").onclick = () => openProject(p.id);
    grid.appendChild(card);
  });

  show("projects");
}

function openProject(id){
  current = PROJECTS.find(p => p.id === id);
  answers = {};

  const fieldsHtml = current.fields.map(f => {
    answers[f.key] = f.def ?? "";

    if (f.type === "select") {
      const opts = (f.options || [])
        .map(o => `<option value="${o.value}">${o.label}</option>`)
        .join("");

      return `
        <div class="card">
          <label>${f.label}</label>
          <select id="${f.key}">${opts}</select>
        </div>
      `;
    }

    return `
      <div class="card">
        <label>${f.label}</label>
        <input id="${f.key}" type="number"
          min="${f.min ?? ""}" step="${f.step ?? "1"}" value="${f.def ?? ""}" />
      </div>
    `;
  }).join("");

  scrForm.innerHTML = `
    <button class="btn secondary" id="back1">← Back</button>

    <h2 style="margin-top:10px">${current.name}</h2>
    <p class="sub">${current.blurb}</p>

    ${fieldsHtml}

    <div class="card">
      <label>Contractor quote (optional)</label>
      <input id="quote" type="number" min="0" step="1" placeholder="e.g., 3200" />
    </div>

    <button class="btn primary" id="calc">Get estimate</button>
  `;

  $("back1").onclick = renderProjectList;

  // Wire inputs
  current.fields.forEach(f => {
    const el = $(f.key);
    if (f.type === "select") {
      el.value = f.def ?? "";
      answers[f.key] = el.value;
      el.onchange = () => { answers[f.key] = el.value; };
    } else {
      answers[f.key] = el.value;
      el.oninput = () => { answers[f.key] = el.value; };
    }
  });

  $("calc").onclick = () => {
    const quote = Number($("quote").value || 0);
    const result = current.compute(answers);
    renderResult(result, quote);
  };

  show("form");
}

function renderResult(r, quote){
  const compare = quote > 0 ? quoteCompare(quote, r.low, r.high) : "";

  const details = (r.details || []).map(d => `<li>${d}</li>`).join("");
  const tips = (current.tips || []).map(t => `<li>${t}</li>`).join("");

  scrResult.innerHTML = `
    <button class="btn secondary" id="back2">← Back</button>

    <h2 style="margin-top:10px">${current.name} — Estimate</h2>

    <div class="card kpi">
      <div class="k">
        <div class="t">Materials</div>
        <div class="v">${money(r.materials)}</div>
      </div>
      <div class="k">
        <div class="t">Labor</div>
        <div class="v">${money(r.labor)}</div>
      </div>
      <div class="k" style="grid-column:1/-1">
        <div class="t">Fair total range</div>
        <div class="v">${money(r.low)} – ${money(r.high)}</div>
      </div>
    </div>

    ${compare ? `<div class="card"><strong>Quote check:</strong><br>${compare}</div>` : ""}

    <div class="card">
      <strong>Details</strong>
      <ul>${details}</ul>
    </div>

    <div class="card">
      <strong>Questions to ask</strong>
      <ul>${tips}</ul>
    </div>

    <div class="card">
      <strong>Saved estimates</strong>
      <div id="history"></div>
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn secondary" id="save">Save this estimate</button>
        <button class="btn secondary" id="clearHistory">Clear history</button>
      </div>
      <div id="saveMsg" style="margin-top:8px"><small></small></div>
    </div>

    <button class="btn primary" id="new">New estimate</button>
  `;

  $("back2").onclick = () => show("form");
  $("new").onclick = renderProjectList;

  $("save").onclick = () => {
    saveEstimate({
      ts: Date.now(),
      projectId: current.id,
      projectName: current.name,
      quote,
      result: r
    });
    renderHistory();
    $("saveMsg").innerHTML = "<small>Saved ✅</small>";
  };

  $("clearHistory").onclick = () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    $("saveMsg").innerHTML = "<small>History cleared.</small>";
  };

  renderHistory();
  show("result");
}

function quoteCompare(q, low, high){
  if(q < low){
    const pct = Math.round((1 - q/low) * 100);
    return `Your quote (${money(q)}) is about <strong>${pct}% BELOW</strong> the fair range. Confirm scope/quality.`;
  }
  if(q > high){
    const pct = Math.round((q/high - 1) * 100);
    return `Your quote (${money(q)}) is about <strong>${pct}% ABOVE</strong> the fair range. Get another estimate.`;
  }
  return `Your quote (${money(q)}) is <strong>within</strong> the fair range.`;
}
function loadHistory(){
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveEstimate(item){
  const history = loadHistory();
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 25)));
}

function renderHistory(){
  const host = $("history");
  if(!host) return;

  const history = loadHistory();
  if(history.length === 0){
    host.innerHTML = "<small>No saved estimates yet.</small>";
    return;
  }

  host.innerHTML = history.map(h => {
    const dt = new Date(h.ts).toLocaleString();
    return `
      <div class="card" style="margin-top:10px">
        <strong>${h.projectName}</strong><br>
        <small>${dt}</small><br>
        Range: ${money(h.result.low)} – ${money(h.result.high)}
        ${h.quote ? `<br>Quote: ${money(h.quote)}` : ""}
      </div>
    `;
  }).join("");
}
function money(x){
  return `$${Math.round(x).toLocaleString()}`;
}
