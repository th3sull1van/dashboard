import { METAS_COMPLEXIDADE, TAXA_IA_MAP } from './constants.js';
import { norm, num, parseDateBR, formatDateValue, addBusinessDays, countBusinessDays } from './utils.js';

export const enrichData = (row) => {
    const fmt = norm(row['FORMATO']);
    const metaInfo = METAS_COMPLEXIDADE[fmt] || { complexidade: 'N/A', meta: 0 };

    const dSol = parseDateBR(row['SOLICITAÇÃO']);
    const dKick = parseDateBR(row['KICKOFF']);
    const dProd = parseDateBR(row['INÍCIO DA PRODUÇÃO']);
    const dEnt = parseDateBR(row['ENTREGA']);
    const today = new Date();

    row['META_CALC'] = metaInfo.meta;
    row['COMPLEXIDADE_CALC'] = metaInfo.complexidade;

    const refKick = dKick || (dSol ? addBusinessDays(dSol, 1) : null);

    if (dSol) {
        const dKickPrev = addBusinessDays(dSol, 1);
        row['PREVISAO_KICKOFF_CALC'] = formatDateValue(dKickPrev);
    }

    if (refKick) {
        const dEnvioPrev = addBusinessDays(refKick, 1);
        const dValPrev = addBusinessDays(refKick, 2);
        const dProdStartPrev = addBusinessDays(refKick, 3);

        row['PREVISAO_ENVIO_ROTEIRO_CALC'] = formatDateValue(dEnvioPrev);
        row['PREVISAO_VALIDACAO_ROTEIRO_CALC'] = formatDateValue(dValPrev);
        row['PREVISAO_INICIO_PROD_CALC'] = formatDateValue(dProdStartPrev);
    }

    if (dProd && metaInfo.meta > 0) {
        const dPrev = addBusinessDays(dProd, metaInfo.meta - 1);
        row['PREVISÃO DE ENTREGA_CALC'] = formatDateValue(dPrev);

        if (dEnt) {
            row['STATUS_ENTREGA_CALC'] = dEnt <= dPrev ? "No Prazo" : "Fora do Prazo";
        } else {
            row['STATUS_ENTREGA_CALC'] = today <= dPrev ? "No Prazo" : "Atrasado";
        }
    } else {
        row['PREVISÃO DE ENTREGA_CALC'] = row['PREVISÃO DE ENTREGA'] || '--';
        row['STATUS_ENTREGA_CALC'] = row['STATUS DA ENTREGA'] || 'Pendente';
    }

    if (dProd && dEnt) {
        row['DIAS REALIZADOS_CALC'] = countBusinessDays(dProd, dEnt);
    } else {
        row['DIAS REALIZADOS_CALC'] = num(row['DIAS REALIZADOS']);
    }

    if (row['DIAS REALIZADOS_CALC'] > 0) {
        row['SLA_CALC'] = (row['META_CALC'] / row['DIAS REALIZADOS_CALC']) * 100;
        const diff = row['META_CALC'] - row['DIAS REALIZADOS_CALC'];
        row['STATUS_META_CALC'] = diff >= 0 ? (diff > 0 ? "Antes do Prazo" : "Dentro do Prazo") : "Fora do Prazo";
    } else {
        row['SLA_CALC'] = num(row['SLA']) || 0;
        row['STATUS_META_CALC'] = row['STATUS DA META'] || 'Sem Status';
    }

    const versoes = num(row['Nº DE VERSÕES']);
    row['STATUS_APROVACAO_CALC'] = (versoes <= 1 && versoes > 0) ? "Aprovado de Primeira" : (versoes > 1 ? "Ajustado" : "N/A");

    if (dSol) {
        const dRotPrev = addBusinessDays(dSol, 2);
        row['PREVISAO_ROTEIRO_CALC'] = formatDateValue(dRotPrev);
    }

    if (dSol) {
        const fim = dEnt || today;
        row['DIAS_ABERTO_CALC'] = Math.ceil(Math.abs(fim - dSol) / (1000 * 60 * 60 * 24));
    }

    row['TAXA_IA_CALC'] = TAXA_IA_MAP[fmt] || 0;

    return row;
};
