import { FERIADOS } from './constants.js';

export const norm = (str) => {
    if (!str) return '';
    return String(str)
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
};

export const equals = (a, b) => norm(a) === norm(b);

export const num = (str) => {
    let n = parseFloat((str || '').toString().replace('%', '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
};

export const sum = (arr, k) => arr.reduce((a, c) => a + num(c[k]), 0);

export const avg = (arr, k) => {
    const valid = arr.filter(d => {
        let val = (d[k] || '').toString().trim();
        return val !== '' && !isNaN(parseFloat(val.replace('%', '').replace(',', '.')));
    });
    return valid.length ? sum(valid, k) / valid.length : 0;
};

export const count = (arr, k, v) => arr.filter(d => equals(d[k], v)).length;

export const getUnique = (arr, key) => {
    const seen = new Set();
    const result = [];
    arr.forEach(item => {
        const rawVal = (item[key] || '').toString().trim();
        const normalized = norm(rawVal);
        if (rawVal && !seen.has(normalized)) {
            seen.add(normalized);
            result.push(rawVal);
        }
    });
    return result.sort((a, b) => a.localeCompare(b));
};

export const isHoliday = (date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const s = `${year}-${month}-${day}`;
    return FERIADOS.includes(s);
};

export const isBusinessDay = (date) => {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6 && !isHoliday(date);
};

export const addBusinessDays = (startDate, days) => {
    if (!startDate || isNaN(days)) return null;
    let date = new Date(startDate);
    let count = 0;
    while (count < days) {
        date.setUTCDate(date.getUTCDate() + 1);
        if (isBusinessDay(date)) count++;
    }
    return date;
};

export const countBusinessDays = (d1, d2) => {
    if (!d1 || !d2 || d2 < d1) return 0;
    let count = 0;
    let date = new Date(d1);
    while (date <= d2) {
        if (isBusinessDay(date)) count++;
        date.setUTCDate(date.getUTCDate() + 1);
    }
    return count;
};

export const formatDateValue = (val) => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) {
        const d = val.getUTCDate().toString().padStart(2, '0');
        const m = (val.getUTCMonth() + 1).toString().padStart(2, '0');
        const y = val.getUTCFullYear();
        return `${d}/${m}/${y}`;
    }
    if (typeof val === 'number' && val > 30000 && val < 60000) {
        // Número de série do Excel: dias desde 30/12/1899
        // Adicionar o fuso horário local para evitar off-by-one
        const timezoneOffset = new Date().getTimezoneOffset();
        const date = new Date(Math.round((val - 25569) * 864e5) + (timezoneOffset * 60000));
        const d = date.getUTCDate().toString().padStart(2, '0');
        const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const y = date.getUTCFullYear();
        return `${d}/${m}/${y}`;
    }
    return String(val).trim();
};

export const parseDateBR = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [dia, mes, ano] = parts.map(Number);
    const date = new Date(Date.UTC(ano, mes - 1, dia));
    return date;
};

export const parseInputDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d);
};
