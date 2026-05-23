# DESIGN — Agente Contorno de Objeção

> **Tipo de doc:** construtivo / histórico. Captura decisões, alternativas avaliadas e design técnico. Leitura rara — só pra auditoria, refator, ou retomar contexto profundo. Runbook operacional do dia-a-dia mora em [`CLAUDE.md`](./CLAUDE.md).
>
> **Status:** brainstorm fechado em **2026-05-21** (Understanding Lock confirmado). Design técnico detalhado pendente — slots marcados em §3.

---

## 1. Decision Log

12 decisões fechadas em 1 sessão de brainstorming. **Em conflito com qualquer doc anterior desta pasta, estas prevalecem.**

| # | Decisão | Alternativas avaliadas | Razão |
|---|---|---|---|
| 1 | **Trigger:** salesbot manual no Kommo | Automation nativa em campo/stage; híbrido | Controle do vendedor; permite re-disparo intencional (cliente trouxe objeção nova); evita N webhooks por save (sintoma observado lead 28416666 em 2026-05-06) |
| 2 | **Granularidade do output:** 1 nota canal-agnóstica | Multi-canal (WhatsApp/call/material direção); modo curto/completo via flag | YAGNI — vendedor adapta roteiro ao canal; flag complica salesbot sem evidência de necessidade |
| 3 | **Arquitetura:** clone do briefing labs + 1 ramo Save Field do qualifier (~14 nodes) | Solo do zero; outro pattern | Reuso máximo de pattern provado (briefing `fk1ikmDHRYmIUOsD`); ramo Save Field replica solução do qualifier (`zkwKMK2GebcivhGU`) |
| 4 | **Modelo LLM:** gpt-4o com credencial `OpenAi ([N8N-Q] Agentes Geral)` existente | Claude Sonnet 4.6 + prompt caching; gpt-4o-mini | Padrão da casa; credencial pronta (0 setup); migração pra Claude diferida pós-calibração quando ganho de cache em volume justificar overhead de nova credencial Anthropic |
| 5 | **Input do webhook:** só `{lead_id}` | `{lead_id, context_extra}` com trecho colado; ler última nota automaticamente | Salesbot Kommo é botão; passar texto livre via salesbot é fricção; campo `Objeções (livre)` já cobre nuance literal |
| 6 | **Output em 2 destinos:** custom field 1378497 (`Resp. IA objeção`) ← roteiro / nota Kommo ← 3 seções | Só nota; só field | Field = ação rápida visível no card; nota = histórico+contexto auditável |
| 7 | **Formato da nota:** 3 seções — `ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO` | 6 seções do briefing original; inverter ordem mantendo 6; 2 modos via flag | Action-first (vendedor com pressa raspa o topo); júnior ainda lê o porquê embaixo; menos token |
| 8 | **Idempotência:** field sobrescreve, notas acumulam | Dedupe por hash em janela temporal | Padrão qualifier; histórico fica nas notas (auditável); último roteiro vale no field |
| 9 | **Formato de saída do LLM:** JSON mode com 3 campos crus, code monta nota com headers fixos | Texto único com delimitadores; JSON com `nota_completa` pré-montada (duplica roteiro) | Menos tokens (sem duplicação, sem markers); headers `ROTEIRO COPIÁVEL` etc. ficam versionados em código JS (mudar layout não exige re-calibrar prompt); padrão JSON mode já provado no qualifier |
| 10 | **Whitelist:** 5 campos — `Objeções` (1376300) + `Objeções (livre)` (1376302) + `Tipo de cliente` (848211) + `Nº de alunos` + `Contato principal.cargo` | Herdar Tier S/A/C do briefing (16+6+12); reduzir só os 4 ruído; agressivo só CORE | Mínimo input pra saída limpa; cada campo a mais é token/run × N runs; campos do briefing/qualifier não calibram contorno (vendedor/consultor, anúncio, UTMs são briefing/qualifier-territory) |
| 11 | **Estrutura física:** pasta solo `n8n-contorno-objecao-kommo/`, irmã de `n8n-ativacao-dor-kommo/` | Família mãe `n8n-coach-comercial-kommo/objecao/+dor/` com SHARED_CONTEXT.md | YAGNI — 2 agentes não justifica mãe; refator quando 3º coach comercial existir; trabalho de migrar 1 agente é trivial |
| 12 | **Pós-MVP deferido:** plugagem Hub + métricas de sucesso + stub canônico tech-labs | Plugar Hub no MVP; definir métricas agora; criar stub já | Padrão briefing labs — calibrar em leads reais primeiro, formalizar Hub/métricas/stub só após v0.N estável; agente roda standalone sem Hub |

---

## 2. Assumptions

1. **Custom field 1378497 (`Resp. IA objeção`) existe no Kommo** e aceita texto longo (~500-1000 chars) sem truncar. Confirmar no setup do workflow.
2. **Credencial `OpenAi ([N8N-Q] Agentes Geral)` tem quota** suficiente pros 3 consumidores (briefing + qualifier + contorno). MVP volume baixo (~5-10 disparos pra calibração).
3. **Volume MVP:** disparos manuais via salesbot; sem batch externo (diferente do qualifier que rodou 3.000 leads).
4. **Error workflow `HQGrY3cUDvQJLGMZ`** aplicável padrão em `settings.errorWorkflow`.
5. **Bearer Kommo `skV2BHNge0lsu6UO`** reusado nos 3 MS-KOMMO chamados (Get Entity, Salvar campos, Add note).

---

## 3. Design técnico detalhado

> **Como ler:** spec arquitetural com pseudocódigo, não código pronto. Decisões e razões aqui; código JS exato vive em `.workflow-build.js` (a criar). Pra cada node Code, há **ref direta** ao equivalente no briefing labs ou qualificador em [`_refs/`](./_refs/) — abra o arquivo, leia a função correspondente, adapte conforme o **diff** descrito aqui.

### 3.1. Pipeline n8n — lista de nodes

14 nodes em sequência, com 1 branch (`IF Has Extras`) e 1 fork no final (saída dupla: field + nota). Em ordem:

| # | Node (nome) | Tipo n8n | Responsabilidade |
|---|---|---|---|
| 1 | `Webhook` | `n8n-nodes-base.webhook` | Recebe POST. `responseMode: 'onReceived'`. Path `/contorno-objecao-kommo`. |
| 2 | `System Prompt` | `n8n-nodes-base.set` | Define `systemPrompt` (string única, longo). **Editável direto na UI** sem rebuild. Fonte de verdade do prompt. |
| 3 | `Validate Input` | `n8n-nodes-base.code` | Parseia `lead_id` de 2 formatos (direto ou Kommo nativo). Erro se inválido. |
| 4 | `Get Lead` | `n8n-nodes-base.executeWorkflow` | Chama MS Get Entity (`pSUCb5GTYWc4B99I`). Retorna lead + `_embedded.contacts`. |
| 5 | `IF Has Extras` | `n8n-nodes-base.if` | Branch: existem contatos/empresas pra buscar detalhe extra? |
| 6a | `Plan Fetches` | `n8n-nodes-base.code` | (branch true) monta lista de entidades extras a buscar. |
| 6b | `Get Each Extra` | `n8n-nodes-base.executeWorkflow` | (branch true) chama Get Entity para cada extra. |
| 6c | `Aggregate Extras` | `n8n-nodes-base.code` | (branch true) consolida extras. |
| 6d | `Empty Extras` | `n8n-nodes-base.set` | (branch false) array vazio. |
| 7 | `Format Payload` | `n8n-nodes-base.code` | Lê `$('System Prompt')`, aplica whitelist de 5 campos, injeta DATA ATUAL, monta `messages` pro LLM. |
| 8 | `OpenAI Chat` | `@n8n/n8n-nodes-langchain.openAi` | gpt-4o, temp 0.4, `response_format: { type: 'json_object' }`. Credencial `OpenAi ([N8N-Q] Agentes Geral)`. |
| 9 | `Parse Output` | `n8n-nodes-base.code` | Parseia JSON do LLM em 3 campos. Valida shape mínimo. |
| 10a | `Save Field` | `n8n-nodes-base.executeWorkflow` | (ramo paralelo) chama MS Salvar campos (`m5K7FZDDvVXDiywo`), field 1378497 ← `roteiro`. |
| 10b | `Build Note` | `n8n-nodes-base.code` | (ramo paralelo) monta texto da nota com 3 headers fixos. |
| 11 | `Add Note` | `n8n-nodes-base.executeWorkflow` | Chama MS Add note (`QYvm2okgK3bQgMbR`), nota completa anexada ao lead. |

**Ref completa:** veja a estrutura literal dos nodes 1-9 e 11 no briefing labs ([`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`](./_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js)). O **node 10a `Save Field`** vem do qualificador ([`_refs/n8n-qualificador-leads-kommo/.workflow-build.js`](./_refs/n8n-qualificador-leads-kommo/.workflow-build.js), procure por `Save Qualified Field`). A novidade aqui é só o **fork** entre `Parse Output` e os 2 ramos finais — n8n suporta isso ligando 2 outputs do mesmo node.

🎓 **Conceito-chave:** o ramo `IF Has Extras` (nodes 5-6d) parece complexidade extra, mas é como o briefing busca dados dos contatos vinculados ao lead. Mantém igual — você precisa do nome+cargo do `Contato principal` (whitelist FIELDS.md). Sem isso, o lead vem sem o nome do contato e o roteiro fica genérico.

---

### 3.2. Contrato JSON do LLM (output)

LLM chamado com `response_format: { type: 'json_object' }`. Output esperado:

```json
{
  "roteiro": "1. Entendi quando você diz que ficou caro. Comparado a qual cenário?\n2. A Urânia funciona como infraestrutura educacional, não como atividade pontual...\n3. Quando diluímos por aluno (300 alunos · 12 meses Urânia Class), o investimento vira R$ 2,19/aluno/mês.\n4. Faz sentido retomarmos na quarta com 3 pontos pra direção?",
  "por_que_funciona": "Cliente Particular ressoa com Estrutura Internacional + diluição financeira (Compromisso 3). Validação primeiro, reframe de evento → infraestrutura, ancoragem por aluno/mês, próximo passo com data.",
  "proximo_passo": "Retomar quarta-feira (até 27/05) com material curto pra direção."
}
```

**Schema (informal):**

| Campo | Tipo | Tamanho | Conteúdo |
|---|---|---|---|
| `roteiro` | string | ~50-200 palavras | 3-5 falas numeradas, texto puro. Quebras de linha como `\n`. **Vai SÓ pra nota** (Destino 2) — não cabe no field 1378497 (limite 256 chars descoberto em 2026-05-23). |
| `por_que_funciona` | string | ~30-80 palavras | Explica ao vendedor júnior por que essa abordagem foi escolhida (Estrutura ativada + Compromisso aplicado + tom). |
| `proximo_passo` | string | ~10-30 palavras | Ação concreta com data sugerida (não placeholder `[dia]`). **É o que vai pro field 1378497** (Destino 1, sobrescreve) — escolhido em 2026-05-23 porque cabe nos 256 chars do field. |

🎓 **Conceito-chave:** JSON mode garante shape do output, **não** garante conteúdo. O prompt em `SYSTEM_PROMPT.md` é quem força "100% PT-BR, sem markdown, sem placeholder, sem desconto solto, etc.". Se LLM retornar JSON válido mas com texto ruim, ajusta o **prompt**, não o schema.

**Validações em `Parse Output`** (node 9):
- 3 campos existem? Se não → joga erro (workflow vai pro error workflow `HQGrY3cUDvQJLGMZ`).
- Strings não vazias? Se sim → joga erro.
- Tamanho razoável (`roteiro` < 2000 chars pra caber no field text Kommo)? Se exceder → trunca + log.

---

### 3.3. Format Payload (Code) — pseudocódigo

**Responsabilidade:** transformar o lead que veio do Kommo em payload pronto pro LLM. Whitelist de 5 campos + injeta DATA ATUAL + concatena o `mapeamento-objecoes-lead-urania.txt` no system prompt.

**Pseudocódigo:**

```
systemPrompt  ← $('System Prompt').first().json.systemPrompt
mapeamento    ← conteúdo de mapeamento-objecoes-lead-urania.txt (lido como string)
dataAtual     ← data hoje em formato BRT (DD/MM/YYYY)

lead          ← $('Get Lead').first().json
extras        ← $('Aggregate Extras' ou 'Empty Extras').first().json
contato       ← extras.contacts[0]  // contato principal

leadFiltrado  ← {
  objecoes:        getCustomField(lead, 'Objeções'),         // multiselect
  objecoes_livre:  getCustomField(lead, 'Objeções (livre)'), // text
  tipo_cliente:    getCustomField(lead, 'Tipo de cliente'),  // enum
  num_alunos:      getCustomField(lead, 'Nº de alunos'),     // number
  contato_cargo:   getCustomField(contato, 'Cargo')          // string
}

userPrompt    ← "DATA ATUAL: " + dataAtual + "\n\n"
              + "LEAD:\n" + JSON.stringify(leadFiltrado, null, 2)

return {
  systemPrompt:  systemPrompt + "\n\n---\n\nMAPEAMENTO DE OBJEÇÕES:\n\n" + mapeamento,
  userPrompt:    userPrompt
}
```

**Ref:** veja `Format Payload` do briefing labs (`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`, procure por `const PAYLOAD_CODE` ou similar). Estrutura idêntica, só muda:
1. **Whitelist** — briefing tem 16 Tier S + 6 Tier A. Aqui é só 5.
2. **Concatenação do `mapeamento-objecoes-lead-urania.txt`** — briefing não faz isso. Aqui é essencial.

🎓 **Conceito-chave:** o filtro de campos usa `field.field_name` (string legível) em vez de `field_id`. Mais robusto a renomeações? Não — é o contrário: se renomearem o campo no Kommo, **quebra**. Mas é o padrão da casa porque `field_name` é legível no código (e renomeações são raras). Decisão de design herdada.

---

### 3.4. Build Note (Code) — pseudocódigo

**Responsabilidade:** montar o texto da nota com 3 headers fixos a partir do JSON parseado.

**Pseudocódigo:**

```
parsed ← $('Parse Output').first().json  // { roteiro, por_que_funciona, proximo_passo }

texto ← "ROTEIRO COPIÁVEL\n"
      + parsed.roteiro + "\n\n"
      + "POR QUE FUNCIONA\n"
      + parsed.por_que_funciona + "\n\n"
      + "PRÓXIMO PASSO\n"
      + parsed.proximo_passo

return { note_text: texto }
```

🎓 **Conceito-chave:** headers em **string fixa** no JS (não no LLM). Se um dia quiser mudar `ROTEIRO COPIÁVEL` pra `ROTEIRO`, edita aqui — sem re-calibrar o prompt. **Separação de responsabilidades:** LLM gera conteúdo, código gera estrutura.

🎓 **Conceito-chave 2 (multiline):** notas do Kommo **aceitam `\n` real** — então aqui o `roteiro` vai com quebras de linha naturais preservadas (3-5 falas em linhas separadas, legível). É **diferente** do `Save Field` para o field 1378497, que é single-line e exige `roteiro.replace(/\n+/g, ' · ')`. Confirmado 2026-05-22.

**Ref:** o briefing labs **não tem `Build Note`** — ele monta a nota toda no LLM. Aqui mudamos porque a saída dupla (field + nota) exige que `roteiro` venha separado, então a nota precisa ser montada por código depois.

---

### 3.5. Payloads dos 3 MS-KOMMO

São contratos **rígidos** — os MS esperam shapes específicos. Veja `_refs/n8n-ms-kommo/ms/*.md` pra spec detalhada de cada. Resumo:

**Node 4 `Get Lead` → MS `pSUCb5GTYWc4B99I`** ([`get-entity.md`](./_refs/n8n-ms-kommo/ms/get-entity.md))

```json
{
  "workflowId": "pSUCb5GTYWc4B99I",
  "mode": "each",
  "options": { "waitForSubWorkflow": true },
  "body": {
    "entity_type": "leads",
    "entity_id": "{{ $('Validate Input').first().json.lead_id }}",
    "with": "contacts,catalog_elements"
  }
}
```

**Node 10a `Save Field` → MS `m5K7FZDDvVXDiywo`** ([`salvar-campos.md`](./_refs/n8n-ms-kommo/ms/salvar-campos.md))

```json
{
  "workflowId": "m5K7FZDDvVXDiywo",
  "mode": "each",
  "options": { "waitForSubWorkflow": true },
  "body": {
    "entity_type": "leads",
    "entity_id": "{{ $('Validate Input').first().json.lead_id }}",
    "fields": [
      { "field_id": 1378497, "value": "{{ $('Parse Output').first().json.roteiro }}" }
    ]
  }
}
```

**Node 11 `Add Note` → MS `QYvm2okgK3bQgMbR`** ([`add-note.md`](./_refs/n8n-ms-kommo/ms/add-note.md))

```json
{
  "workflowId": "QYvm2okgK3bQgMbR",
  "mode": "each",
  "options": { "waitForSubWorkflow": true },
  "body": {
    "entity_type": "leads",
    "entity_id": "{{ $('Validate Input').first().json.lead_id }}",
    "note_type": "common",
    "text": "{{ $('Build Note').first().json.note_text }}"
  }
}
```

🎓 **Conceito-chave:** o shape exato do `body` (nomes de campos, tipos) está em cada `ms/*.md`. **Sempre** abra esses MDs antes de chamar um MS pela primeira vez — adivinhar shape gera erro silencioso (MS retorna 200, mas Kommo não atualiza).

---

### 3.6. Validate Input (Code) — pseudocódigo

**Responsabilidade:** aceitar 2 formatos de body diferentes (compatibilidade salesbot Kommo nativo) e devolver `lead_id` normalizado.

```
body ← $input.first().json
queryParams ← $input.first().query (se houver — form-urlencoded vai aqui)

// formato 1: { "lead_id": 28416666 }
if (body.lead_id) return { lead_id: Number(body.lead_id) }

// formato 2 (Kommo nativo, form-urlencoded):
//   leads[add][0][id]=28416666
//   leads[update][0][id]=28416666
//   leads[status][0][id]=28416666
for ação em ['add', 'update', 'status']:
  if (body?.leads?.[ação]?.[0]?.id):
    return { lead_id: Number(body.leads[ação][0].id) }

// nada bateu → erro
throw new Error('lead_id ausente — body recebido: ' + JSON.stringify(body))
```

**Ref:** o briefing labs e o qualificador **ambos** têm `Validate Input` idêntico — copia literal do briefing (`_refs/n8n-briefing-leads-kommo-labs/.workflow-build.js`, função `VALIDATE_CODE` ou similar).

🎓 **Conceito-chave:** o erro é **interno** (lança exceção que vai pro error workflow). Não responde HTTP 400 — o `responseMode: 'onReceived'` já respondeu 200 quando o webhook entrou. Quem chamou (Kommo) não saberia interpretar 400 mesmo.

---

### 3.7. Pendências de setup (antes de criar o workflow)

Resolva antes ou logo no início da implementação. Não bloqueia escrever o `SYSTEM_PROMPT.md`, mas bloqueia subir o workflow.

- [x] **`field_id` exato de `Nº de alunos`** — **resolvido 2026-05-22 via MS Get Entity em lead 29314611:** `field_id: 849729`, `field_type: text` (string, não numeric — apesar do nome do campo). FIELDS.md atualizado.
- [x] **Custom field `Cargo` em contacts** — **resolvido 2026-05-22 via MS Get Entity em contact 36394425:** `field_id: 904188` (bate com catálogo), `field_type: "select"` (enum — valor exemplo: "Diretor", enum_id 620322). **Descoberta arquitetural:** `_embedded.contacts` do Get Lead retorna só `{id, is_main}` — o Cargo exige 2º Get Entity em `entity: contacts`. O ramo `IF Has Extras + Plan Fetches + Get Each Extra` do briefing labs já resolve isso — manter conforme está. Path no `Aggregate Extras`: `extras.contacts.find(c => c.is_main).custom_fields_values.find(f => f.field_name === "Cargo").values[0].value`.
- [x] **Custom field 1378497 — suporte a quebras de linha (`\n`)** — **resolvido 2026-05-22 via teste manual na UI do Kommo (lead 29314611):** field é **single-line**, `\n` vira espaço no rendering. **Adaptação:** LLM continua devolvendo `roteiro` com `\n` natural; no `Save Field` aplicar `roteiro.replace(/\n+/g, ' · ')` antes de mandar pro MS. Na nota (`Build Note`) usar `roteiro` direto sem transformação — notas suportam multiline. Marcos limpa o campo manualmente no Kommo após o teste.
- [ ] **Credencial OpenAI no node `OpenAI Chat`** — não vem auto-atribuída quando você cria workflow via MCP. Após criar, vai na UI do n8n no node, seleciona `OpenAi ([N8N-Q] Agentes Geral)`.
- [ ] **Error workflow `HQGrY3cUDvQJLGMZ`** — setar em `settings.errorWorkflow` ao criar o workflow.
- [ ] **Salesbot no Kommo** — não é setup do workflow, mas é o trigger. Após o workflow estar ativo, criar salesbot manual no Kommo que dispara webhook `POST /webhook/contorno-objecao-kommo` com `lead_id`. Configuração na UI do Kommo, não no n8n.

---

## 4. Roadmap pós-MVP

Os 3 itens abaixo são pós-ativação. Disparar quando agente estiver calibrado (5-10 leads reais com output estável).

- **Plugagem Hub** — registrar em `public.agents` (Supabase Hub `poxolucfvuutvcfpjznt`) com slug `contorno-objecao-kommo`. Configurar `public.agent_access` (departamento Comercial). Padrão análogo: briefing labs, qualificador U.Labs, Sugestor de Datas.
- **Métricas de sucesso** — sample manual de outputs (modelo briefing). Pesquisa interna com vendedores (taxa de aceitação do roteiro pelo vendedor). Conversão de stage no Kommo pós-uso.
- **Stub canônico tech-labs** — criar `tech-labs/ecossistema-tech-labs-canonico/solucoes/ferramenta-contorno-objecao.md`. Mesmo padrão de `ferramenta-briefing-leads.md` e `ferramenta-qualificador-leads.md`.

---

## 5. Histórico

| Data | Evento |
|---|---|
| 2026-05-21 | Brainstorm fechado (12 decisões logadas + Understanding Lock); CLAUDE.md/DESIGN.md/FIELDS.md/README.md criados; snapshot crítico em `_refs/`; primeiro push pro GitHub `UraniaPlanetario/agente-n8n-contorno-objecao` (commit `507cd78`); design técnico detalhado §3 preenchido (pipeline, contrato JSON, pseudocódigo dos 3 nodes Code, payloads MS, pendências de setup); README ampliado com seção "Onboarding Marcos" pedagógica. Pendente: `SYSTEM_PROMPT.md` v0.1 + criação do workflow no n8n (handoff Marcos). |
