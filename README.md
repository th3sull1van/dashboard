# Dash - Dashboard Interativo Operacional

Um dashboard web moderno e responsivo desenvolvido para a **Fábrica de Conteúdos**, focado no acompanhamento de métricas, trilhas de produção e status de demandas operacionais.

![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

## 🚀 Funcionalidades

O dashboard oferece quatro visões principais para análise de dados:

1.  **Status e Frentes:** Visão geral do volume de demandas por estágio (A iniciar, Kickoff, Produção, Validação, Concluído, etc.).
2.  **Trilha de Produção:** Visualização detalhada do fluxo de uma demanda específica, exibindo datas de marcos importantes e tempos de produção (previsto vs. realizado).
3.  **KPIs e Gráficos:** Indicadores de performance, produtividade (SLA), precisão (aprovação de 1ª) e satisfação (CSAT).
4.  **Resumo Detalhado:** Tabela interativa com filtros por formato, solicitante e responsável, permitindo o detalhamento de cada item.

### 🛠 Recursos Adicionais
-   **Importação de Dados:** Suporte para carregamento de arquivos locais `.xlsx` ou `.xls`.
-   **Sincronização em Nuvem:** Integração direta para ler dados de uma planilha do Google Sheets via CSV.
-   **Filtros Globais:** Filtragem dinâmica por período, ano, mês, solicitante e responsável.
-   **Exportação:** Geração de relatórios em formato PDF.

## 💻 Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web padrão (Vanilla Stack) para garantir leveza e portabilidade:

-   **HTML5 & CSS3:** Interface estruturada com CSS customizado (variáveis, flexbox, grid e animações).
-   **JavaScript (ES6+):** Lógica de processamento de dados e interatividade.
-   **[SheetJS (XLSX)](https://sheetjs.com/):** Para leitura e processamento de arquivos Excel.
-   **[Chart.js](https://www.chartjs.org/):** Para renderização de gráficos dinâmicos.
-   **[jsPDF](https://github.com/parallax/jsPDF) & AutoTable:** Para exportação de relatórios em PDF.
-   **Font Awesome:** Biblioteca de ícones.

## 📋 Como Usar

1.  Abra o arquivo `index.html` em qualquer navegador moderno.
2.  Na tela inicial (Capa), você pode:
    -   Clicar em **"Carregar Planilha (XLSX)"** para usar um arquivo local.
    -   Clicar em **"Sincronizar Google Sheets"** para buscar dados da planilha configurada no script.
3.  Após o carregamento, utilize o menu lateral ou os botões da capa para navegar entre as páginas do dashboard.
4.  Utilize os filtros no topo da página para refinar os dados visualizados.

## ⚙️ Configuração da Planilha Google

Para alterar a planilha de origem na sincronização automática, edite as constantes no final do arquivo `index.html`:

```javascript
const SHEET_ID = 'SEU_ID_DA_PLANILHA_AQUI';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
```
*Certifique-se de que a planilha esteja publicada na web ou com acesso de leitura para "Qualquer pessoa com o link".*

---
Desenvolvido para otimização de fluxos editoriais e de produção.
