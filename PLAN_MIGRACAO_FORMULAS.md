# Plano de Migração: Fórmulas Excel para Dashboard JS

Este documento detalha a estratégia para migrar a lógica de processamento de dados (atualmente realizada via fórmulas no Excel) diretamente para o código JavaScript do Dashboard. Isso garantirá que o Dashboard funcione corretamente mesmo com bases de dados brutas.

## 1. Objetivo
Centralizar toda a inteligência de negócio e cálculos métricos no frontend, reduzindo a dependência de colunas pré-calculadas no Excel e mitigando erros de sincronização.

## 2. Mapeamento Detalhado de Fórmulas

Abaixo estão as fórmulas reais extraídas da planilha e sua respectiva tradução para lógica JavaScript:

### 2.1. SLA e Performance
*   **META (Dias úteis acordados por formato):**
    *   *Excel:* `=VLOOKUP(FORMATO, LISTAS!$I$1:$K$18, 3, FALSE)`
    *   *JS:* `const meta = METAS_COMPLEXIDADE[norm(row['FORMATO'])]?.meta || 0;`
*   **DIAS REALIZADOS (Business Days):**
    *   *Excel:* `=MAX(1, NETWORKDAYS(INÍCIO_PRODUÇÃO, ENTREGA - 1, FERIADOS))`
    *   *JS:* Calcular dias úteis entre as duas datas, descontando fins de semana e a lista de feriados extraída.
*   **SLA %:**
    *   *Excel:* `DIAS_PREVISTOS / DIAS_REALIZADOS`
    *   *JS:* `(num(row['DIAS PREVISTOS']) / num(row['DIAS REALIZADOS'])) * 100`

### 2.2. Datas de Entrega e Prazos
*   **PREVISÃO DE ENTREGA:**
    *   *Excel:* `WORKDAY(INÍCIO_PRODUÇÃO, META - 1, FERIADOS)`
    *   *JS:* Função `addBusinessDays(dataInicio, diasMeta, feriados)`.
*   **STATUS DA ENTREGA / META:**
    *   *Excel:* Comparação entre `ENTREGA` e `PREVISÃO DE ENTREGA`.
    *   *JS:* `dEnt <= dPrev ? "No Prazo" : "Fora do Prazo"`.

### 2.3. Outros Campos
*   **DIAS ABERTO (Lead Time Ativo):**
    *   *Excel:* `=IF(CONCLUÍDO, ENTREGA - SOLICITAÇÃO, HOJE - SOLICITAÇÃO)`
    *   *JS:* Diferença de dias entre Solicitação e Entrega (ou data atual se pendente).
*   **STATUS DE APROVAÇÃO:**
    *   *JS:* `row['Nº DE VERSÕES'] <= 1 ? "Aprovado de Primeira" : "Ajustado"`.

## 3. Dados de Referência (Embutidos no JS)

Os seguintes dados foram extraídos para serem integrados ao `index.html`:
*   **Tabela de Metas/Complexidade:** (Vídeo: 4 dias, Scorm: 5 dias, Simulador: 10 dias, etc.)
*   **Lista de Feriados:** Atualizada até 2028.

## 3. Estratégia de Implementação

### Fase 1: Camada de Enriquecimento (Data Enrichment)
Criar uma função centralizadora `enrichData(row)` que será chamada durante o processamento do XLSX/CSV.
```javascript
function enrichData(row) {
  // Converte strings para objetos Date
  const dSol = parseDateBR(row['SOLICITAÇÃO']);
  const dEnt = parseDateBR(row['ENTREGA']);
  
  // Cálculo de SLA (Exemplo)
  row['SLA_CALCULADO'] = calcularSLA(row); 
  
  // Cálculo de Aprovação
  row['STATUS_APROVACAO_CALCULADO'] = (num(row['Nº DE VERSÕES']) <= 1) ? 'Aprovado de Primeira' : 'Reajustado';
  
  return row;
}
```

### Fase 2: Substituição nas Páginas
Atualizar as funções `updatePage1` a `updatePage6` para consumirem os novos campos calculados (`_CALCULADO`) em vez dos campos originais da planilha.

### Fase 3: Validação Cross-Check
Implementar um log temporário que compare o valor vindo do Excel (se existir) com o calculado pelo Dashboard, alertando sobre discrepâncias na página de "Qualidade de Dados".

## 4. Benefícios Esperados
1.  **Consistência:** As métricas serão sempre calculadas da mesma forma, independente de quem editou o Excel.
2.  **Agilidade:** Possibilidade de importar relatórios extraídos diretamente de ferramentas de gestão (Jira, Trello, etc.) sem tratamento prévio.
3.  **Manutenibilidade:** Alterações na regra de negócio (ex: mudar meta de SLA) são feitas em um único lugar no código.

## 5. Próximos Passos
1.  [ ] Identificar as fórmulas exatas de SLA usadas na tabela atual.
2.  [ ] Criar a função `enrichData` no `index.html`.
3.  [ ] Validar resultados com uma base de teste.
