import { initApp, setupEventListeners, goToPage, goToCover, debouncedApplyFilters, applyFilters } from './app.js';
import { rawData, loadFromCache, syncGoogleSheets, clearCache, processFile, saveCache } from './cache.js';
import { exportToPDF, exportToExcel } from './export.js';
import * as pages from './pages.js';

window.goToPage = goToPage;
window.goToCover = goToCover;
window.debouncedApplyFilters = debouncedApplyFilters;
window.applyFilters = applyFilters;
window.syncGoogleSheets = syncGoogleSheets;
window.clearCache = clearCache;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.toggleP5Group = pages.toggleP5Group;
window.sortP4Table = pages.sortP4Table;
window.toggleP3Row = pages.toggleP3Row;
window.filterP3List = pages.filterP3List;
window.updatePage1 = pages.updatePage1;

window.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    
    const hasCache = loadFromCache();
    console.log('Cache found:', hasCache, 'RawData length:', rawData.length);
    
    if (hasCache) {
        initApp(true);
        return;
    }
    
    console.log('Trying to sync from Google Sheets...');
    try {
        const syncResult = await syncGoogleSheets();
        console.log('Sync result:', syncResult, 'RawData length:', rawData.length);
        if (syncResult) {
            initApp();
            return;
        }
    } catch (err) {
        console.error('Sync error:', err);
    }
    
    // Show upload area if no cache and no sync
    document.getElementById('upload-area').style.display = 'flex';
    document.getElementById('upload-status').innerText = 'Carregue um arquivo ou sincronize com a nuvem.';
    document.getElementById('upload-status').style.color = 'var(--text-dark)';
});

window.handleFileUpload = async function(file) {
    if (!file) return;
    try {
        await processFile(file);
        initApp();
    } catch (err) {
        document.getElementById('upload-status').innerText = err;
        document.getElementById('upload-status').style.color = "red";
    }
};
