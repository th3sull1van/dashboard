import { initApp, setupEventListeners } from './app.js';
import { loadFromCache, syncGoogleSheets, processFile } from './cache.js';
import { getRawData } from './store.js';

window.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    
    const hasCache = await loadFromCache();
    console.log('Cache found:', hasCache, 'RawData length:', (await getRawData()).length);
    
    if (hasCache) {
        initApp(true);
        return;
    }
    
    console.log('Trying to sync from Google Sheets...');
    try {
        const syncResult = await syncGoogleSheets();
        console.log('Sync result:', syncResult, 'RawData length:', (await getRawData()).length);
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
