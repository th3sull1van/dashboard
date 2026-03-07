# Dash - Dashboard Interativo Operacional

Um dashboard web moderno e responsivo desenvolvido para a **Fábrica de Conteúdos**, focado no acompanhamento de métricas, trilhas de produção e status de demandas operacionais.

![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

## 🚀 Funcionalidades

O dashboard oferece seis visões principais para análise de dados:

1.  **Status e Frentes:** Visão geral do volume de demandas por estágio oficial do fluxo.
2.  **Trilha de Produção:** Visualização detalhada do fluxo de uma demanda, com indicadores de meta (T+1, K+1, etc.) e status visual de atraso (semáforo).
3.  **KPIs e Gráficos:** Indicadores de performance, produtividade (SLA), precisão (aprovação de 1ª) e satisfação (CSAT) com análise de tendência.
4.  **Resumo Detalhado:** Tabela interativa para exploração granular dos dados.
5.  **Insights & Rankings:** Dashboards comparativos de performance por solicitante, formato e CSAT.
6.  **Qualidade de Dados:** Identificação automática de inconsistências, datas inválidas ou campos vazios na base.

### 🛠 Recursos Adicionais
-   **Cálculos Autônomos:** O motor interno JS processa SLAs, prazos úteis (feriados inclusos) e metas, eliminando a dependência de fórmulas no Excel.
-   **Filtros Globais Unificados:** Barra horizontal fixa com filtros sincronizados por Período, Busca, Ano, Mês, Solicitante, Responsável, Formato, Status e Frente.
-   **Persistência Local:** Armazenamento em cache (`localStorage`) para acesso rápido aos dados carregados anteriormente.
-   **Exportação Multiformato:** Geração de relatórios em PDF e exportação de dados tratados para XLSX.

## 📖 Regras de Negócio e Documentação

Para detalhes técnicos sobre o cálculo de métricas, estrutura obrigatória da planilha e regras de fluxo (como as metas de Kickoff e Roteiro), consulte o arquivo:
👉 **[REGRAS_DE_NEGOCIO.md](./REGRAS_DE_NEGOCIO.md)**

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
