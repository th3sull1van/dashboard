# Detalhamento de Métricas e Colunas (Excel vs Dashboard)

Este documento fornece um mapeamento completo das colunas da planilha "Controle de Projetos - Fábrica.xlsx", detalhando os cálculos originais e como eles serão processados no Dashboard.

---

## 1. Mapeamento de Colunas e Fórmulas

| Coluna | Descrição | Fórmula Original (Excel) | Lógica Dashboard (JS) |
| :--- | :--- | :--- | :--- |
| **META** | Prazo acordado (dias úteis) p/ formato. | `=VLOOKUP(FORMATO, LISTAS!$I$1:$K$18, 3, FALSE)` | Busca no objeto `METAS_COMPLEXIDADE` usando o campo `FORMATO`. |
| **PREVISÃO DE ENTREGA** | Data estimada para o término. | `=IF(INICIO_PROD="","",WORKDAY(INICIO_PROD, META-1, FERIADOS))` | `addBusinessDays(dataInicio, meta, feriados)` |
| **STATUS DA ENTREGA** | Avaliação qualitativa do prazo. | `=IF(ENTREGA="","",IF(ENTREGA<=PREVISAO,"Entregue no Prazo","Fora do prazo"))` | Comparação direta entre objetos `Date`. |
| **DIAS PREVISTOS** | Dias úteis planejados para execução. | `=IF(STATUS="Em Pausa"..."Kickoff", 1, META)` | Condicional baseada no `STATUS` e no valor da `META`. |
| **DIAS REALIZADOS** | Dias úteis gastos na produção. | `=NETWORKDAYS(INICIO_PROD, ENTREGA, FERIADOS)` | `calcBusinessDays(dataInicio, dataFim, feriados)` (Inclusive - conta o dia de início). |
| **SLA** | Índice de produtividade (%). | `=IFERROR(META / DIAS_REALIZADOS, "")` | `(meta / realizados) * 100`. |
| **PREVISÃO KICKOFF** | Prazo para alinhamento inicial. | *Nova Regra Dashboard* | `addBusinessDays(SOLICITACAO, 1, FERIADOS)` (T+1 para estudo do analista). |
| **PREVISÃO ENVIO ROTEIRO** | Prazo para envio da 1ª versão. | *Nova Regra Dashboard* | `addBusinessDays(KICKOFF, 1, FERIADOS)` (T+1 após o Kickoff). |
| **PREVISÃO VALID. ROTEIRO** | Prazo para feedback do cliente. | *Nova Regra Dashboard* | `addBusinessDays(KICKOFF, 2, FERIADOS)` (T+2 após o Kickoff). |
| **STATUS DA META** | Comparação Dias Previstos vs Realizados. | `=IF(DIAS_REAL<=DIAS_PREV, "No Prazo", "Fora")` | Condicional numérica simples (Inclusive). |
| **STATUS DE APROVAÇÃO** | Qualidade da entrega (versão 1). | `=IF(VERSOES=1, "Aprovado de Primeira", "Ajustado")` | `row['Nº DE VERSÕES'] <= 1 ? "Aprovado" : "Ajustado"`. |
| **COMPLEXIDADE** | Nível de dificuldade por formato. | `=VLOOKUP(FORMATO, LISTAS!$I$1:$J$16, 2)` | Busca no objeto `METAS_COMPLEXIDADE`. |
| **PREVISÃO ROTEIRO** | Prazo para entrega do roteiro. | `=WORKDAY(SOLICITACAO, 2, FERIADOS)` | `addBusinessDays(solicitacao, 2, feriados)`. |
| **DIAS ABERTO** | Lead Time total (corridos). | `=IF(CONCLUIDO, ENTREGA - SOLIC, HOJE - SOLIC)` | `calcDiffDays(data1, data2)` (Dias Corridos). |
| **TAXA IA** | Percentual de ganho com IA. | `=VLOOKUP(FORMATO, LISTAS!$U$2:$V$14, 2)` | Busca no objeto `TAXA_IA_FORMATO`. |

---

## 2. Variáveis de Referência

### 2.1. Tabela de Metas (LISTAS)
Baseada na complexidade e tempo médio de produção por formato:
- **Simulador:** 10 dias
- **SCORM:** 5 dias
- **Vídeo / E-book:** 4 dias
- **Podcast:** 3 dias
- **PPT / Infográfico / Roteiro:** 2 dias
- **Prova / Certificado / Comunicado:** 1 dia

### 2.2. Calendário de Feriados
O sistema utiliza uma lista fixa de feriados nacionais e facultativos (extraída até 2028) para garantir que os cálculos de `WORKDAY` e `NETWORKDAYS` no Dashboard coincidam exatamente com os do Excel.

---

## 3. Lógica de Negócio (JS Enrichment)

Toda a carga de dados passará por uma função de **Enriquecimento** que executa os passos na seguinte ordem:
1.  **Limpeza:** Remove espaços e normaliza strings.
2.  **Lookup:** Associa o Formato à Meta e Complexidade.
3.  **Cálculo de Datas:** Gera `PREVISÃO DE ENTREGA` se houver `INÍCIO DA PRODUÇÃO`.
4.  **Cálculo de Performance:** Gera `DIAS REALIZADOS`, `SLA` e `STATUS DE APROVAÇÃO`.
5.  **Cálculo de Lead Time:** Gera a idade da demanda em dias corridos.

---
*Este documento serve como especificação técnica para a migração das fórmulas Excel para o motor de cálculos do Dashboard.*
