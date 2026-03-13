import { MONTHS_ORDER } from '../constants.js';
import { norm, num } from '../utils.js';
import { getFilteredData } from '../store.js';

export function updatePage6(filteredData) {
    filteredData = filteredData || getFilteredData();
    if (!filteredData || filteredData.length === 0) return;

    const groupData = (key) => {
        const counts = {};
        const displays = {};
        filteredData.forEach(d => {
            const raw = d[key] || 'N/A';
            const n = norm(raw);
            if (!displays[n]) displays[n] = raw;
            counts[n] = (counts[n] || 0) + 1;
        });
        const final = {};
        Object.keys(counts).forEach(n => final[displays[n]] = counts[n]);
        return final;
    };

    const renderRank = (id, counts, isPercent = false, customMax = null) => {
        const container = document.getElementById(id);
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        let max = 1;
        if (customMax) {
            max = customMax;
        } else if (isPercent) {
            max = 100;
        } else {
            max = sorted.length > 0 ? sorted[0][1] : 1;
        }

        let html = '';
        sorted.forEach(([label, value]) => {
            const perc = Math.min(100, (value / max * 100)).toFixed(0);

            let displayValue;
            if (isPercent) {
                displayValue = value.toFixed(1) + '%';
            } else {
                displayValue = (value % 1 === 0) ? value : value.toFixed(2);
            }

            html += `
                <div class="rank-item">
                    <div class="rank-info">
                        <span>${label}</span>
                        <span>${displayValue}</span>
                    </div>
                    <div class="rank-bar-bg">
                        <div class="rank-bar-fill" style="width: ${perc}%"></div>
                    </div>
                </div>`;
        });
        container.innerHTML = html || '<div style="text-align:center; padding:20px; color:var(--text-gray); font-size:12px;">Sem dados no período</div>';
    };

    renderRank('rank-solicitantes', groupData('SOLICITANTE'));
    renderRank('rank-formatos', groupData('FORMATO'));

    const fmtTotals = {};
    const fmtRatings = {};
    const fmtDisplay = {};
    filteredData.forEach(d => {
        const rawF = d['FORMATO'] || 'N/A';
        const f = norm(rawF);
        const rating = num(d['Experiência Geral - Consultor']);
        if (rating > 0) {
            if (!fmtDisplay[f]) fmtDisplay[f] = rawF;
            fmtTotals[f] = (fmtTotals[f] || 0) + 1;
            fmtRatings[f] = (fmtRatings[f] || 0) + rating;
        }
    });
    const fmtAvgs = {};
    Object.keys(fmtTotals).forEach(f => {
        fmtAvgs[fmtDisplay[f]] = fmtRatings[f] / fmtTotals[f];
    });
    renderRank('rank-csat-formato', fmtAvgs, false, 5);

    const solTotals = {};
    const solFeedbacks = {};
    const solDisplay = {};
    filteredData.forEach(d => {
        const rawS = d['SOLICITANTE'] || 'N/A';
        const s = norm(rawS);
        if (!solDisplay[s]) solDisplay[s] = rawS;
        solTotals[s] = (solTotals[s] || 0) + 1;
        if (num(d['Experiência Geral - Consultor']) > 0) {
            solFeedbacks[s] = (solFeedbacks[s] || 0) + 1;
        }
    });

    const avaRatios = {};
    Object.keys(solTotals).forEach(s => {
        avaRatios[solDisplay[s]] = (solFeedbacks[s] || 0) / solTotals[s] * 100;
    });
    renderRank('rank-avaliadores', avaRatios, true);

    renderRank('rank-frentes', groupData('FRENTE'));
}
