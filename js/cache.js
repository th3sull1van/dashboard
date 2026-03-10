import { CACHE_KEY, CACHE_DATE_KEY, SHEET_CSV_URL } from './constants.js';
import { enrichData } from './data.js';
import { formatDateValue } from './utils.js';

export let rawData = [];
let globalFilteredData = [];

export function getGlobalFilteredData() {
    return globalFilteredData;
}

export function setGlobalFilteredData(data) {
    globalFilteredData = data;
}

export function saveCache() {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rawData));
        const now = new Date().toLocaleString('pt-BR');
        localStorage.setItem(CACHE_DATE_KEY, now);
    } catch (e) {
        console.warn("Cache local falhou (provavelmente dados muito grandes)");
    }
}

export function loadFromCache() {
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheDate = localStorage.getItem(CACHE_DATE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                rawData = parsed.map(d => enrichData(d));
                document.getElementById('update-date').innerText = cacheDate || 'Cache';
                document.body.classList.add('data-loaded');
                document.getElementById('cached-info').style.display = 'block';
                return true;
            }
        } catch (e) {
            localStorage.removeItem(CACHE_KEY);
        }
    }
    return false;
}

export function clearCache() {
    if (confirm('Deseja realmente limpar os dados salvos localmente?')) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_DATE_KEY);
        location.reload();
    }
}

export async function syncGoogleSheets() {
    const statusEl = document.getElementById('upload-status');
    statusEl.innerText = "Sincronizando com a nuvem...";
    statusEl.style.color = "var(--green)";

    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error('Falha ao baixar dados da planilha.');
        const csvContent = await response.text();

        const workbook = XLSX.read(csvContent, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '', cellDates: true });

        rawData = jsonData.map(row => {
            const clean = {};
            Object.keys(row).forEach(k => {
                const val = formatDateValue(row[k]);
                clean[k.trim()] = (val === '' || val === null || val === undefined) ? 'N/A' : val;
            });
            return enrichData(clean);
        }).filter(row => row['DEMANDA'] && row['DEMANDA'] !== 'N/A' && row['DEMANDA'] !== '');

        if (rawData.length === 0) {
            statusEl.innerText = "Planilha vazia ou sem a coluna 'DEMANDA'.";
            statusEl.style.color = "red";
            return;
        }
        statusEl.innerText = `Sincronizado! ${rawData.length} demandas online.`;
        document.getElementById('update-date').innerText = new Date().toLocaleString('pt-BR');
        document.body.classList.add('data-loaded');
        return true;
    } catch (err) {
        console.error(err);
        statusEl.innerText = "Erro ao sincronizar. Verifique a internet e as permissões da planilha.";
        statusEl.style.color = "red";
        return false;
    }
}

export function processFile(file) {
    if (!file) return Promise.reject('No file provided');

    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isXlsx) {
        return Promise.reject("Por favor, envie um arquivo Excel (.xlsx ou .xls)");
    }

    document.getElementById('upload-status').innerText = "Processando arquivo...";

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '', cellDates: true });

                rawData = jsonData.map(row => {
                    const clean = {};
                    Object.keys(row).forEach(k => {
                        const val = formatDateValue(row[k]);
                        clean[k.trim()] = (val === '' || val === null || val === undefined) ? 'N/A' : val;
                    });
                    return enrichData(clean);
                }).filter(row => row['DEMANDA'] && row['DEMANDA'] !== 'N/A' && row['DEMANDA'] !== '');

                if (rawData.length === 0) {
                    reject("O arquivo parece vazio ou não tem a coluna 'DEMANDA'.");
                    return;
                }

                document.getElementById('upload-status').innerText = `Sucesso! ${rawData.length} demandas carregadas.`;
                document.getElementById('update-date').innerText = new Date().toLocaleString('pt-BR');
                document.body.classList.add('data-loaded');
                resolve(rawData);
            } catch (err) {
                console.error(err);
                reject("Erro ao ler arquivo. Verifique se é um XLSX válido.");
            }
        };
        reader.onerror = () => reject("Erro ao ler arquivo.");
        reader.readAsArrayBuffer(file);
    });
}
