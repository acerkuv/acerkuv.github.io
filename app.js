import { readJSON } from './utils.js';

let data = {
  p: {},
  d: {}
};

let selectedModel = null;
let selectedModification = null;
let usedDiscounts = {};
let margin = {};
let rrc = 0;

const modelsDiv = document.getElementById('models');
const detailsDiv = document.getElementById('details');

async function init() {
  try {
    data.p = await readJSON('/norm_jsons/p.json');
    data.d = await readJSON('/norm_jsons/d3.json');

    Object.keys(data.p).forEach(model => {
      const btn = document.createElement('button');
      btn.textContent = model;
      btn.onclick = () => selectModel(model);
      modelsDiv.appendChild(btn);
    });
  } catch (err) {
    console.error("Ошибка загрузки JSON:", err);
    detailsDiv.innerHTML = "<p style='color:red;'>Ошибка загрузки данных</p>";
  }
}

function selectModel(model) {
  selectedModel = model;
  clearDetails();

  const group = document.createElement('div');
  Object.keys(data.p[model]).forEach(mod => {
    const btn = document.createElement('button');
    btn.textContent = mod;
    btn.onclick = () => selectModification(mod);
    group.appendChild(btn);
  });

  detailsDiv.appendChild(group);
}

function selectModification(modification) {
  selectedModification = modification;
  clearDetails();

  rrc = data.p[selectedModel][modification];
  usedDiscounts = {};
  margin = { "Маржа": rrc * (selectedModel.includes("ALSVIN") ? 0.05 : 0.06) };

  const priceLabel = document.createElement('div');
  priceLabel.className = 'price-label';
  priceLabel.textContent = `Цена: ${rrc.toLocaleString()} руб`;
  detailsDiv.appendChild(priceLabel);

  const grid = document.createElement('div');
  grid.className = 'grid-container';

  for (const discountName in data.d[selectedModel]) {
    const cleanName = discountName.replace("для клиента", "");
    const btn = document.createElement('button');
    btn.textContent = cleanName;
    btn.onclick = () => clickDiscount(discountName);
    grid.appendChild(btn);
  }

  detailsDiv.appendChild(grid);

  addInput("Стимулирующая", "stim");
  addInput("Trade-In", "tr");

  const dashboard = document.createElement('pre');
  dashboard.id = 'dashboard';
  detailsDiv.appendChild(dashboard);

  printMargin();
}

function addInput(labelText, id) {
  const container = document.createElement('div');
  container.className = 'input-group';

  const label = document.createElement('label');
  label.textContent = labelText + ': ';

  const input = document.createElement('input');
  input.placeholder = labelText;
  input.id = 'e_' + id;

  const button = document.createElement('button');
  button.textContent = 'Применить';
  button.onclick = () => {
    if (id === 'stim') clickStim();
    if (id === 'tr') raschTr();
  };

  container.appendChild(label);
  container.appendChild(input);
  container.appendChild(button);

  detailsDiv.appendChild(container);
}

function clickDiscount(name) {
  const value = data.d[selectedModel][name];
  usedDiscounts[name] = value;
  updateDashboard();
  printMargin();
}

function clickStim() {
  if (!rrc) return alert("Выберите модель и комплектацию");

  const stimInput = document.getElementById('e_stim');
  let stimValue = extractDigits(stimInput.value);

  if (stimValue <= rrc * 0.3) {
    usedDiscounts["Стимулирующая"] = stimValue;
    margin["Стимулирующая"] = -stimValue;
  } else {
    const totalDisc = sumValues(usedDiscounts) + stimValue;
    const remaining = rrc - totalDisc;
    const correctedStim = rrc - sumValues(usedDiscounts) - remaining;
    usedDiscounts["Стимулирующая"] = correctedStim;
    margin["Стимулирующая"] = -correctedStim;
  }

  updateDashboard();
  printMargin();
}

function raschTr() {
  const trInput = document.getElementById('e_tr');
  const trValue = extractDigits(trInput.value);
  margin["Расчетка по Trade-In"] = trValue;
  printMargin();
}

function updateDashboard() {
  const dashboard = document.getElementById('dashboard');
  let text = "";
  let t_rrc = rrc;
  for (const [key, value] of Object.entries(usedDiscounts)) {
    t_rrc -= value;
    text += ` - ${key.replace('для клиента', '')}, ${value.toLocaleString()} руб = ${t_rrc.toLocaleString()}\n`;
  }
  const totalDisc = sumValues(usedDiscounts);
  text += `\nСумма скидок: ${totalDisc.toLocaleString()} руб`;
  dashboard.textContent = text;
}

function printMargin() {
  const totalMargin = sumValues(margin);
  const netMargin = totalMargin / 1.2;

  const oldMarginBox = document.getElementById('margin-box');
  if (oldMarginBox) oldMarginBox.remove();

  const marginBox = document.createElement('div');
  marginBox.id = 'margin-box';
  marginBox.style.color = totalMargin > 0 ? 'green' : 'red';

  marginBox.innerHTML = `
    Маржа: ${totalMargin.toLocaleString()} руб<br>
    Чистая маржа: ${netMargin.toLocaleString()} руб
  `;

  const dashboard = document.getElementById('dashboard');
  if (dashboard) {
    dashboard.parentNode.insertBefore(marginBox, dashboard.nextSibling);
  } else {
    detailsDiv.appendChild(marginBox);
  }
}

function sumValues(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

function extractDigits(str) {
  return parseInt(str.replace(/\D/g, ''), 10) || 0;
}

function clearDetails() {
  detailsDiv.innerHTML = '';
}

window.onload = init;
