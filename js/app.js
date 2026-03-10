import { MONTHS_ORDER, CANONICAL_STATUSES } from './constants.js';
import { norm, equals, getUnique, parseInputDate, parseDateBR } from './utils.js';
import { rawData, getGlobalFilteredData, setGlobalFilteredData, saveCache, loadFromCache, clearCache, syncGoogleSheets, processFile } from './cache.js';
import { updateActivePage, filterP3List, toggleP5Group, sortP4Table, toggleP3Row, updatePage1 } from './pages.js';
import { exportToPDF, exportToExcel } from './export.js';

let filterTimeout;

export function debouncedApplyFilters() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        applyFilters();
    }, 50);
}

export function applyFilters() {
    if (rawData.length === 0) return;

    const dIni = parseInputDate(document.getElementById('f-data-ini').value);
    const dFim = parseInputDate(document.getElementById('f-data-fim').value);
    const search = norm(document.getElementById('f-search').value);
    const ano = document.getElementById('f-ano').value;
    const mes = document.getElementById('f-mes').value;
    const sol = document.getElementById('f-solicitante').value;
    const res = document.getElementById('f-responsavel').value;
    const fmt = document.getElementById('f-formato').value;
    const stat = document.getElementById('f-status').value;
    const fre = document.getElementById('f-frente').value;

    const filtered = rawData.filter(d => {
        let validDate = true;
        if (dIni || dFim) {
            const dSol = parseDateBR(d['SOLICITAÇÃO']);
            if (dSol) {
                if (dIni && dSol < dIni) validDate = false;
                if (dFim && dSol > dFim) validDate = false;
            }
        }

        let validSearch = true;
        if (search) {
            const content = norm(`${d['DEMANDA']} ${d['SOLICITANTE']} ${d['RESPONSÁVEL']} ${d['FORMATO']} ${d['STATUS']}`);
            if (!content.includes(search)) validSearch = false;
        }

        return validDate && validSearch &&
            (ano === 'All' || equals(d['ANO'], ano)) &&
            (mes === 'All' || equals(d['MÊS'], mes)) &&
            (sol === 'All' || equals(d['SOLICITANTE'], sol)) &&
            (res === 'All' || equals(d['RESPONSÁVEL'], res)) &&
            (fmt === 'All' || equals(d['FORMATO'], fmt)) &&
            (stat === 'All' || equals(d['STATUS'], stat)) &&
            (fre === 'All' || equals(d['FRENTE'], fre));
    });

    setGlobalFilteredData(filtered);

    const selP1 = document.getElementById('p1-demanda-select');
    const currentP1 = selP1.value;
    let p1Html = '';
    filtered.forEach(d => {
        p1Html += `<option value="${d['DEMANDA']}">${d['DEMANDA']}</option>`;
    });
    selP1.innerHTML = p1Html;
    if (filtered.some(d => d['DEMANDA'] === currentP1)) selP1.value = currentP1;

    requestAnimationFrame(() => {
        updateActivePage();
    });
}

export function populateHeaderSelects() {
    fillSelect('f-ano', getUnique(rawData, 'ANO'));
    fillSelect('f-mes', getUnique(rawData, 'MÊS'), true);
    fillSelect('f-solicitante', getUnique(rawData, 'SOLICITANTE'));
    fillSelect('f-responsavel', getUnique(rawData, 'RESPONSÁVEL'));
    fillSelect('f-formato', getUnique(rawData, 'FORMATO'));

    const uniqueInBase = getUnique(rawData, 'STATUS');
    const allStatuses = [...new Set([...CANONICAL_STATUSES, ...uniqueInBase])];
    fillSelect('f-status', allStatuses);

    fillSelect('f-frente', getUnique(rawData, 'FRENTE'));
}

function populatePageSpecificFilters() {
    const selP1 = document.getElementById('p1-demanda-select');
    let p1Html = '';
    rawData.forEach(d => {
        p1Html += `<option value="${d['DEMANDA']}">${d['DEMANDA']}</option>`;
    });
    selP1.innerHTML = p1Html;
}

function fillSelect(id, values, isMonth = false) {
    const sel = document.getElementById(id);
    if (isMonth) values.sort((a, b) => MONTHS_ORDER.indexOf(norm(a)) - MONTHS_ORDER.indexOf(norm(b)));
    let html = `<option value="All">Todos</option>`;
    values.forEach(v => {
        html += `<option value="${v}">${v}</option>`;
    });
    sel.innerHTML = html;
}

export function initApp(isFromCache = false) {
    populateHeaderSelects();

    const now = new Date();
    const anoSel = document.getElementById('f-ano');
    const mesSel = document.getElementById('f-mes');
    const statSel = document.getElementById('f-status');
    const currentYear = now.getFullYear().toString();
    if (anoSel) {
        for (const opt of anoSel.options) {
            if (opt.value === currentYear) {
                anoSel.value = currentYear;
                break;
            }
        }
    }
    const monthName = MONTHS_ORDER[now.getMonth()];
    if (mesSel) {
        for (const opt of mesSel.options) {
            if (norm(opt.value) === norm(monthName)) {
                mesSel.value = opt.value;
                break;
            }
        }
    }
    const defaultStatus = 'Em produção';
    if (statSel) {
        for (const opt of statSel.options) {
            if (norm(opt.value) === norm(defaultStatus)) {
                statSel.value = opt.value;
                break;
            }
        }
    }

    populatePageSpecificFilters();
    applyFilters();

    if (!isFromCache) saveCache();

    document.getElementById('upload-area').style.display = 'none';
    setTimeout(() => {
        goToPage(4);
        document.getElementById('upload-status').innerText = "";
        document.getElementById('cached-info').style.display = 'block';
    }, 50);
}

export function goToCover() {
    document.getElementById('page-0').classList.add('active');
    document.getElementById('app-pages').classList.remove('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-0').classList.add('active');
}

export function goToPage(pageIndex) {
    if (rawData.length === 0) { alert("Carregue o CSV primeiro na tela inicial."); return; }

    document.getElementById('page-0').classList.remove('active');
    document.getElementById('app-pages').classList.add('active');

    for (let i = 1; i <= 6; i++) {
        const content = document.getElementById('content-' + i);
        if (content) content.style.display = 'none';
    }

    const targetContent = document.getElementById('content-' + pageIndex);
    if (targetContent) targetContent.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById('nav-' + pageIndex);
    if (navItem) navItem.classList.add('active');

    const headerFilters = ['.h-periodo', '.h-ano', '.h-mes', '.h-solic', '.h-resp', '.h-search', '.h-formato', '.h-status', '.h-frente'];
    headerFilters.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'flex';
    });

    requestAnimationFrame(() => {
        updateActivePage();
    });
}

export function setupEventListeners() {
    const uploadArea = document.getElementById('upload-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileUpload(file);
    }, false);

    document.getElementById('csvFileInput').addEventListener('change', function (evt) {
        handleFileUpload(evt.target.files[0]);
    });

    window.goToPage = goToPage;
    window.goToCover = goToCover;
    window.debouncedApplyFilters = debouncedApplyFilters;
    window.applyFilters = applyFilters;
    window.syncGoogleSheets = async () => {
        const result = await syncGoogleSheets();
        if (result) {
            initApp();
        }
    };
    window.clearCache = clearCache;
    window.exportToPDF = exportToPDF;
    window.exportToExcel = exportToExcel;
    window.toggleP5Group = toggleP5Group;
    window.sortP4Table = sortP4Table;
    window.toggleP3Row = toggleP3Row;
    window.filterP3List = filterP3List;
    window.updatePage1 = updatePage1;
}

export async function handleFileUpload(file) {
    if (!file) return;
    try {
        await processFile(file);
        initApp();
    } catch (err) {
        document.getElementById('upload-status').innerText = err;
        document.getElementById('upload-status').style.color = "red";
    }
}
