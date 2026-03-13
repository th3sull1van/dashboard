import { norm, num, count, avg } from '../utils.js';
import { getFilteredData } from '../store.js';

export function updatePage3(filteredData) {
    filteredData = filteredData || getFilteredData();
    if (!filteredData || filteredData.length === 0) return;
    const tot = filteredData.length;
    const conc = count(filteredData, 'STATUS', 'concluído');
    const exc = count(filteredData, 'STATUS DA META', 'Fora do prazo');
    const apr = count(filteredData, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');
    const aju = count(filteredData, 'Classificação de Ajuste', 'Com Ajuste');

    document.getElementById('k3-sol').innerText = tot;
    document.getElementById('k3-con').innerText = conc;

    document.getElementById('k3-exc').innerText = exc;
    document.getElementById('k3-exc-p').innerText = tot ? ((exc / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-apr').innerText = apr;
    document.getElementById('k3-apr-p').innerText = tot ? ((apr / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-aju').innerText = aju;
    document.getElementById('k3-aju-p').innerText = tot ? ((aju / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-n0').innerText = ((avg(filteredData, 'Prazo - Consultor') + avg(filteredData, 'Assertividade - Consultor') + avg(filteredData, 'Design - Consultor')) / 3).toFixed(2);
    document.getElementById('k3-n1').innerText = avg(filteredData, 'Prazo - Consultor').toFixed(2);
    document.getElementById('k3-n2').innerText = avg(filteredData, 'Assertividade - Consultor').toFixed(2);
    document.getElementById('k3-n3').innerText = avg(filteredData, 'Storytelling - Consultor').toFixed(2);
    document.getElementById('k3-n4').innerText = avg(filteredData, 'Experiência Geral - Consultor').toFixed(2);

    const fGrps = {};
    const fDisplay = {};
    filteredData.forEach(d => {
        const rawF = d['FORMATO'] || 'Indefinido';
        const f = norm(rawF);
        if (!fGrps[f]) {
            fGrps[f] = { apr1: 0, reajustes: 0, demands: [] };
            fDisplay[f] = rawF;
        }
        if (d['STATUS_APROVACAO_CALC'] === 'Aprovado de Primeira') fGrps[f].apr1++;
        fGrps[f].reajustes += num(d['Nº DE VERSÕES']) > 1 ? (num(d['Nº DE VERSÕES']) - 1) : 0;
        fGrps[f].demands.push(d['DEMANDA']);
    });

    const tb = document.getElementById('p3-tbody');
    let tbHtml = '';
    Object.entries(fGrps).forEach(([fKey, data], idx) => {
        const rowId = `p3-row-details-${idx}`;
        const fLabel = fDisplay[fKey];
        tbHtml += `
            <tr class="p3-parent-row" onclick="toggleP3Row('${rowId}', this)">
                <td><i class="far fa-plus-square"></i> ${fLabel}</td>
                <td>${data.apr1}</td>
                <td>${data.reajustes}</td>
            </tr>
            <tr id="${rowId}" class="p3-details-row" style="display: none;">
                <td colspan="3">
                    <ul class="p3-nested-list">
                        ${data.demands.map(dem => `<li><i class="fas fa-chevron-right" style="font-size:8px; margin-right:5px; color:var(--pink);"></i> ${dem}</li>`).join('')}
                    </ul>
                </td>
            </tr>`;
    });
    tb.innerHTML = tbHtml;

    const lst = document.getElementById('p3-demanda-list');
    lst.innerHTML = '';
    filteredData.slice(-15).forEach(d => {
        lst.innerHTML += `<div class="p3-list-item">${d['DEMANDA']}</div>`;
    });
}

export function filterP3List() {
    const search = document.getElementById('p3-search-list').value.toLowerCase();
    const items = document.querySelectorAll('#p3-demanda-list .p3-list-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'block' : 'none';
    });
}

export function toggleP3Row(rowId, rowEl) {
    const row = document.getElementById(rowId);
    const icon = rowEl.querySelector('i');
    if (row.style.display === 'none') {
        row.style.display = 'table-row';
        icon.classList.replace('fa-plus-square', 'fa-minus-square');
    } else {
        row.style.display = 'none';
        icon.classList.replace('fa-minus-square', 'fa-plus-square');
    }
}
