let p = {}; // Цены
let d = {}; // Скидки

let model = null;
let rrc = 0;
let usedDiscounts = {};
let margin = {};

const modelButtonsDiv = document.getElementById("model-buttons");
const centerPanel = document.getElementById("center-panel");
const priceLabel = document.getElementById("price-label");
const dashboardContent = document.getElementById("dashboard-content");
const incomeLabel = document.getElementById("income-label");
const discountsGrid = document.getElementById("discounts-grid");

// Загрузка данных
document.addEventListener("DOMContentLoaded", () => {
    fetch('data/p.json')
        .then(res => res.json())
        .then(data => {
            p = data;
            createModelButtons();
        });

    fetch('data/d3.json')
        .then(res => res.json())
        .then(data => {
            d = data;
        });
});

function createModelButtons() {
    modelButtonsDiv.innerHTML = "";
    for (let modelName in p) {
        const btn = document.createElement("button");
        btn.textContent = modelName;
        btn.onclick = () => selectModel(modelName);
        modelButtonsDiv.appendChild(btn);
    }
}

function selectModel(modelName) {
    model = modelName;
    clearCenterPanel();

    const group = document.createElement("div");
    for (let modName in p[model]) {
        const btn = document.createElement("button");
        btn.textContent = modName;
        btn.onclick = () => selectModification(modName);
        group.appendChild(btn);
    }
    centerPanel.appendChild(group);
}

function selectModification(modification) {
    clearCenterPanel();

    rrc = p[model][modification];
    usedDiscounts = {};
    let carM = model.includes("ALSVIN") ? 0.05 : 0.06;
    margin = { "Маржа": rrc * carM };

    // Цена
    priceLabel.textContent = `Цена: ${rrc.toLocaleString()} руб`;
    centerPanel.appendChild(priceLabel);

    // Скидки
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "2fr 1fr";
    grid.style.gap = "10px";

    for (let discountName in d[model]) {
        const btn = document.createElement("button");
        btn.textContent = discountName.replace("для клиента", "");
        btn.onclick = () => applyDiscount(discountName);

        const label = document.createElement("div");
        label.textContent = `${d[model][discountName].toLocaleString()} руб`;

        grid.appendChild(btn);
        grid.appendChild(label);
    }
    centerPanel.appendChild(grid);

    // Стимулирующая
    const stimGroup = document.createElement("div");
    stimGroup.className = "input-group";
    stimGroup.innerHTML = `
        <label>Стимулирующая:</label>
        <input type="text" id="stim-input">
        <button onclick="applyStim()">Применить</button>
    `;
    centerPanel.appendChild(stimGroup);

    // Trade-in
    const trGroup = document.createElement("div");
    trGroup.className = "input-group";
    trGroup.innerHTML = `
        <label>Trade-In:</label>
        <input type="text" id="tr-input">
        <button onclick="calculateTr()">Рассчитать</button>
    `;
    centerPanel.appendChild(trGroup);

    // Результаты
    centerPanel.appendChild(document.getElementById("dashboard"));
}

function extractDigits(str) {
    return parseInt(str.replace(/\D+/g, "")) || 0;
}

function applyDiscount(name) {
    const value = d[model][name];
    usedDiscounts[name] = value;
    updateDashboard();
    printMargin();
}

function applyStim() {
    if (!rrc) return alert("Сначала выберите модель");

    const input = document.getElementById("stim-input").value;
    let value = extractDigits(input);

    if (value <= rrc * 0.3) {
        usedDiscounts["Стимулирующая"] = value;
        margin["Стимулирующая"] = -value;
    } else {
        const total = sumObjectValues(usedDiscounts);
        const leftover = rrc - total - value;
        usedDiscounts["Стимулирующая"] = value;
        margin["Стимулирующая"] = -value;
    }

    updateDashboard();
    printMargin();
}

function calculateTr() {
    const input = document.getElementById("tr-input").value;
    const value = extractDigits(input);
    margin["Расчетка по Trade-In"] = value;
    printMargin();
}

function updateDashboard() {
    let result = "";
    let totalRRC = rrc;

    for (let key in usedDiscounts) {
        totalRRC -= usedDiscounts[key];
        result += ` - ${key}, ${usedDiscounts[key].toLocaleString()} руб = ${totalRRC.toLocaleString()}\n`;
    }

    const totalDisc = sumObjectValues(usedDiscounts);
    result += `\nСумма скидок: ${totalDisc.toLocaleString()} руб`;
    dashboardContent.textContent = result;
}

function printMargin() {
    const total = sumObjectValues(margin);
    const color = total > 0 ? "green" : "red";
    incomeLabel.innerHTML = `
        Маржа: ${total.toLocaleString()} руб<br>
        Чистая маржа: ${(total / 1.2).toLocaleString()} руб
    `;
    incomeLabel.style.color = color;
    incomeLabel.style.fontWeight = "bold";
}

function sumObjectValues(obj) {
    return Object.values(obj).reduce((a, b) => a + b, 0);
}

function clearCenterPanel() {
    while (centerPanel.firstChild && centerPanel.firstChild !== document.getElementById("dashboard")) {
        centerPanel.removeChild(centerPanel.firstChild);
    }
}