# Regras de Negócio e Estrutura de Dados (Dashboard)

Este documento centraliza toda a inteligência do Dashboard, descrevendo a estrutura de dados necessária, as fórmulas de cálculo e as regras de fluxo de trabalho.

---

## 1. Estrutura da Base (Entrada de Dados)

A planilha de entrada (Excel ou Google Sheets) deve focar em **Dados Brutos**. O Dashboard processará a inteligência a partir destas colunas obrigatórias:

### 1.1. Identificação e Responsabilidade
| Coluna | Tipo de Dado | Objetivo |
| :--- | :--- | :--- |
| **DEMANDA** | Texto | Identificador único ou nome do projeto. |
| **SOLICITANTE** | Texto | Nome do cliente interno ou área solicitante. |
| **RESPONSÁVEL** | Texto | Nome do analista encarregado da criação. |
| **RESPONSÁVEL 2** | Texto | Analista de apoio ou revisor (opcional). |
| **FRENTE** | Texto | Categoria ou Treinamento ao qual a demanda pertence. |
| **PROJETO / ID_DEMANDA**| Texto | Campos auxiliares de rastreio em outros sistemas. |

### 1.2. Status e Fluxo
| Coluna | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| **STATUS** | Texto (Lista) | `A iniciar`, `Kickoff`, `Produção de roteiro`, `Em validação`, `Em produção`, `Concluído`, `Em pausa`, `Cancelado`. |
| **FORMATO** | Texto (Lista) | `Vídeo`, `SCORM`, `PPT`, `E-book`, `Simulador`, etc. |
| **Nº DE VERSÕES** | Numérico | Quantidade de versões enviadas. |
| **CARGA** | Texto/Hora | Duração do conteúdo (Ex: `00:15`). |
| **Classificação de Ajuste**| Texto | Define se a demanda teve retrabalho (`Com Ajuste`) ou não. |
| **Uso de IA** | Texto (Sim/Não)| Indica se a ferramenta de IA foi utilizada na produção. |

### 1.3. Datas Críticas e Administrativas
| Coluna | Tipo de Dado | Importância |
| :--- | :--- | :--- |
| **SOLICITAÇÃO** | Data | Início do Lead Time. |
| **KICKOFF** | Data | Início do alinhamento técnico. |
| **ENVIO DO ROTEIRO**| Data | Entrega da primeira versão do roteiro. |
| **VALIDAÇÃO DO ROTEIRO**| Data | Aprovação do roteiro pelo cliente. |
| **INÍCIO DA PRODUÇÃO**| Data | Início do desenvolvimento técnico. |
| **ENTREGA** | Data | Data final de envio ao solicitante. |
| **DT Validação** | Data | Registro administrativo da data de validação final. |
| **OBSERVAÇÕES** | Texto | Notas gerais sobre o andamento ou impedimentos. |

### 1.4. Satisfação (CSAT) e Qualidade
*Notas de 1 a 5 ou Categorias qualitativas:*

**Visão Consultor:**
- **Prazo - Consultor**, **Assertividade - Consultor**, **Storytelling - Consultor**, **Design - Consultor**, **Experiência Geral - Consultor**.

**Visão EPS (Opcional):**
- **Assertividade EPS**, **Storytelling EPS**, **Design EPS**.

**Campos Auxiliares (Legado/Controle):**
- `ANO`, `MÊS`, `CICLO`, `Thread`, `Pesquisa enviada`, `Nível de Conteúdo`, `Tipo de Ajuste`.

---

## 2. Motor de Cálculos (Enriquecimento Interno)

O Dashboard calcula os campos abaixo automaticamente, tornando as colunas de fórmulas no Excel desnecessárias.

| Campo (JS) | Lógica Dashboard (JS) | Regra de Negócio / Objetivo |
| :--- | :--- | :--- |
| **META_CALC** | Busca no objeto `METAS_COMPLEXIDADE`. | Prazo acordado (dias úteis) por formato. |
| **PREVISÃO KICKOFF** | `addBusinessDays(SOLICITACAO, 1)` | **T+1:** Garante tempo para o analista estudar a demanda. |
| **PREVISÃO ENVIO ROTEIRO** | `addBusinessDays(KICKOFF, 1)` | **K+1:** Meta para envio da 1ª versão do roteiro. |
| **PREVISÃO VALID. ROTEIRO** | `addBusinessDays(KICKOFF, 2)` | **K+2:** Meta para validação final do roteiro pelo cliente. |
| **PREVISÃO INÍCIO PROD.** | `addBusinessDays(KICKOFF, 3)` | **K+3:** Prazo limite para transição Roteiro -> Produção. |
| **PREVISÃO DE ENTREGA** | `addBusinessDays(INICIO_PROD, META-1)` | Data estimada de término baseada na meta do formato. |
| **DIAS REALIZADOS** | `countBusinessDays(INICIO_PROD, ENTREGA)` | **Padrão Inclusive:** Conta o dia de início e o de entrega. |
| **SLA (%)** | `(META_CALC / DIAS REALIZADOS) * 100` | Índice de produtividade. |
| **STATUS APROVAÇÃO** | `VERSÕES <= 1 ? "Aprovado" : "Ajustado"` | Medir qualidade e retrabalho na primeira entrega. |
| **DIAS ABERTO** | `calcDiffDays(SOLIC, ENTREGA ou HOJE)` | Lead Time total em dias corridos. |
| **TAXA IA** | Percentual fixo por Formato. | Ganho de eficiência projetado com uso de IA. |

---

## 3. Variáveis Globais de Referência

### 3.1. Tabela de Metas e Complexidade
| Formato | Dias Úteis (Meta) | Complexidade |
| :--- | :---: | :--- |
| Simulador / Diagramação | 10 | Alta / Média |
| SCORM | 5 | Alta |
| Vídeo / E-book | 4 | Alta / Média |
| Podcast | 3 | Média |
| PPT / Infográfico / Roteiro | 2 | Média / Baixa |
| Prova / Certificado / Comunicado| 1 | Baixa |

### 3.2. Calendário de Feriados
O sistema utiliza uma lista interna de feriados (extraída até 2028) para garantir que os cálculos de dias úteis no Dashboard coincidam com o calendário operacional, ignorando fins de semana e datas não úteis.