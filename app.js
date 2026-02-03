import { PROJECTS } from "./projects.js";

const $ = (id) => document.getElementById(id);

const scrProjects = $("screenProjects");
const scrForm = $("screenForm");
const scrResult = $("screenResult");

let current = null;
let answers = {};

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

function money(x){
  return `$${Math.round(x).toLocaleString()}`;
}
