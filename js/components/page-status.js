import { MONTHS_ORDER } from '../constants.js';
import { norm, count, getUnique, parseDateBR } from '../utils.js';
import { renderChartJS } from '../charts.js';
import { getFilteredData, getRawData } from '../store.js';

let p4SortCol = 'DEMANDA';
let p4SortAsc = true;

export function updatePage4(filteredData, rawData) {
    filteredData = filteredData || getFilteredData();
    rawData = rawData || getRawData();
    if (!filteredData || filteredData.length === 0) return;
    const activeMonthGlobal = document.getElementById('f-mes').value;

    document.getElementById('k4-ain').innerText = count(filteredData, 'STATUS', 'a iniciar');
    document.getElementById('k4-kic').innerText = count(filteredData, 'STATUS', 'kickoff');
    document.getElementById('k4-pro').innerText = count(filteredData, 'STATUS', 'produção de roteiro');
    document.getElementById('k4-val').innerText = count(filteredData, 'STATUS', 'em validação');
    document.getElementById('k4-emp').innerText = count(filteredData, 'STATUS', 'em produção');
    document.getElementById('k4-con').innerText = count(filteredData, 'STATUS', 'concluído');
    document.getElementById('k4-pau').innerText = count(filteredData, 'STATUS', 'em pausa');
    document.getElementById('k4-can').innerText = count(filteredData, 'STATUS', 'cancelado');

    let p4MonthData = {};

    if (activeMonthGlobal === 'All') {
        MONTHS_ORDER.forEach(m => p4MonthData[m] = 0);
        filteredData.forEach(d => {
            let m = (d['MÊS'] || '').toUpperCase();
            if (p4MonthData[m] !== undefined) p4MonthData[m]++;
        });
    } else {
        const stData = {};
        getUnique(rawData, 'STATUS').forEach(st => stData[st.toLowerCase()] = 0);
        filteredData.forEach(d => {
            let st = (d['STATUS'] || '').toLowerCase();
            if (stData[st] !== undefined) stData[st]++;
        });
        p4MonthData = stData;
    }

    const formatData = {};
    const formatDisplay = {};
    filteredData.forEach(d => {
        let rawFmt = d['FORMATO'] || 'Outro';
        let fmt = norm(rawFmt);
        if (!formatData[fmt]) {
            formatData[fmt] = 0;
            formatDisplay[fmt] = rawFmt;
        }
        formatData[fmt]++;
    });

    const chartP4Title = activeMonthGlobal === 'All' ? 'Volume Mensal' : 'Status em ' + activeMonthGlobal;
    setTimeout(() => renderChartJS('chart-p4-month', Object.keys(p4MonthData), Object.values(p4MonthData), chartP4Title), 0);

    const sortedFmt = Object.entries(formatData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    setTimeout(() => renderChartJS('chart-p4-format', sortedFmt.map(e => formatDisplay[e[0]]), sortedFmt.map(e => e[1]), 'Top Formatos'), 50);

    renderP4Table(filteredData);
}

export function sortP4Table(col) {
    if (p4SortCol === col) {
        p4SortAsc = !p4SortAsc;
    } else {
        p4SortCol = col;
        p4SortAsc = true;
    }
    const event = new Event('p4-sort-changed');
    document.dispatchEvent(event);
}

export function getSortState() {
    return { col: p4SortCol, asc: p4SortAsc };
}

function renderP4Table(dataArr) {
    let viewData = [...dataArr];
    const today = new Date();

    const getAge = (d) => {
        const dSol = parseDateBR(d['SOLICITAÇÃO']);
        const dEnt = parseDateBR(d['ENTREGA']);
        const status = (d['STATUS'] || '').toLowerCase();
        if (status === 'concluído' || status === 'concluido') {
            return (dSol && dEnt) ? Math.ceil(Math.abs(dEnt - dSol) / (1000 * 60 * 60 * 24)) : 0;
        }
        return dSol ? Math.ceil(Math.abs(today - dSol) / (1000 * 60 * 60 * 24)) : 0;
    };

    viewData.sort((a, b) => {
        let valA, valB;

        if (p4SortCol === 'IDADE') {
            valA = getAge(a);
            valB = getAge(b);
        } else {
            valA = (a[p4SortCol] || '').toLowerCase();
            valB = (b[p4SortCol] || '').toLowerCase();
        }

        if (valA < valB) return p4SortAsc ? -1 : 1;
        if (valA > valB) return p4SortAsc ? 1 : -1;
        return 0;
    });

    const tb = document.getElementById('p4-table-body');
    let tbHtml = '';
    const displayLimit = 100;

    viewData.slice(0, displayLimit).forEach(d => {
        const age = getAge(d);
        const status = (d['STATUS'] || '').toLowerCase();
        const isOld = age > 15 && status !== 'concluído' && status !== 'concluido';
        const ageClass = isOld ? 'age-warning' : '';

        tbHtml += `
            <div class="p4-table-row ${ageClass}">
                <span>${d['DEMANDA']}</span>
                <span>${d['SOLICITANTE']}</span>
                <span>${d['RESPONSÁVEL']}</span>
                <span><span class="age-badge">${age} dias</span></span>
            </div>`;
    });
    if (viewData.length > displayLimit) {
        tbHtml += `<div class="p4-table-row" style="justify-content:center; color:var(--pink); font-style:italic; border:none;">Mostrando os primeiros ${displayLimit} de ${viewData.length} itens. Use os filtros para refinar.</div>`;
    }
    tb.innerHTML = tbHtml;

    const p4Header = document.querySelector('#content-4 .p4-table-header');
    if (p4Header) {
        p4Header.querySelectorAll('span').forEach(span => {
            const icon = span.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sort';
                if (span.innerText.includes(p4SortCol)) {
                    icon.className = p4SortAsc ? 'fas fa-sort-up' : 'fas fa-sort-down';
                }
            }
        });
    }
}
