import { updatePage1 } from './components/page-trilha.js';
import { updatePage2 } from './components/page-kpis.js';
import { updatePage3 } from './components/page-resumo.js';
import { updatePage4, sortP4Table } from './components/page-status.js';
import { updatePage5, toggleP5Group } from './components/page-qualidade.js';
import { updatePage6 } from './components/page-insights.js';
import { showCover, hideCover } from './components/page-cover.js';
import { getRawData, getFilteredData } from './store.js';

export function goToPage(pageIndex) {
    if (getRawData().length === 0) { alert("Carregue o CSV primeiro na tela inicial."); return; }

    document.getElementById('page-0').classList.remove('active');
    document.getElementById('app-pages').classList.add('active');

    for (let i = 1; i <= 6; i++) {
        const content = document.getElementById('content-' + i);
        if (content) content.style.display = 'none';
    }

    const targetContent = document.getElementById('content-' + pageIndex);
    if (targetContent) targetContent.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById('nav-' + pageIndex);
    if (navItem) navItem.classList.add('active');

    requestAnimationFrame(() => {
        updateActivePage();
    });
}

export function goToCover() {
    document.getElementById('page-0').classList.add('active');
    document.getElementById('app-pages').classList.remove('active');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-0').classList.add('active');
}

export function updateActivePage() {
    const filteredData = getFilteredData();
    const rawData = getRawData();
    const c1 = document.getElementById('content-1');
    const c2 = document.getElementById('content-2');
    const c3 = document.getElementById('content-3');
    const c4 = document.getElementById('content-4');
    const c5 = document.getElementById('content-5');
    const c6 = document.getElementById('content-6');
    if (c1 && c1.style.display === 'block') updatePage4(filteredData, rawData);
    if (c2 && c2.style.display === 'block') updatePage1(filteredData, rawData);
    if (c3 && c3.style.display === 'block') updatePage2(filteredData, rawData);
    if (c4 && c4.style.display === 'block') updatePage3(filteredData);
    if (c5 && c5.style.display === 'block') updatePage5(filteredData);
    if (c6 && c6.style.display === 'block') updatePage6(filteredData);
}