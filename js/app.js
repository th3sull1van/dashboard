import { MONTHS_ORDER, CANONICAL_STATUSES } from './constants.js';
import { norm, equals, getUnique, parseInputDate, parseDateBR } from './utils.js';
import { populateHeaderSelects, populateDemandSelector } from './filters.js';
import { goToPage, goToCover, updateActivePage } from './router.js';
import { exportToPDF, exportToExcel } from './export.js';
import { updatePage1 } from './components/page-trilha.js';
import { updatePage2 } from './components/page-kpis.js';
import { updatePage3, filterP3List, toggleP3Row } from './components/page-resumo.js';
import { updatePage4, sortP4Table } from './components/page-status.js';
import { updatePage5, toggleP5Group } from './components/page-qualidade.js';
import { updatePage6 } from './components/page-insights.js';
import { getRawData, getFilteredData, setFilteredData } from './store.js';
import { syncGoogleSheets, clearCache, saveCache, processFile } from './cache.js';

let filterTimeout;

export function debouncedApplyFilters() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        applyFilters();
    }, 50);
}

export function applyFilters() {
    if (getRawData().length === 0) return;

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

    const filtered = getRawData().filter(d => {
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

    setFilteredData(filtered);

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

export function initApp(isFromCache = false) {
    populateHeaderSelects(getRawData());

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

    populateDemandSelector(getFilteredData());
    applyFilters();

    if (!isFromCache) saveCache();

    document.getElementById('upload-area').style.display = 'none';
    setTimeout(() => {
        goToPage(1);
        document.getElementById('upload-status').innerText = "";
        document.getElementById('cached-info').style.display = 'block';
    }, 50);
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

    // Expose to window for HTML event handlers
    window.goToPage = goToPage;
    window.goToCover = goToCover;
    window.debouncedApplyFilters = debouncedApplyFilters;
    window.applyFilters = applyFilters;
    window.syncGoogleSheets = syncGoogleSheets;
    window.clearCache = clearCache;
    window.exportToPDF = exportToPDF;
    window.exportToExcel = exportToExcel;
    window.toggleP5Group = toggleP5Group;
    window.sortP4Table = sortP4Table;
    window.toggleP3Row = toggleP3Row;
    window.filterP3List = filterP3List;
    window.updatePage1 = updatePage1;
    window.updatePage2 = updatePage2;
    window.updatePage3 = updatePage3;
    window.updatePage4 = updatePage4;
    window.updatePage5 = updatePage5;
    window.updatePage6 = updatePage6;
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