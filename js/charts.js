const chartInstances = {};

export function renderChartJS(canvasId, labels, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(244, 63, 94, 0.7)',
                borderColor: 'rgba(244, 63, 94, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => {
                        if (typeof value !== 'number') return value;
                        return value % 1 === 0 ? value : value.toFixed(2);
                    },
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    color: '#0f172a'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { display: false }
                },
                x: { grid: { display: false } }
            },
            layout: {
                padding: {
                    top: 20
                }
            }
        }
    });
}

export function destroyAllCharts() {
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            delete chartInstances[key];
        }
    });
}
