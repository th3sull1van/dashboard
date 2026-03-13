import { num, parseDateBR } from '../utils.js';
import { getFilteredData } from '../store.js';

export function updatePage5(filteredData) {
    filteredData = filteredData || getFilteredData();
    if (!filteredData || filteredData.length === 0) return;
    const data = filteredData;
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
