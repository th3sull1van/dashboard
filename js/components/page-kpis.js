import { MONTHS_ORDER } from '../constants.js';
import { count, avg, equals } from '../utils.js';
import { renderChartJS } from '../charts.js';
import { getFilteredData, getRawData } from '../store.js';

export function updatePage2(filteredData, rawData) {
    filteredData = filteredData || getFilteredData();
    rawData = rawData || getRawData();
    if (!filteredData || filteredData.length === 0) return;
    const tot = filteredData.length;
    const conc = count(filteredData, 'STATUS', 'Concluído');
    const dataConc = filteredData.filter(d => (d['STATUS'] || '').toLowerCase() === 'concluído');
    const apr1 = count(dataConc, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');

    const currentPerf = conc;
    const currentProd = avg(filteredData, 'SLA_CALC');
    const currentPrec = conc > 0 ? (apr1 / conc) * 100 : 0;
    const currentCsat = avg(filteredData, 'Experiência Geral - Consultor');

    document.getElementById('k2-perf').innerText = currentPerf;
    document.getElementById('k2-prod').innerText = currentProd.toFixed(2) + '%';
    document.getElementById('k2-prec').innerText = currentPrec.toFixed(2) + '%';
    document.getElementById('k2-csat').innerText = currentCsat.toFixed(2);

    document.getElementById('k2-perf').className = 'card-value ' + (currentPerf >= 40 ? 'card-green' : 'card-pink');
    document.getElementById('k2-prod').className = 'card-value ' + (currentProd >= 110 ? 'card-green' : 'card-pink');
    document.getElementById('k2-prec').className = 'card-value ' + (currentPrec >= 92 ? 'card-green' : 'card-pink');
    document.getElementById('k2-csat').className = 'card-value ' + (currentCsat >= 4.5 ? 'card-green' : '');

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
    document.getElementById('k2-ini').innerText = count(filteredData, 'STATUS', 'a iniciar');
    document.getElementById('k2-emp').innerText = count(filteredData, 'STATUS', 'em produção');
    document.getElementById('k2-con').innerText = count(filteredData, 'STATUS', 'concluído');
    document.getElementById('k2-apr').innerText = apr1;
    document.getElementById('k2-aju').innerText = count(filteredData, 'Classificação de Ajuste', 'Com Ajuste');
    document.getElementById('k2-pen').innerText = count(filteredData, 'STATUS', 'em pausa');
    document.getElementById('k2-can').innerText = count(filteredData, 'STATUS', 'cancelado');

    const dataByMonth = {};
    MONTHS_ORDER.forEach(m => dataByMonth[m] = []);
    filteredData.forEach(d => {
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
            const c = mItems.length;
            const a1 = count(mItems, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira');
            return c > 0 ? (a1 / c) * 100 : 0;
        });
    };

    setTimeout(() => renderChartJS('chart-perf', MONTHS_ORDER, getP2MonthlyData('STATUS', 'concluído', true), 'Performance'), 0);
    setTimeout(() => renderChartJS('chart-prod', MONTHS_ORDER, getP2MonthlyData('SLA_CALC', null, false), 'SLA %'), 50);
    setTimeout(() => renderChartJS('chart-prec', MONTHS_ORDER, getP2PrecData(), 'Precisão %'), 100);
    setTimeout(() => renderChartJS('chart-csat', MONTHS_ORDER, getP2MonthlyData('Experiência Geral - Consultor', null, false), 'CSAT'), 150);
}
