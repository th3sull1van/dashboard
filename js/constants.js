export const MONTHS_ORDER = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

export const CANONICAL_STATUSES = ['A iniciar', 'Kickoff', 'Produção de roteiro', 'Em validação', 'Em produção', 'Concluído', 'Em pausa', 'Cancelado'];

export const FERIADOS = [
    "2023-01-01", "2023-02-02", "2023-09-16", "2023-04-07", "2023-04-21", "2023-05-01", "2023-05-30", "2023-09-07", "2023-10-12", "2023-11-02", "2023-11-15", "2023-11-20", "2023-12-25",
    "2024-01-01", "2024-02-02", "2024-09-16", "2024-03-29", "2024-04-21", "2024-05-01", "2024-05-30", "2024-09-07", "2024-10-12", "2024-11-02", "2024-11-15", "2024-11-20", "2024-12-25",
    "2025-01-01", "2025-02-02", "2025-09-16", "2025-04-18", "2025-04-21", "2025-05-01", "2025-06-19", "2025-09-07", "2025-09-16", "2025-10-12", "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25",
    "2026-01-01", "2026-02-02", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07", "2026-09-16", "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
    "2027-01-01", "2027-02-02", "2027-03-26", "2027-04-21", "2027-05-01", "2027-05-27", "2027-09-07", "2027-09-16", "2027-10-12", "2027-11-02", "2027-11-15", "2027-11-20", "2027-12-25",
    "2028-01-01"
];

export const METAS_COMPLEXIDADE = {
    "PROVA": { complexidade: "Baixa", meta: 1 },
    "WORKSHOP": { complexidade: "Baixa", meta: 0 },
    "CERTIFICADO": { complexidade: "Baixa", meta: 1 },
    "COMUNICADO": { complexidade: "Baixa", meta: 1 },
    "E-BOOK": { complexidade: "Média", meta: 4 },
    "INFOGRAFICO": { complexidade: "Baixa", meta: 2 },
    "PODCAST": { complexidade: "Média", meta: 3 },
    "PPT": { complexidade: "Média", meta: 2 },
    "ROTEIRO": { complexidade: "Baixa", meta: 2 },
    "SCORM": { complexidade: "Alta", meta: 5 },
    "VIDEO": { complexidade: "Alta", meta: 4 },
    "PLANO DE AULA": { complexidade: "Baixa", meta: 0 },
    "INFORMATIVO": { complexidade: "Baixa", meta: 1 },
    "SIMULADOR": { complexidade: "Alta", meta: 10 },
    "MOTOR DE IA": { complexidade: "Alta", meta: 2 },
    "DIAGRAMACAO": { complexidade: "Média", meta: 10 }
};

export const TAXA_IA_MAP = {
    "VIDEO": 0.4,
    "INFORMATIVO": 0.625,
    "PROVA": 0.57,
    "SCORM": 0.5,
    "SIMULADOR": 0.25,
    "CERTIFICADO": 0.5,
    "ROTEIRO": 0.5
};

export const SHEET_ID = '1T_eGvDyB4hZ6QWoCp24rdTJHGiKA0sbw';
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export const CACHE_KEY = 'dash_raw_data';
export const CACHE_DATE_KEY = 'dash_cache_date';
