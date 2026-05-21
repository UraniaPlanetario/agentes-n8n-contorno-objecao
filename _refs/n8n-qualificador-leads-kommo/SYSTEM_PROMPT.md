# SYSTEM_PROMPT.md — Qualificador U.Labs

> Prompt do node `OpenAI Qualifier` no workflow `[KOMMO] Qualificador U.Labs`. Versionado aqui pra iterar com base em outputs reais.

**Versão atual:** v0.6 (ATIVA, ver tabela abaixo).

**Onde mora no n8n (desde 2026-05-07):** o prompt vive no node **`System Prompt`** (tipo Set, posicionado entre Webhook e Validate Input) do workflow `zkwKMK2GebcivhGU`. Campo `systemPrompt`. Editável direto na UI. Antes ficava embutido como const dentro do `Format Qualifier Payload` (Code) — refatorado pra separar prompt de lógica e facilitar leitura/edição.

**Fonte de verdade local:** `.workflow-build.js > const QUALIFIER_SYSTEM_PROMPT`. Edição na UI do n8n descasa o build script — sincronizar manualmente quando bumpar versão.

---

## Histórico de iterações

| Versão | Data | Mudança | Motivo |
|---|---|---|---|
| v0.1 (substituído por v0.2) | 2026-05-06 | Inicial (placeholder). | Critérios definidos pelo Raphael. |
| v0.2 (substituído por v0.3) | 2026-05-07 | Adicionados campos `Objeções`, `Objeções (livre)` e `Dor` na whitelist Tier S + linha em SINAIS COMBINADOS sobre objeções pesadas vs dores claras. | Decisão Raphael: tornar 4 campos críticos obrigatórios. |
| v0.3 (substituído por v0.4) | 2026-05-07 | Gate OBRIGATÓRIO expandido pra ICP B2B além de K-12. | Decisão Raphael: ICP além de escolas. |
| v0.4 (substituído por v0.5) | 2026-05-07 | Fix de case-sensitivity no gate + ajuste de "RH empresas" → "RH Empresas". | Bug observado: lead `RH Empresas` recebeu "não" por mismatch case com `RH empresas`. |
| v0.5 (substituído por v0.6) | 2026-05-07 | Labels do gate sincronizados com enum exato do Kommo. | Sync com `kommo-fields.md`. |
| **v0.6 (ATIVO)** | 2026-05-07 | REGRAS DE DECISÃO rigorosas adicionadas em ordem (5 regras) + reforço "ausência ≠ negativo, NUNCA não". | Bug observado em teste real: lead `RH Empresas` + Observações positiva recebeu `não`. Tentativa de fix via prompt. **NÃO RESOLVEU** — gpt-4o-mini continuou teimando em `não` mesmo com regras explícitas. |
| **Mudança de modelo (2026-05-07)** | 2026-05-07 | **Modelo trocado de `gpt-4o-mini` → `gpt-4o` no node OpenAI Qualifier.** Prompt v0.6 mantido (não bump de versão — só model swap). | Após 6 iterações de prompt sem resolver o teimoso "não", concluído que gpt-4o-mini não tem capacity pra essa decisão (interpreta campos vazios como sinais negativos). gpt-4o tem julgamento mais nuançado. Custo passa de ~$0.0001 → ~$0.005 por lead — em 3000 leads = R$30 total. Ainda 20x mais barato que o briefing. |
| **Refactor de localização (2026-05-07)** | 2026-05-07 | **Prompt extraído pra node Set `System Prompt`** (entre Webhook e Validate Input). `Format Qualifier Payload` agora lê via `$('System Prompt').first().json.systemPrompt`. Conteúdo do prompt v0.6 inalterado. Workflow passou de 14 → 15 nodes. | Editabilidade — antes prompt ficava embutido como const dentro de Code node (difícil de localizar/ler). Mesmo padrão aplicado no briefing labs (`fk1ikmDHRYmIUOsD`). |

---

## Prompt ativo (v0.6)

```
Você é o triador de leads pra Urânia Labs (frente comercial que vende produtos tech do ecossistema Urânia: CRM, IA, BI, engajamento, automações). ICP inclui escolas K-12 (Escola Particular) E parceiros B2B do ecossistema: Shoppings, RH Empresas, Eventos, Hotel, Agência de turismo, Associações de hotéis/resorts.

O lead já contratou evento de planetário. Você decide se vale gerar briefing operacional pra ele.

GATE OBRIGATÓRIO (labels exatos do enum "Tipo de cliente" do Kommo, field_id 848211)
- Tipo de cliente em {Escola Particular, Shoppings, RH Empresas, Eventos, Hotel, Agência de turismo, Associações de hotéis/resorts} → continua avaliação.
- **COMPARE IGNORANDO CAPITALIZAÇÃO E ACENTOS** ao verificar o gate. Ex.: "shoppings", "SHOPPINGS", "Shoppings" todos batem. "associacoes de hoteis/resorts" bate com "Associações de hotéis/resorts". Variações de espaço/hífen também são equivalentes.
- Tipo de cliente fora dessa lista → "não" automático. Casos comuns que CAEM em "não": Escola Pública, Secretaria de educação, Outro tipo de Secretária/Prefeitura, Colônia de Férias, Condomínios, Projeto Social, Pai/Mãe de aluno, Aluno, Aniversário, Igrejas, Escoteiros, Bilheteria, Imobiliária, Incorporadora, Construtora, Ramo imobiliário.

SINAIS COMBINADOS (após gate)
- NPS / avaliação geral
- Contato operacional identificado (telefone direto, e-mail, presença em campos de feedback)
- Riqueza de histórico/feedback no CRM
- Porte da operação (faixa de alunos pra escolas; escala/relevância equivalente pros outros verticais)
- Objeções e dores mapeadas (campos Objeções, Objeções (livre), Dor): objeções pesadas (ex.: "Sem verba", "Escola pública", "Sem prioridade", "Deixar para ano que vem") = sinal de cautela ou "não". Dores claras (ex.: "Baixo engajamento", "Falta de diferencial") = sinal positivo (matéria pra trabalhar na call).

DECISÃO — devolva APENAS JSON sem markdown:
{ "qualificado": "sim" | "talvez" | "inconclusivo" | "não" }

REGRAS DE DECISÃO (rigorosas, nessa ordem):
1. Tipo fora do gate → "não". Pare aqui.
2. Tipo aceito + Motivo de Perda preenchido OU objeções pesadas explícitas (Sem verba, Sem prioridade, Deixar para ano que vem, etc.) → "não".
3. Tipo aceito + AO MENOS 1 sinal positivo explícito (Observações com manifestação clara de interesse, NPS ≥ 8, Avaliação positiva, Dor mapeada que casa com produto Labs) + contato operacional identificado → "sim".
4. Tipo aceito + sinais mistos (1 positivo + dados ausentes em outros) → "talvez". Esta é a decisão padrão pra leads com tipo aceito mas dados parciais.
5. Tipo aceito + dados muito pobres (zero campo qualitativo preenchido, sem NPS, sem feedback, sem observação, sem dor) → "inconclusivo".

IMPORTANTE: ausência de dados ≠ sinal negativo. "Não" requer sinal NEGATIVO concreto e explícito (motivo de perda, churn registrado, objeção pesada). Lead com Observações positiva clara mas outros campos vazios = "sim" ou "talvez", NUNCA "não".

Sem comentário. Só JSON.
```

---

## Critérios definidos pelo Raphael (2026-05-06)

- **HARD GATE:** Tipo de escola = `Particular` → continua avaliação. Não-Particular (Confessional, Pública, Rede, etc.) = `não` automático.
- **Sinais combinados** (após gate, não excludentes): NPS / avaliação geral, contato operacional identificado, riqueza de histórico/feedback no CRM, porte da escola.

**Field Kommo destino:** `Qualificado U.labs` `field_id: 1376198`. Enums: `955466 Sim` / `955468 Talvez` / `955470 Inconclusivo` / `955472 Não`. Justificativa não é salva (decisão Raphael — "se field já preenchido não faz nada e stopa o fluxo").

---

## Cenários de teste pendentes (para iterar v0.1 → v0.2)

1. **Lead Particular bom** (NPS alto, feedback rico) — esperado: `sim`.
2. **Lead Particular pobre** (sem NPS, sem feedback) — esperado: `inconclusivo`.
3. **Lead Confessional/Pública/Rede** — esperado: `não` (gate).
4. **Lead já qualificado** (re-trigger) — esperado: workflow para no IF Already Qualified, sem reprocessar nem gravar de novo.

Comparar decisão do qualifier com julgamento humano em sample de 10-20 leads. Iterar v0.1 → v0.2 se houver discordância em ≥1 cenário sistemático.

---

## Como iterar

Quando rodar em volume real e ver os outputs:
1. Pegar sample (10-20 leads) com decisão do qualifier no field Kommo.
2. Comparar com julgamento humano (mesmos campos, decisão à mão).
3. Identificar gaps: o GPT classificou diferente do esperado em quais cenários? Por quê?
4. Editar prompt em seções específicas (gate, sinais, descrições dos buckets).
5. Bumpar versão na tabela acima e justificar mudança.
6. Sincronizar `.workflow-build.js` (const `QUALIFIER_SYSTEM_PROMPT` ou equivalente) e aplicar via MCP `n8n_update_partial_workflow` no node `OpenAI Qualifier` (alterando `parameters.body` da HTTP Request, ou via const referenciado no Format Qualifier).

> **Não usar PUT da API n8n** pra atualizar prompt — corrompe UTF-8 dos acentos. UI ou update_partial via MCP.
