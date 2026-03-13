import { MONTHS_ORDER, CANONICAL_STATUSES } from './constants.js';
import { norm, equals, getUnique, parseInputDate } from './utils.js';
import { setFilteredData } from './store.js';

export function populateHeaderSelects(rawData) {
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

export function populateDemandSelector(filteredData) {
    const selP1 = document.getElementById('p1-demanda-select');
    const currentP1 = selP1.value;
    let p1Html = '';
    filteredData.forEach(d => {
        p1Html += `<option value="${d['DEMANDA']}">${d['DEMANDA']}</option>`;
    });
    selP1.innerHTML = p1Html;
    if (filteredData.some(d => d['DEMANDA'] === currentP1)) selP1.value = currentP1;
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

export function applyFilters() {
    // This will be called from app.js - the actual logic remains there for now
    // This is just a placeholder to maintain the import
}

export function debouncedApplyFilters() {
    // Placeholder
}
