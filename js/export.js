import { count, avg } from './utils.js';

export function exportToPDF() {
    if (globalFilteredData.length === 0) { alert('Nenhum dado filtrado para exportar.'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    const navy = [11, 17, 32];
    const pink = [244, 63, 94];
    const green = [34, 197, 94];
    const darkText = [30, 41, 59];
    const lightGray = [241, 245, 249];

    doc.setFillColor(...navy);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Relatório Dashboard Operacional', margin, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    doc.text('Fábrica de Conteúdos \u2022 iFood', margin, 18);
    doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), pageW - margin, 18, { align: 'right' });

    y = 34;

    const filters = [];
    const fAno = document.getElementById('f-ano').value;
    const fMes = document.getElementById('f-mes').value;
    const fSol = document.getElementById('f-solicitante').value;
    const fRes = document.getElementById('f-responsavel').value;
    const fStat = document.getElementById('f-status').value;
    const fFrente = document.getElementById('f-frente').value;
    if (fAno !== 'All') filters.push('Ano: ' + fAno);
    if (fMes !== 'All') filters.push('Mês: ' + fMes);
    if (fSol !== 'All') filters.push('Solicitante: ' + fSol);
    if (fRes !== 'All') filters.push('Responsável: ' + fRes);
    if (fStat !== 'All') filters.push('Status: ' + fStat);
    if (fFrente !== 'All') filters.push('Frente: ' + fFrente);

    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    if (filters.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Filtros Ativos:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(filters.join('  |  '), margin + 22, y);
    } else {
        doc.text('Sem filtros aplicados (mostrando todos os dados).', margin, y);
    }
    y += 6;

    doc.setDrawColor(...navy);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    const data = globalFilteredData;
    const totalDemandas = data.length;
    const concluidas = count(data, 'STATUS', 'concluído');
    const emProducao = count(data, 'STATUS', 'em produção');
    const canceladas = count(data, 'STATUS', 'cancelado');
    const emPausa = count(data, 'STATUS', 'em pausa');
    const sla = avg(data, 'SLA_CALC');
    const csat = avg(data, 'Experiência Geral - Consultor');
    const dataConcluida = data.filter(d => (d['STATUS'] || '').toLowerCase() === 'concluído');
    const apr1 = dataConcluida.length > 0 ? (count(dataConcluida, 'STATUS_APROVACAO_CALC', 'Aprovado de Primeira') / dataConcluida.length * 100) : 0;

    const kpis = [
        { label: 'Total Demandas', value: totalDemandas, color: navy },
        { label: 'Concluídas', value: concluidas, color: green },
        { label: 'Em Produção', value: emProducao, color: [59, 130, 246] },
        { label: 'Em Pausa', value: emPausa, color: [234, 179, 8] },
        { label: 'Canceladas', value: canceladas, color: [239, 68, 68] },
        { label: 'SLA Médio', value: sla.toFixed(1) + '%', color: navy },
        { label: 'Precisão', value: apr1.toFixed(1) + '%', color: navy },
        { label: 'CSAT', value: csat.toFixed(2), color: navy }
    ];

    const kpiW = (pageW - margin * 2) / kpis.length;
    kpis.forEach((kpi, i) => {
        const x = margin + i * kpiW;
        doc.setFillColor(...lightGray);
        doc.roundedRect(x + 1, y, kpiW - 2, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...kpi.color);
        doc.text(String(kpi.value), x + kpiW / 2, y + 6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + kpiW / 2, y + 11.5, { align: 'center' });
    });
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkText);
    doc.text('Detalhamento das Demandas (' + totalDemandas + ' registros)', margin, y);
    y += 3;

    const columns = ['DEMANDA', 'SOLICITANTE', 'RESPONSÁVEL', 'STATUS', 'FORMATO', 'SOLICITAÇÃO', 'ENTREGA', 'SLA_CALC'];
    const tableHead = columns.map(c => ({ header: c === 'SLA_CALC' ? 'SLA' : c, dataKey: c }));
    const tableBody = data.map(d => {
        const row = {};
        columns.forEach(c => {
            let val = d[c] || '--';
            if (c === 'SLA_CALC' && typeof val === 'number') val = val.toFixed(1) + '%';
            row[c] = val;
        });
        return row;
    });

    doc.autoTable({
        startY: y,
        columns: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 6.5,
            cellPadding: 1.5,
            overflow: 'linebreak',
            lineColor: [226, 232, 240],
            lineWidth: 0.2
        },
        headStyles: {
            fillColor: navy,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            'DEMANDA': { cellWidth: 55 },
            'SLA_CALC': { cellWidth: 15, halign: 'center' }
        },
        didDrawPage: function (pageData) {
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('Dashboard Operacional \u2022 Fábrica de Conteúdos', margin, pageH - 6);
            doc.text('Página ' + doc.internal.getCurrentPageInfo().pageNumber, pageW - margin, pageH - 6, { align: 'right' });
        }
    });

    doc.save(`Relatorio_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportToExcel() {
    if (globalFilteredData.length === 0) { alert('Nenhum dado filtrado para exportar.'); return; }

    try {
        const ws = XLSX.utils.json_to_sheet(globalFilteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dados Filtrados");

        const fileName = `Export_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (err) {
        console.error(err);
        alert('Erro ao exportar Excel. Verifique se os dados estão no formato correto.');
    }
}
