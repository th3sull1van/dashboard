import { MONTHS_ORDER } from './constants.js';
import { norm, num, count, avg, equals, getUnique, parseDateBR, formatDateValue } from './utils.js';
import { renderChartJS } from './charts.js';
import { rawData, getGlobalFilteredData } from './cache.js';

export let p2ActiveFormat = 'All';
export let p3ActiveResp = 'All';
export let p4ActiveStatus = 'All';
export let p4SortCol = 'DEMANDA';
export let p4SortAsc = true;

export function updateActivePage() {
    if (document.getElementById('content-1').style.display === 'block') updatePage4(); // Status & Frentes
    if (document.getElementById('content-2').style.display === 'block') updatePage1(); // Trilha
    if (document.getElementById('content-3').style.display === 'block') updatePage2(); // KPIs
    if (document.getElementById('content-4').style.display === 'block') updatePage3(); // Resumo
    if (document.getElementById('content-5').style.display === 'block') updatePage6(); // Insights
    if (document.getElementById('content-6').style.display === 'block') updatePage5(); // Qualidade
}

export function updatePage1() {
    if (getGlobalFilteredData().length === 0) return;
    const selVal = document.getElementById('p1-demanda-select').value;
    const item = getGlobalFilteredData().find(d => d['DEMANDA'] === selVal) || getGlobalFilteredData()[getGlobalFilteredData().length - 1];

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
                    tempDate.setDate(tempDate.getDate() + 1);
                    const day = tempDate.getDay();
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

    const formatDaysField = (val) => {
        if (!val || val === 'N/A') return '0 dias';
        const s = val.toString();
        let n = num(s);
        if (s.includes('%') || n >= 50) n = n / 100;
        return n.toFixed(0) + ' dias';
    };

    const dKickReal = parseDateBR(getD('KICKOFF'));
    const dKickMeta = parseDateBR(item['PREVISAO_KICKOFF_CALC']);
    const renderMetaSelo = (id, dReal, dMeta) => {
        const el = document.getElementById(id);
        if (!dMeta) { el.innerHTML = ''; return; }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!dReal) {
            const isExpired = today > dMeta;
            el.innerHTML = `<span class="flow-step-days" style="background:${isExpired ? 'var(--pink)' : 'var(--sidebar-blue)'}; color:white;">Meta: ${formatDateValue(dMeta)}</span>`;
        } else {
            const isLate = dReal > dMeta;
            el.innerHTML = `<span class="flow-step-days" style="background:${isLate ? 'var(--pink)' : 'var(--green)'}; color:white;">${isLate ? 'Atrasado' : 'No Prazo'} (Meta: ${formatDateValue(dMeta)})</span>`;
        }
    };

    renderMetaSelo('m-step-2', dKickReal, dKickMeta);
    renderMetaSelo('m-step-3', parseDateBR(getD('ENVIO DO ROTEIRO')), parseDateBR(item['PREVISAO_ENVIO_ROTEIRO_CALC']));
    renderMetaSelo('m-step-4', parseDateBR(getD('VALIDAÇÃO DO ROTEIRO')), parseDateBR(item['PREVISAO_VALIDACAO_ROTEIRO_CALC']));
    renderMetaSelo('m-step-5', parseDateBR(getD('INÍCIO DA PRODUÇÃO')), parseDateBR(item['PREVISAO_INICIO_PROD_CALC']));
    renderMetaSelo('m-step-6', parseDateBR(getD('ENTREGA')), parseDateBR(item['PREVISÃO DE ENTREGA_CALC']));
    renderMetaSelo('m-step-7', parseDateBR(getD('DT Validação')), null);

    document.getElementById('t-previsto').innerText = item['META_CALC'] + ' dias';
    document.getElementById('t-realizado').innerText = item['DIAS REALIZADOS_CALC'] + ' dias';
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

export function updatePage2() {
    const localData = getGlobalFilteredData();

    const tot = localData.length;
    const conc = count(localData, 'STATUS', 'Concluído');
    const dataConc = localData.filter(d => (d['STATUS'] || '').toLowerCase() === 'concluído');
    const apr1 = count(dataConc, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');

    const currentPerf = conc;
    const currentProd = avg(localData, 'SLA_CALC');
    const currentPrec = conc > 0 ? (apr1 / conc) * 100 : 0;
    const currentCsat = avg(localData, 'Experiência Geral - Consultor');

    document.getElementById('k2-perf').innerText = currentPerf;
    document.getElementById('k2-prod').innerText = currentProd.toFixed(2) + '%';
    document.getElementById('k2-prec').innerText = currentPrec.toFixed(2) + '%';
    document.getElementById('k2-csat').innerText = currentCsat.toFixed(2);

    const elPerf = document.getElementById('k2-perf');
    elPerf.className = 'card-value ' + (currentPerf >= 40 ? 'card-green' : 'card-pink');

    const elProd = document.getElementById('k2-prod');
    elProd.className = 'card-value ' + (currentProd >= 110 ? 'card-green' : 'card-pink');

    const elPrec = document.getElementById('k2-prec');
    elPrec.className = 'card-value ' + (currentPrec >= 92 ? 'card-green' : 'card-pink');

    const elCsat = document.getElementById('k2-csat');
    elCsat.className = 'card-value ' + (currentCsat >= 4.5 ? 'card-green' : '');

    const activeMonthGlobal = document.getElementById('f-mes').value;
    const activeAnoGlobal = document.getElementById('f-ano').value;

    const renderTrend = (id, current, prev, isHigherBetter = true) => {
        const el = document.getElementById(id);
        if (!prev || prev === 0) { el.innerHTML = '--'; el.className = 'card-trend trend-neutral'; return; }
        const diff = ((current - prev) / prev) * 100;
        const icon = diff > 0 ? 'fa-arrow-up' : (diff < 0 ? 'fa-arrow-down' : 'fa-minus');
        let trendClass = 'trend-neutral';
        if (diff > 0) trendClass = isHigherBetter ? 'trend-up' : 'trend-down';
        if (diff < 0) trendClass = isHigherBetter ? 'trend-down' : 'trend-up';

        el.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(diff).toFixed(1)}% vs mês anterior`;
        el.className = 'card-trend ' + trendClass;
    };

    if (activeMonthGlobal !== 'All') {
        const monthIdx = MONTHS_ORDER.indexOf(activeMonthGlobal.toUpperCase());
        if (monthIdx > 0) {
            const prevMonth = MONTHS_ORDER[monthIdx - 1];
            const prevData = rawData.filter(d =>
                equals(d['MÊS'], prevMonth) &&
                (activeAnoGlobal === 'All' || equals(d['ANO'], activeAnoGlobal))
            );

            const pConc = count(prevData, 'STATUS', 'Concluído');
            const pDataConc = prevData.filter(d => (d['STATUS'] || '').toLowerCase() === 'concluído');
            const pApr1 = count(pDataConc, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');

            renderTrend('t2-perf', currentPerf, pConc);
            renderTrend('t2-prod', currentProd, avg(prevData, 'SLA_CALC'));
            renderTrend('t2-prec', currentPrec, pConc > 0 ? (pApr1 / pConc * 100) : 0);
            renderTrend('t2-csat', currentCsat, avg(prevData, 'Experiência Geral - Consultor'));
        } else {
            ['t2-perf', 't2-prod', 't2-prec', 't2-csat'].forEach(id => {
                document.getElementById(id).innerHTML = 'Janeiro (Início)';
                document.getElementById(id).className = 'card-trend trend-neutral';
            });
        }
    } else {
        ['t2-perf', 't2-prod', 't2-prec', 't2-csat'].forEach(id => {
            document.getElementById(id).innerHTML = 'Selecione um mês';
            document.getElementById(id).className = 'card-trend trend-neutral';
        });
    }

    document.getElementById('k2-sol').innerText = tot;
    document.getElementById('k2-ini').innerText = count(localData, 'STATUS', 'a iniciar');
    document.getElementById('k2-emp').innerText = count(localData, 'STATUS', 'em produção');
    document.getElementById('k2-con').innerText = count(localData, 'STATUS', 'concluído');
    document.getElementById('k2-apr').innerText = apr1;
    document.getElementById('k2-aju').innerText = count(localData, 'Classificação de Ajuste', 'Com Ajuste');
    document.getElementById('k2-pen').innerText = count(localData, 'STATUS', 'em pausa');
    document.getElementById('k2-can').innerText = count(localData, 'STATUS', 'cancelado');

    const p2Labels = MONTHS_ORDER;

    const dataByMonth = {};
    MONTHS_ORDER.forEach(m => dataByMonth[m] = []);
    localData.forEach(d => {
        const m = (d['MÊS'] || '').toUpperCase();
        if (dataByMonth[m]) dataByMonth[m].push(d);
    });

    const getP2MonthlyData = (key, filter, isCount) => {
        return MONTHS_ORDER.map(m => {
            const mItems = dataByMonth[m];
            return isCount ? count(mItems, key, filter) : avg(mItems, key);
        });
    };

    const dataConcP2ByMonth = {};
    MONTHS_ORDER.forEach(m => dataConcP2ByMonth[m] = dataByMonth[m].filter(d => (d['STATUS'] || '').toLowerCase() === 'concluído'));

    const getP2PrecData = () => {
        return MONTHS_ORDER.map(m => {
            const mItems = dataConcP2ByMonth[m];
            const conc = mItems.length;
            const apr1 = count(mItems, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');
            return conc > 0 ? (apr1 / conc) * 100 : 0;
        });
    };

    setTimeout(() => renderChartJS('chart-perf', p2Labels, getP2MonthlyData('STATUS', 'concluído', true), 'Performance'), 0);
    setTimeout(() => renderChartJS('chart-prod', p2Labels, getP2MonthlyData('SLA_CALC', null, false), 'SLA %'), 50);
    setTimeout(() => renderChartJS('chart-prec', p2Labels, getP2PrecData(), 'Precisão %'), 100);
    setTimeout(() => renderChartJS('chart-csat', p2Labels, getP2MonthlyData('Experiência Geral - Consultor', null, false), 'CSAT'), 150);
}

export function updatePage3() {
    const localData = getGlobalFilteredData();

    const tot = localData.length;
    const conc = count(localData, 'STATUS', 'concluído');
    const exc = count(localData, 'STATUS DA META', 'Fora do prazo');
    const apr = count(localData, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');
    const aju = count(localData, 'Classificação de Ajuste', 'Com Ajuste');

    document.getElementById('k3-sol').innerText = tot;
    document.getElementById('k3-con').innerText = conc;

    document.getElementById('k3-exc').innerText = exc;
    document.getElementById('k3-exc-p').innerText = tot ? ((exc / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-apr').innerText = apr;
    document.getElementById('k3-apr-p').innerText = tot ? ((apr / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-aju').innerText = aju;
    document.getElementById('k3-aju-p').innerText = tot ? ((aju / tot) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('k3-n0').innerText = ((avg(localData, 'Prazo - Consultor') + avg(localData, 'Assertividade - Consultor') + avg(localData, 'Design - Consultor')) / 3).toFixed(2);
    document.getElementById('k3-n1').innerText = avg(localData, 'Prazo - Consultor').toFixed(2);
    document.getElementById('k3-n2').innerText = avg(localData, 'Assertividade - Consultor').toFixed(2);
    document.getElementById('k3-n3').innerText = avg(localData, 'Storytelling - Consultor').toFixed(2);
    document.getElementById('k3-n4').innerText = avg(localData, 'Experiência Geral - Consultor').toFixed(2);

    const fGrps = {};
    const fDisplay = {};
    localData.forEach(d => {
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
    localData.slice(-15).forEach(d => {
        lst.innerHTML += `<div class="p3-list-item">${d['DEMANDA']}</div>`;
    });
}

export function updatePage4() {
    const activeMonthGlobal = document.getElementById('f-mes').value;
    const localData = getGlobalFilteredData();

    document.getElementById('k4-ain').innerText = count(localData, 'STATUS', 'a iniciar');
    document.getElementById('k4-kic').innerText = count(localData, 'STATUS', 'kickoff');
    document.getElementById('k4-pro').innerText = count(localData, 'STATUS', 'produção de roteiro');
    document.getElementById('k4-val').innerText = count(localData, 'STATUS', 'em validação');
    document.getElementById('k4-emp').innerText = count(localData, 'STATUS', 'em produção');
    document.getElementById('k4-con').innerText = count(localData, 'STATUS', 'concluído');
    document.getElementById('k4-pau').innerText = count(localData, 'STATUS', 'em pausa');
    document.getElementById('k4-can').innerText = count(localData, 'STATUS', 'cancelado');

    let p4MonthData = {};

    if (activeMonthGlobal === 'All') {
        MONTHS_ORDER.forEach(m => p4MonthData[m] = 0);
        localData.forEach(d => {
            let m = (d['MÊS'] || '').toUpperCase();
            if (p4MonthData[m] !== undefined) p4MonthData[m]++;
        });
    } else {
        const stData = {};
        getUnique(rawData, 'STATUS').forEach(st => stData[st.toLowerCase()] = 0);
        localData.forEach(d => {
            let st = (d['STATUS'] || '').toLowerCase();
            if (stData[st] !== undefined) stData[st]++;
        });
        p4MonthData = stData;
    }

    const formatData = {};
    const formatDisplay = {};
    localData.forEach(d => {
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

    renderP4Table(localData);
}

export function updatePage5() {
    const data = getGlobalFilteredData();
    const grouped = {};

    const catInfo = {
        'Crítico': { icon: 'fa-exclamation-triangle', color: 'var(--pink)' },
        'Inconsistência': { icon: 'fa-sync-alt', color: '#f59e0b' },
        'Dados Ausentes': { icon: 'fa-database', color: '#64748b' },
        'Sugestão de Melhoria': { icon: 'fa-lightbulb', color: 'var(--green)' }
    };

    let emptyCount = 0;
    let dateCount = 0;
    let totalAlertsCount = 0;

    const addAlert = (id, msg, category, fix) => {
        if (!grouped[msg]) {
            grouped[msg] = {
                category,
                fix,
                demands: [],
                icon: catInfo[category].icon,
                color: catInfo[category].color
            };
        }
        grouped[msg].demands.push(id);
        totalAlertsCount++;
    };

    data.forEach(d => {
        const id = d['DEMANDA'] || 'ID Desconhecido';
        const status = (d['STATUS'] || '').toLowerCase();

        if (!d['DEMANDA']) addAlert(id, 'Demanda sem Identificação/ID.', 'Crítico', 'Preencha a coluna DEMANDA.');
        if (!d['STATUS']) addAlert(id, 'Campo STATUS vazio.', 'Crítico', 'Defina o status atual.');
        if (!d['SOLICITAÇÃO']) addAlert(id, 'Data de SOLICITAÇÃO ausente.', 'Crítico', 'Insira a data de abertura.');

        const dSol = parseDateBR(d['SOLICITAÇÃO']);
        const dKick = parseDateBR(d['KICKOFF']);
        const dRot = parseDateBR(d['ENVIO DO ROTEIRO']);
        const dVal = parseDateBR(d['VALIDAÇÃO DO ROTEIRO']);
        const dProd = parseDateBR(d['INÍCIO DA PRODUÇÃO']);
        const dEnt = parseDateBR(d['ENTREGA']);

        if (dSol && dEnt && dEnt < dSol) {
            addAlert(id, 'Entrega anterior à Solicitação.', 'Inconsistência', 'Corrija as datas no Excel.');
            dateCount++;
        }
        if (dSol && dKick && dKick < dSol) {
            addAlert(id, 'Kickoff anterior à Solicitação.', 'Inconsistência', 'Ajuste a data de Kickoff.');
            dateCount++;
        }
        if (dKick && dRot && dRot < dKick) {
            addAlert(id, 'Envio de Roteiro anterior ao Kickoff.', 'Inconsistência', 'Verifique a ordem das datas.');
            dateCount++;
        }
        if (dRot && dVal && dVal < dRot) {
            addAlert(id, 'Validação anterior ao Envio de Roteiro.', 'Inconsistência', 'Verifique a ordem das datas.');
            dateCount++;
        }
        if (dVal && dProd && dProd < dVal) {
            addAlert(id, 'Produção iniciada antes da Validação.', 'Inconsistência', 'Verifique a ordem das datas.');
            dateCount++;
        }
        if (dProd && dEnt && dEnt < dProd) {
            addAlert(id, 'Entrega anterior ao Início da Produção.', 'Inconsistência', 'Verifique a ordem das datas.');
            dateCount++;
        }
        if (d['Status de Aprovação'] === 'Aprovado de Primeira' && num(d['Nº DE VERSÕES']) > 1) {
            addAlert(id, 'Aprovado de 1ª porém com > 1 versão.', 'Inconsistência', 'Ajuste versões para 1.');
        }
        if (num(d['SLA']) > 150) {
            addAlert(id, 'SLA detectado com valor suspeito (>150%).', 'Inconsistência', 'Verifique cálculo do SLA.');
        }

        if (status === 'concluido' || status === 'concluído') {
            if (!d['ENTREGA']) addAlert(id, 'Concluído mas sem data de ENTREGA.', 'Dados Ausentes', 'Insira a data real de término.');
            if (num(d['Experiência Geral - Consultor']) === 0) addAlert(id, 'Concluído sem nota de CSAT.', 'Dados Ausentes', 'Coletar feedback consultor.');
        }

        const mandatory = ['SOLICITANTE', 'RESPONSÁVEL', 'FORMATO'];
        mandatory.forEach(f => {
            if (!d[f]) {
                addAlert(id, `Campo [${f}] não preenchido.`, 'Dados Ausentes', 'Preenchimento recomendado.');
                emptyCount++;
            }
        });

        if (num(d['SLA']) > 100 && status === 'concluído') {
            addAlert(id, 'SLA acima de 100%. Bônus ou erro?', 'Sugestão de Melhoria', 'Confirmar métrica.');
        }
    });

    const score = data.length > 0 ? Math.max(0, 100 - (totalAlertsCount / (data.length * 5) * 100)).toFixed(1) : 100;

    document.getElementById('k5-score').innerText = score + '%';
    document.getElementById('k5-score').style.color = score > 95 ? 'var(--green)' : (score > 85 ? '#f59e0b' : 'var(--pink)');
    document.getElementById('k5-alerts').innerText = totalAlertsCount;
    document.getElementById('k5-empty').innerText = emptyCount;
    document.getElementById('k5-dates').innerText = dateCount;

    const listEl = document.getElementById('p5-alerts-list');
    let html = '';

    Object.entries(grouped).forEach(([msg, info], idx) => {
        const groupId = `p5-group-${idx}`;
        html += `
            <div style="background:var(--white); border-radius: 8px; margin: 15px 0 5px 0; box-shadow: var(--shadow-sm); overflow: hidden;">
                <div onclick="toggleP5Group('${groupId}', this)" style="padding: 12px 20px; border-left: 4px solid ${info.color}; cursor: pointer; display: flex; flex-direction: column; gap: 5px; transition: var(--transition-smooth); background: rgba(255,255,255,0.5);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; font-weight: 800; color: ${info.color}; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas ${info.icon}"></i> ${info.category}
                        </span>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="font-size: 10px; font-weight: 700; color: var(--green); font-style: italic;">Ação: ${info.fix}</span>
                            <i class="fas fa-chevron-right toggle-icon" style="color: var(--text-gray); font-size: 12px;"></i>
                        </div>
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: var(--text-dark);">
                        ${msg} <span style="color:var(--text-gray); font-weight: 600; font-size: 12px;">(${info.demands.length} demandas)</span>
                    </div>
                </div>
                <div id="${groupId}" style="display: none; flex-wrap: wrap; gap: 6px; padding: 15px 20px; background: var(--bg-gray); border-top: 1px solid var(--border-color);">
                    ${info.demands.map(id => `<span style="background:var(--white); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">${id}</span>`).join('')}
                </div>
            </div>`;
    });

    if (totalAlertsCount === 0) html = '<div style="padding:40px; text-align:center; color:var(--green); font-weight:bold;">Excelência de Dados! Nenhuma inconsistência encontrada. 🎉</div>';
    listEl.innerHTML = html;
}

export function updatePage6() {
    const data = getGlobalFilteredData();
    if (data.length === 0) return;

    const groupData = (key) => {
        const counts = {};
        const displays = {};
        data.forEach(d => {
            const raw = d[key] || 'N/A';
            const n = norm(raw);
            if (!displays[n]) displays[n] = raw;
            counts[n] = (counts[n] || 0) + 1;
        });
        const final = {};
        Object.keys(counts).forEach(n => final[displays[n]] = counts[n]);
        return final;
    };

    renderRank('rank-solicitantes', groupData('SOLICITANTE'));
    renderRank('rank-formatos', groupData('FORMATO'));

    const fmtTotals = {};
    const fmtRatings = {};
    const fmtDisplay = {};
    data.forEach(d => {
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
    data.forEach(d => {
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

export function renderRank(id, counts, isPercent = false, customMax = null) {
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
}

export function toggleP5Group(groupId, headerEl) {
    const content = document.getElementById(groupId);
    const icon = headerEl.querySelector('.toggle-icon');
    if (content.style.display === 'none') {
        content.style.display = 'flex';
        icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
    } else {
        content.style.display = 'none';
        icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
    }
}

export function sortP4Table(col) {
    if (p4SortCol === col) {
        p4SortAsc = !p4SortAsc;
    } else {
        p4SortCol = col;
        p4SortAsc = true;
    }
    updatePage4();
}

export function renderP4Table(dataArr) {
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
