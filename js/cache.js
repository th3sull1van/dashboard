import { CACHE_KEY, CACHE_DATE_KEY, SHEET_CSV_URL } from './constants.js';
import { enrichData } from './data.js';
import { formatDateValue } from './utils.js';
import { getRawData, setRawData, getFilteredData, setFilteredData } from './store.js';

export function saveCache() {
    try {
        const data = getRawData();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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
                setRawData(parsed.map(d => enrichData(d)));
                setFilteredData([]);
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
        setRawData([]);
        setFilteredData([]);
        location.reload();
    }
}

function convertUSDateToBR(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        const [, month, day, year] = match;
        if (parseInt(month) > 12) {
            return dateStr;
        }
        if (parseInt(day) > 12) {
            return `${day}/${month}/${year}`;
        }
        return `${day}/${month}/${year}`;
    }
    return dateStr;
}

function processRowData(jsonData) {
    return jsonData.map(row => {
        const clean = {};
        Object.keys(row).forEach(k => {
            const val = row[k];
            if (typeof val === 'number' && val > 30000 && val < 60000) {
                clean[k.trim()] = formatDateValue(val);
            } else if (typeof val === 'string') {
                const converted = convertUSDateToBR(val.trim());
                clean[k.trim()] = converted === '' ? 'N/A' : converted;
            } else {
                const strVal = (val === '' || val === null || val === undefined) ? '' : String(val).trim();
                clean[k.trim()] = strVal === '' ? 'N/A' : strVal;
            }
        });
        return enrichData(clean);
    }).filter(row => row['DEMANDA'] && row['DEMANDA'] !== 'N/A' && row['DEMANDA'] !== '');
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
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '', cellDates: false, raw: true });

        const processed = processRowData(jsonData);

        if (processed.length === 0) {
            statusEl.innerText = "Planilha vazia ou sem a coluna 'DEMANDA'.";
            statusEl.style.color = "red";
            return;
        }

        setRawData(processed);
        setFilteredData([]);
        statusEl.innerText = `Sincronizado! ${processed.length} demandas online.`;
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
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '', cellDates: false, raw: true });

                const processed = processRowData(jsonData);

                if (processed.length === 0) {
                    reject("O arquivo parece vazio ou não tem a coluna 'DEMANDA'.");
                    return;
                }

                setRawData(processed);
                setFilteredData([]);
                document.getElementById('upload-status').innerText = `Sucesso! ${processed.length} demandas carregadas.`;
                document.getElementById('update-date').innerText = new Date().toLocaleString('pt-BR');
                document.body.classList.add('data-loaded');
                resolve(processed);
            } catch (err) {
                console.error(err);
                reject("Erro ao ler arquivo. Verifique se é um XLSX válido.");
            }
        };
        reader.onerror = () => reject("Erro ao ler arquivo.");
        reader.readAsArrayBuffer(file);
    });
}
