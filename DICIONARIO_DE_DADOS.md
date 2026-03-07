# Dicionário de Dados: Estrutura da Base (Excel)

Este documento define a estrutura ideal para a planilha de entrada (Excel ou Google Sheets) do Dashboard. Com o motor de cálculos interno, a base deve focar em **Dados Brutos**, enquanto a inteligência é processada pelo Dashboard.

## 1. Colunas Obrigatórias (Entrada de Dados)

Estas colunas devem ser preenchidas manualmente ou extraídas do seu sistema de gestão.

| Coluna | Tipo de Dado | Objetivo |
| :--- | :--- | :--- |
| **DEMANDA** | Texto | Identificador único ou nome do projeto. |
| **SOLICITANTE** | Texto | Nome do cliente interno ou área solicitante. |
| **RESPONSÁVEL** | Texto | Nome do produtor ou consultor responsável pela criação técnica do material. |
| **STATUS** | Texto (Lista) | Status atual (Ex: `A iniciar`, `Em Produção`, `Concluído`, `Cancelado`). |
| **FORMATO** | Texto (Lista) | Tipo de entrega (Ex: `Vídeo`, `SCORM`, `PPT`). *Essencial para o cálculo de metas.* |
| **SOLICITAÇÃO** | Data (DD/MM/AAAA) | Data em que o pedido entrou no fluxo. |
| **INÍCIO DA PRODUÇÃO** | Data (DD/MM/AAAA) | Data em que a execução técnica começou. *Base para o cálculo de SLA.* |
| **ENTREGA** | Data (DD/MM/AAAA) | Data final de envio ao solicitante. |
| **Nº DE VERSÕES** | Numérico | Quantidade de versões enviadas. *Define o status de aprovação.* |
| **CARGA** | Texto/Hora | Tempo de duração do conteúdo (Ex: `00:15` ou `15 min`). |
| **FRENTE** | Texto | Categoria ou Treinamento ao qual a demanda pertence. |

### Colunas de Satisfação (CSAT)
*Preencher com notas de 1 a 5 após a conclusão.*
- **Prazo - Consultor**
- **Assertividade - Consultor**
- **Storytelling - Consultor**
- **Design - Consultor**
- **Experiência Geral - Consultor**

---

## 2. Colunas Calculadas Internamente (Podem ser removidas do Excel)

O Dashboard calcula estes campos em tempo real assim que os dados são carregados.

| Campo (JS) | Lógica / Fórmula Aplicada | Objetivo |
| :--- | :--- | :--- |
| **META_CALC** | De-Para baseado no `FORMATO` (Ex: Vídeo = 4 dias). | Definir o prazo acordado automaticamente. |
| **PREVISÃO DE ENTREGA** | `INÍCIO DA PRODUÇÃO` + `META_CALC` (Dias Úteis). | Gerar a data estimada de término (WORKDAY). |
| **DIAS REALIZADOS** | Dias úteis entre `INÍCIO DA PRODUÇÃO` e `ENTREGA`. | Medir o tempo real de execução (NETWORKDAYS). |
| **SLA (%)** | `(META_CALC / DIAS REALIZADOS) * 100` | Índice de produtividade. |
| **STATUS APROVAÇÃO** | Se `VERSÕES` <= 1 "Aprovado de 1ª", senão "Ajustado". | Medir a qualidade e retrabalho. |
| **DIAS ABERTO** | Dias corridos de `SOLICITAÇÃO` até `ENTREGA` (ou Hoje). | Medir o Lead Time total. |
| **PREVISÃO KICKOFF** | `SOLICITAÇÃO` + 1 dia útil. | Garante tempo para o analista estudar a demanda. |
| **PREVISÃO ENVIO ROTEIRO**| `KICKOFF` + 1 dia útil. | Meta para envio da primeira versão do roteiro. |
| **PREVISÃO VALID. ROTEIRO**| `KICKOFF` + 2 dias úteis. | Meta para validação final do roteiro pelo cliente. |
| **TAXA IA** | Percentual fixo baseado no `FORMATO`. | Medir o ganho de eficiência por uso de IA. |

---

## 3. Recomendações de Manutenção

1.  **Limpeza:** Evite mesclar células na planilha de base.
2.  **Datas:** Certifique-se de que as colunas de data estejam formatadas como "Data" no Excel para evitar erros de leitura.
3.  **Padronização:** Mantenha a grafia dos **Formatos** e **Status** idêntica (Ex: Use sempre `Vídeo` e não `Video` ou `Videos`).
