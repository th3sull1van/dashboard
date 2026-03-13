import { num, parseDateBR, formatDateValue } from '../utils.js';
import { getFilteredData, getRawData } from '../store.js';

export function updatePage1(filteredData, rawData) {
    filteredData = filteredData || getFilteredData();
    rawData = rawData || getRawData();
    if (!filteredData || filteredData.length === 0) return;
    const selVal = document.getElementById('p1-demanda-select').value;
    const item = filteredData.find(d => d['DEMANDA'] === selVal) || filteredData[filteredData.length - 1];

    const getD = (k) => item[k] || '--/--/----';

    const stepKeys = ['SOLICITAÇÃO', 'KICKOFF', 'ENVIO DO ROTEIRO', 'VALIDAÇÃO DO ROTEIRO', 'INÍCIO DA PRODUÇÃO', 'ENTREGA', 'DT Validação'];
    const historicalIntervals = {};

    rawData.forEach(d => {
        for (let i = 1; i < stepKeys.length; i++) {
            const d1 = parseDateBR(d[stepKeys[i - 1]]);
            const d2 = parseDateBR(d[stepKeys[i]]);
            if (d1 && d2 && d2 >= d1) {
                const diff = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
                if (!historicalIntervals[i]) historicalIntervals[i] = [];
                historicalIntervals[i].push(diff);
            }
        }
    });

    const avgIntervals = {};
    Object.keys(historicalIntervals).forEach(idx => {
        const vals = historicalIntervals[idx];
        avgIntervals[idx] = vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    const steps = [
        { id: 't-d-sol', key: 'SOLICITAÇÃO', step: 1 },
        { id: 't-d-kick', key: 'KICKOFF', step: 2 },
        { id: 't-d-rot', key: 'ENVIO DO ROTEIRO', step: 3 },
        { id: 't-d-val', key: 'VALIDAÇÃO DO ROTEIRO', step: 4 },
        { id: 't-d-prod', key: 'INÍCIO DA PRODUÇÃO', step: 5 },
        { id: 't-d-ent', key: 'ENTREGA', step: 6 },
        { id: 't-d-conc', key: 'DT Validação', step: 7 }
    ];

    let lastDate = null;

    steps.forEach((s, idx) => {
        const val = getD(s.key);
        document.getElementById(s.id).innerText = val;
        const stepEl = document.getElementById(`step-${s.step}`);
        const metaEl = document.getElementById(`m-step-${s.step}`);
        metaEl.innerHTML = '';

        const currentDate = parseDateBR(val);

        if (val !== '--/--/----' && val !== '' && currentDate) {
            stepEl.classList.add('active');

            if (lastDate) {
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const isBottleneck = avgIntervals[idx] && diffDays > (avgIntervals[idx] * 1.2);

                let workDays = 0;
                let tempDate = new Date(lastDate);
                while (tempDate < currentDate) {
                    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
                    const day = tempDate.getUTCDay();
                    if (day !== 0 && day !== 6) workDays++;
                }

                metaEl.innerHTML = `
                    <span class="flow-step-days ${isBottleneck ? 'bottleneck' : ''}" title="${isBottleneck ? 'Acima da média histórica!' : ''}">${diffDays}d corridos</span>
                    <span class="flow-step-days">${workDays}d úteis</span>
                `;
            }
            lastDate = currentDate;
        } else {
            stepEl.classList.remove('active');
        }
    });

    const renderMetaSelo = (id, dReal, dMeta) => {
        const el = document.getElementById(id);
        if (!dMeta) { el.innerHTML = ''; return; }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (!dReal) {
            const isExpired = today > dMeta;
            el.innerHTML = `<span class="flow-step-days" style="background:${isExpired ? 'var(--pink)' : 'var(--sidebar-blue)'}; color:white;">Meta: ${formatDateValue(dMeta)}</span>`;
        } else {
            const isLate = dReal > dMeta;
            el.innerHTML = `<span class="flow-step-days" style="background:${isLate ? 'var(--pink)' : 'var(--green)'}; color:white;">${isLate ? 'Atrasado' : 'No Prazo'} (Meta: ${formatDateValue(dMeta)})</span>`;
        }
    };

    renderMetaSelo('m-step-2', parseDateBR(getD('KICKOFF')), parseDateBR(item['PREVISAO_KICKOFF_CALC']));
    renderMetaSelo('m-step-3', parseDateBR(getD('ENVIO DO ROTEIRO')), parseDateBR(item['PREVISAO_ENVIO_ROTEIRO_CALC']));
    renderMetaSelo('m-step-4', parseDateBR(getD('VALIDAÇÃO DO ROTEIRO')), parseDateBR(item['PREVISAO_VALIDACAO_ROTEIRO_CALC']));
    renderMetaSelo('m-step-5', parseDateBR(getD('INÍCIO DA PRODUÇÃO')), parseDateBR(item['PREVISAO_INICIO_PROD_CALC']));
    renderMetaSelo('m-step-6', parseDateBR(getD('ENTREGA')), parseDateBR(item['PREVISÃO DE ENTREGA_CALC']));
    renderMetaSelo('m-step-7', parseDateBR(getD('DT Validação')), null);

    document.getElementById('t-previsto').innerText = item['META_CALC'] + ' dias';
    document.getElementById('t-realizado').innerText = item['DIAS_REALIZADOS_CALC'] + ' dias';
    document.getElementById('t-versoes').innerText = num(item['Nº DE VERSÕES']).toFixed(0);

    const dSol = parseDateBR(item['SOLICITAÇÃO']);
    const dProdStart = parseDateBR(item['INÍCIO DA PRODUÇÃO']);
    const dEnt = parseDateBR(item['DT Validação']) || parseDateBR(item['ENTREGA']);

    let leadTime = 0;
    let cycleTime = 0;

    if (dSol && dEnt) leadTime = Math.ceil(Math.abs(dEnt - dSol) / (1000 * 60 * 60 * 24));
    if (dProdStart && dEnt) cycleTime = Math.ceil(Math.abs(dEnt - dProdStart) / (1000 * 60 * 60 * 24));

    document.getElementById('t-lead-time').innerText = leadTime ? leadTime + ' dias' : '--';
    document.getElementById('t-cycle-time').innerText = cycleTime ? cycleTime + ' dias' : '--';

    document.getElementById('t-formato').innerText = item['FORMATO'] || '-';
    document.getElementById('t-carga').innerText = (item['CARGA'] || '-').toString().replace(/\s*[AP]M\b/gi, '').trim();

    document.getElementById('t-e-prev').innerText = getD('ENTREGA');
    document.getElementById('t-e-real').innerText = getD('DT Validação') || '--/--/----';
    document.getElementById('t-status-ent').innerText = item['STATUS DA ENTREGA'] || 'Pendente';

    document.getElementById('t-c-prazo').innerText = num(item['Prazo - Consultor']).toFixed(1);
    document.getElementById('t-c-ass').innerText = num(item['Assertividade - Consultor']).toFixed(1);
    document.getElementById('t-c-sto').innerText = num(item['Storytelling - Consultor']).toFixed(1);
    document.getElementById('t-c-des').innerText = num(item['Design - Consultor']).toFixed(1);
    document.getElementById('t-c-exp').innerText = num(item['Experiência Geral - Consultor']).toFixed(1);

    const csatAvg = [
        num(item['Prazo - Consultor']),
        num(item['Assertividade - Consultor']),
        num(item['Storytelling - Consultor']),
        num(item['Design - Consultor']),
        num(item['Experiência Geral - Consultor'])
    ].filter(v => v > 0);
    const csatFinal = csatAvg.length ? (csatAvg.reduce((a, b) => a + b, 0) / csatAvg.length) : 0;
    document.getElementById('t-c-total').innerText = csatFinal.toFixed(1);
}

export function updateDemandSelector(filteredData) {
    const selP1 = document.getElementById('p1-demanda-select');
    const currentP1 = selP1.value;
    let p1Html = '';
    filteredData.forEach(d => {
        p1Html += `<option value="${d['DEMANDA']}">${d['DEMANDA']}</option>`;
    });
    selP1.innerHTML = p1Html;
    if (filteredData.some(d => d['DEMANDA'] === currentP1)) selP1.value = currentP1;
}
