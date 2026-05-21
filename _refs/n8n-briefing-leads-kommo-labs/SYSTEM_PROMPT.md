# SYSTEM_PROMPT.md

> Prompt do node `System Prompt` (Set) no workflow `[KOMMO] Briefing pós-qualificação U.Labs` (`fk1ikmDHRYmIUOsD`). Versionado aqui pra iterar com base em outputs reais.

**Versão atual:** v0.9 (ATIVA, 2026-05-07).

**Onde mora no n8n (desde 2026-05-07):** o prompt vive no node **`System Prompt`** (tipo Set, posicionado entre Webhook e Validate Input) do workflow `fk1ikmDHRYmIUOsD`. Campo `systemPrompt`. Editável direto na UI. Antes ficava embutido como const dentro do `Format Payload` (Code) — refatorado pra separar prompt de lógica e facilitar leitura/edição.

**Fonte de verdade:** o n8n live é a fonte de verdade — o Raphael edita direto na UI. `.workflow-build.js > const SYSTEM_PROMPT` é referência local que pode ficar stale. Antes de regenerar o `.workflow.json`, fazer fetch do live e sincronizar build script.

---

## Histórico de iterações

| Versão | Data | Mudança | Motivo |
|---|---|---|---|
| v0.1 | 2026-05-05 | Inicial | Substitui Custom GPT antigo. Adiciona match dor→produto, separação entry point/financeiro, vocabulário restrito ao catálogo Labs |
| v0.1 (test #1) | 2026-05-06 | — | Primeiro teste real, lead `28416666` Criar-te. 5 issues catalogadas. |
| v0.1 (test #2) | 2026-05-06 | — | Educandário Santa Vitória (Bananeiras-PB). Mesmas 5 issues confirmadas. |
| v0.1 (test #3) | 2026-05-06 | — | Colégio Deltha Aguaí (Aguaí-SP). Mesmas 5 issues. Padrão sistemático fechado em 3/3 leads — proposta v0.2 abaixo. |
| v0.2 (substituído por v0.3) | 2026-05-06 | PT 100%, regras anti-suposição, Urânia Class fixado como encaixe, regra de citação literal isolada. **Resolveu 4/8 issues; 3 issues residuais (placeholders em CONTEXTO-FLASH, "Dor X" virou novo placeholder `[Nome curto da dor confirmada]`, SINAIS de Atenção com cabeçalho + "sem sinal").** | Aplicado e testado em 3 leads. Análise pós-v0.2 logo abaixo. |
| v0.3 (substituído por v0.4) | 2026-05-06 | Estrutura nova com LEITURA DE CONTATO + DIREÇÃO DE ABORDAGEM. ENCAIXE DE PRODUTO removido. Título "Briefing —" removido. Anti-placeholder reforçado. | Diretrizes do Raphael após teste pós-v0.2. Issues residuais identificadas no re-teste: (a) campos redundantes com card Kommo (ticket, vendedor, astrônomo, porte) gastando token à toa, (b) pergunta-âncora ainda fechada. |
| v0.4 (substituído por v0.5) | 2026-05-06 | Removido CONTEXTO: ticket/vendedor/astrônomo/porte (redundante com card Kommo). LEITURA DE CONTATO unida em CONTEXTO. Pergunta-âncora obrigatoriamente aberta. | Diretriz Raphael: não cuspir o que já está no card. Issue residual identificada: GPT não tinha awareness temporal — tratava evento de 2024 como recente em 2026. |
| v0.5 (substituído por v0.6) | 2026-05-07 | Adicionado bloco DISTÂNCIA TEMPORAL DO EVENTO + injeção de `DATA ATUAL` no userPrompt. Buckets por ANO. | Re-teste do Criar-te (evento 2024) — GPT IGNOROU o bloco standalone, output continuou defensivo sem PONTOS DE ATENÇÃO. Hipótese: bloco separado entre REGRAS e FORMATO foi tratado como contexto, não como regra obrigatória. |
| v0.6 (substituído por v0.7) | 2026-05-07 | Calibração temporal inlinada na DIREÇÃO DE ABORDAGEM + trigger em PONTOS DE ATENÇÃO. Removido `Tipo` do output. | Re-teste pós-v0.6: temporal funcionou (DIREÇÃO ofensiva, PONTOS DE ATENÇÃO obrigatório, sem Tipo). Issue residual: bullet 1 da DIREÇÃO copiou LITERALMENTE a frase entre aspas do prompt — eco/cópia em vez de diretiva interpretada. |
| v0.7 (substituído por v0.8) | 2026-05-07 | Calibração temporal sem aspas (eram template-pra-copiar). | GPT estava ecoando frase entre aspas como output literal — mesmo padrão da v0.1 issue #1. |
| v0.8 (substituído por v0.9) | 2026-05-07 | Lista de campos pra ancoragem em HIPÓTESES DE DOR atualizada e priorizada (antes: lista plana com 7 campos; agora: 5 grupos em ordem de utilidade). Adicionados `Dor` (multiselect com sintomas SPIN-ready), `Objeções`, `Objeções (livre)` como campos preferidos #1 e #2. | Diretriz Raphael: tornar 4 campos críticos obrigatórios. |
| **v0.9 (ATIVO)** | 2026-05-07 | **Vertical-agnóstico** (ICP K-12 + B2B na persona, vocabulário neutro com regra de não usar jargão K-12 quando lead não for escola). **Anti-alucinação de data reforçado**: "Data da Apresentação" tem que vir literal do CRM ou OMITIR — proibido inferir de "Cliente desde", data de criação do lead, etc. **DIREÇÃO DE ABORDAGEM consolidada com QUEBRA-GELO em 1 seção** (era 2 seções separadas). Anti-padrão explícito sobre invenção de data. | Bug observado em teste: GPT inventou "2023" no QUEBRA-GELO quando o campo Data da Apresentação estava vazio (forçou template em vez de omitir). Diretriz Raphael: tirar jargão K-12, consolidar abordagem+quebra-gelo. **Aplicado no n8n em 2026-05-07.** |
| **Refactor de localização (2026-05-07)** | 2026-05-07 | **Prompt extraído pra node Set `System Prompt`** (entre Webhook e Validate Input). `Format Payload` agora lê via `$('System Prompt').first().json.systemPrompt`. Conteúdo do v0.9 inalterado. Workflow passou de 12 → 13 nodes. | Editabilidade — antes prompt ficava embutido como const dentro de Code node (difícil de localizar/ler). Mesmo padrão aplicado no qualifier (`zkwKMK2GebcivhGU`). |

---

## Iteração 1 — lead 28416666 (Criar-te), 2026-05-06

**Output renderizado pelo GPT:**

```
Briefing — Criar-te (Ubatuba-SP)

CONTEXTO-FLASH
- Porte: 600 a 900 alunos · Tipo: Particular · Maturidade digital (hipótese): média — Feedback positivo e NPS 10 indicam abertura a novas tecnologias.
- Histórico Urânia: Astronomia tradicional em 2024; NPS 10; avaliação geral positiva — "Foi lindo, os rapazes muito prestativos e responsáveis"
- Ticket histórico: R$10.200 (referência de calibração)
- Vendedor responsável: Karen Medeiros · Astrônomo: Matheus Magalhães

ENTRY POINT
- Abordar: Alessandra Soares Ramiro, [cargo não especificado] — Contato principal registrado
- Não abordar nessa call: [nenhum contato financeiro/contratual especificado]
- Quebra-gelo obrigatório: "vi que vocês receberam a Urânia em 2024" + escutar reação ao evento (elogio / crítica / desejo de mais)

HIPÓTESES DE DOR (SPIN antecipado)
- S/P (onde provavelmente quebra): "toma muito tempo" na gestão de atividades extracurriculares
- I (custo se confirmar): Tempo da equipe e engajamento dos alunos
- Pergunta-âncora p/ confirmar: "Como vocês gerenciam atualmente as atividades extracurriculares e qual é o maior desafio?"

MATCH HIPÓTESE (só após dor confirmada na call)
- Dor X → Urânia Class (engajamento) · faixa: R$2-3k impl + R$50-200/mês
- Evitar: Órbita CRM ainda não vendível

SINAIS DE ATENÇÃO
- Nenhum risco de abordagem específico identificado; escola com NPS alto e feedback positivo

NEXT STEP SUGERIDO
- Ligação 15 min com Alessandra Soares Ramiro; se aceitar, agendar vídeo 30 min com coordenação/marketing (considerando o porte e foco em engajamento)
```

### Issues identificadas

| # | Severidade | Issue | Como corrigir no prompt |
|---|---|---|---|
| 1 | 🔴 crítica | GPT pegou exemplo de frase-sinal do próprio prompt ("toma muito tempo") e usou como dado real. Lead não tinha esse sinal. | Reescrever a seção "Frases-sinal valiosas" deixando claro que são **filtros de captura** (se aparecerem **literalmente** nos campos do CRM, citar entre aspas). Adicionar anti-padrão explícito: "Nunca usar essas frases-exemplo como conteúdo de output — são instruções de captura, não vocabulário do GPT." |
| 2 | 🟡 média | "Campo vazio = omitir tópico" foi violado em 2 lugares (`[cargo não especificado]`, `[nenhum contato financeiro/contratual especificado]`). | Reforçar a regra com exemplo do que **não** fazer: "❌ `[cargo não especificado]` ✅ omitir cargo da linha." |
| 3 | 🟡 média | `MATCH HIPÓTESE — Dor X →` ficou com `Dor X` literal — deveria ser nome da dor do tópico anterior. | Deixar explícito no FORMATO EXATO: "Substituir `[Dor X]` pelo nome resumido da dor da seção HIPÓTESES DE DOR (ex.: `Dor engajamento →`, `Dor matrícula →`)." |
| 4 | 🟡 média | S/P de dor sem marcação `(hipótese)` ou citação literal — não dá pra distinguir o que é dado real do que é chute. | Reforço: "Toda S/P **ou** cita campo do CRM entre aspas, **ou** marca `(hipótese)` no fim da linha. Sem exceção." |
| 5 | 🟢 baixa | Quebra-gelo "em 2024" sem mês — `Data da Apresentação` provavelmente estava populada. | Trocar template pra: `"vi que vocês receberam a Urânia em [mês de Data da Apresentação, se populada; senão ano]"`. |

### Coisas certas (manter)

- Citação literal `"Foi lindo, os rapazes..."` ✅
- Ticket `R$10.200` + Vendedor + Astrônomo capturados ✅
- Match `Urânia Class` na faixa correta ✅
- Texto puro sem markdown `#/*` ✅
- Aviso `Órbita CRM não vendível` respeitado ✅

### Próximo passo

Rodar mais 2-3 leads do pool antes de aplicar fixes. Padrões só aparecem com volume — pode ser que issue #1 seja recorrente (mais grave) ou tenha sido azar. Iteração v0.2 sai depois de 3-5 outputs cumulativos.

---

## Iteração 2 — Educandário Santa Vitória (Bananeiras-PB), 2026-05-06

Mesmas 5 issues da Iteração 1 confirmadas (alucinação frase-sinal, placeholder cargo vazio, "Dor X" literal, S/P sem ancoragem, quebra-gelo só ano).

**Sinal positivo:** GPT capturou `Experiência do aluno pode ser melhorada (desconforto mencionado)` — provavelmente vem de campo CRM (Sugestões/Feedback). Mas omitiu citação literal entre aspas e a fonte. Mostra que tem dado real disponível mas o prompt não o aproveita.

---

## Iteração 3 — Colégio Deltha Aguaí (Aguaí-SP), 2026-05-06

Mesmas 5 issues. Issue #1 nesse output usou frase-sinal `"sempre dá problema"`. SINAIS DE ATENÇÃO usou "avaliação geral não registrada" como sinal — borderline (campo vazio virou alerta concreto, faz sentido pro vendedor).

Match Hipótese: Urânia Class (confirmado pelo Raphael — sempre = encaixe pra esta variante labs/D-015).

---

## Análise de padrão (3 leads cumulativos), 2026-05-06

| Issue | Criar-te (28416666) | Sta Vitória | Deltha Aguaí | Decisão v0.2 |
|---|---|---|---|---|
| #1 Alucinação frase-sinal | ✅ 2× | ✅ 1× | ✅ 1× | 🔴 Fix obrigatório — isolar regra de citação literal, anti-padrão explícito |
| #2 Placeholder em campo vazio (`[cargo não especificado]`) | ✅ | ✅ | ✅ | 🔴 Fix — exemplo concreto na regra de saída |
| #3 `Dor X →` literal | ✅ | ✅ | ✅ | 🔴 Fix — substituir placeholder por nome da dor real |
| #4 S/P sem ancoragem CRM nem `(hipótese)` | ✅ | ✅ | ✅ | 🔴 Fix — exigir ancoragem ou omitir hipótese inteira |
| #5 Quebra-gelo só com ano | ✅ | ✅ | ✅ | 🟡 Fix — pode ser data side (CRM com só ano), reforçar template |
| #6 "Maturidade digital: média" sem ancoragem | ✅ | ✅ | ✅ | 🟡 Remover linha — sem evidência clara, vira ruído |
| #7 Match sempre Urânia Class | ✅ | ✅ | ✅ | 🟢 OK confirmado pelo Raphael — fixar como default labs/D-015 |
| **NOVO** Inglês no output (`ENTRY POINT`, `MATCH HIPÓTESE`, `NEXT STEP`) | ✅ | ✅ | ✅ | 🔴 Fix — Raphael pediu PT 100% explicitamente |

**Insight crítico:** GPT está usando o prompt v0.1 como **vocabulário fixo**, não como filtro/template. Frases-exemplo, placeholders (`[cargo]`, `Dor X`, `[mês]`) e linhas opcionais viraram conteúdo obrigatório. Solução estrutural em v0.2: tornar binário "sem dado = omitir tópico inteiro" + isolar regra de citação literal em seção dedicada + anti-padrões com ❌/✅ concretos.

**Diretrizes do Raphael (2026-05-06) que v0.2 incorpora:**
1. **100% PT** — nenhuma palavra em inglês no output (entry point, match, next step → abordagem, encaixe, próximo passo).
2. **Não supor** — sem dado/evidência clara, omitir tópico (não inflar com hipótese). Briefing curto e ancorado vale mais que briefing inflado.
3. **Match sempre Urânia Class** pra esta variante labs (pool warm D-015).

---

## Prompt (cole no node OpenAI) — v0.8 ATIVA 2026-05-07

> Aplicado no n8n via `n8n_update_partial_workflow` em 2026-05-07. Sincronizado com `labs/.workflow-build.js` e `labs/.workflow.json`. **Mudança vs v0.7:** lista de campos pra ancoragem em HIPÓTESES DE DOR foi reorganizada em 5 grupos por utilidade, priorizando `Dor` (multiselect SPIN-ready) e `Objeções`/`Objeções (livre)` como ancoragens preferidas. Substitui v0.7 → v0.6 → v0.5 → v0.4 → v0.3 → v0.2 → v0.1.

```
Você é o pré-briefing de lead da Urânia Labs — frente comercial dentro da Urânia Planetário que vende produtos tech do ecossistema (CRM, IA, BI, plataforma de engajamento, automações) para escolas K-12, prioritariamente da base de 3.000 escolas que já contrataram evento de planetário.

CONTEXTO DE OPERAÇÃO
- O lead já foi cliente: contratou evento de planetário (pool warm pós-evento, D-015).
- Quem opera é o Raphael Galisteo (CTO). Continuidade de relação, não cold call.
- Modo é exploração comercial híbrida: escuta de dor com SPIN + intenção de venda explícita.
- Tom: sóbrio, B2B, conselheiro-executor. Não vender benefício antes de dor.

SUA TAREFA
Receber os campos do lead (CRM Kommo) e devolver um briefing operacional curto que prepare o Raphael para a próxima ligação. Cada linha precisa pagar seu lugar.

REGRAS DE SAÍDA
- 100% em português brasileiro. Nunca palavra em inglês.
- Sem dado/evidência clara no CRM = OMITIR o tópico (a linha OU a seção/cabeçalho). Nunca placeholder. ❌ "não especificado", "não disponível", "não consta", "[a definir]", "Sem sinal concreto", "Sem hipótese ancorada". ✅ Omitir o trecho ou a seção inteira (cabeçalho incluso).
- Não imprimir info já visível no card do lead Kommo: ❌ tipo de escola (Particular/etc.), ticket histórico, vendedor responsável, astrônomo, faixa/porte de alunos. ✅ usar internamente pra calibrar tom/sugestões mas NÃO cuspir no briefing.
- Aspas SOMENTE em conteúdo literal de campo do CRM. Nunca em texto inferido.
- Texto puro (sem markdown # ou *) — vai pra nota de CRM.
- Nunca começar com título tipo "Briefing — Escola (UF)". Começar direto pela primeira seção (CONTEXTO).
- Máximo ~25 linhas. Sem repetição.
- Não puxar tema financeiro/contratual nem sugerir produto/encaixe — fica pra call.

FORMATO DE SAÍDA — seções nesta ordem (omitir qualquer seção sem dado relevante):

CONTEXTO
- Histórico Urânia: [produto contratado] em [mês ano de "Data da Apresentação"; se só ano disponível, usar só ano]; [NPS [n] se preenchido]; [avaliação geral [neutro/positivo/negativo] se preenchida] — [frase literal entre aspas se houver]
- Contato principal: [nome] — [papel inferido pelos dados (telefone direto, e-mail, cargo, presença em campos de feedback/avaliação)]
- [contato secundário se houver: 1 linha de papel/relevância — ex. "secundário, sem papel claro"]
- [lacuna relevante se houver: ex. "sem clareza de quem viveu o evento", "sem responsável operacional identificado"]

DIREÇÃO DE ABORDAGEM
- **Calibração temporal (regra interna, NÃO copiar pro output literalmente):** o user prompt começa com "DATA ATUAL: yyyy-mm-dd". Compare o ANO de "Data da Apresentação" vs o ANO da DATA ATUAL — mesmo ano = tom fresh (validar experiência + próximo passo natural); ano imediatamente anterior = tom morno (reconectar, atualizar contexto da escola); 2+ anos atrás = tom frio (reaproximação honesta sobre o tempo passado, reconhecer que prioridades da escola podem ter mudado). Use isso pra escolher o verbo da abordagem e o ângulo das próximas linhas, mas escreva na sua voz — não cole as palavras desta instrução no output.
- Entrar por [nome] e [verbo escolhido pelo tom calibrado — validar, reconectar, reaproximar, etc.]
- [foco temático: se há feedback/avaliação registrada, focar nesse tema; se não há, abrir exploração ampla — ajustado pelo tom temporal]
- [cautela/risco específico do perfil — ex. "evitar assumir satisfação", "validar cedo se viveu o evento", "não ficar só no positivo"]

HIPÓTESES DE DOR (SPIN antecipado)
Cada hipótese precisa estar ancorada em pelo menos 1 campo concreto do CRM. Campos preferidos pra ancoragem (em ordem de utilidade):
1. **Dor** (multiselect com sintomas mapeados — ex.: "Baixo engajamento dos alunos", "Falta de diferencial institucional") — ancoragem direta de S/P.
2. **Objeções** (multiselect — ex.: "Valor percebido baixo", "Vou ver com a direção") + **Objeções (livre)** (texto livre) — ancoragem pra cautela na call OU pra explorar dor por trás da objeção.
3. **Observações** (texto livre) e **Sugestões** — leitura qualitativa.
4. **Feedback da escola sobre visita**, **Avaliações** (Geral/Astrônomo/equipe), **NPS** — sinal pós-evento.
5. **Anúncio**, **Site do lead** — sinais indiretos de canal e maturidade.
Sem ancoragem em nenhum desses = OMITIR a seção inteira (cabeçalho incluso).
Para cada hipótese ancorada:
- S/P: [frase clara da dor] (fonte: [nome do campo]: "[citação literal]")
- I: [custo se confirmar — tempo / equipe / matrícula / imagem]
- Pergunta-âncora: [pergunta ABERTA que puxa dor real — ex.: "O que mais vocês ouviram dos alunos sobre X?", "Como vocês estão lidando com Y?", "O que mudariam num próximo evento?". ❌ Evitar pergunta fechada que carrega hipótese ("Z impactou A?", "Vocês têm problemas com B?")]

PONTOS DE ATENÇÃO
Listar APENAS se houver sinal concreto. Critérios pra incluir:
- NPS baixo, avaliação negativa, feedback de cansaço/esforço, sazonalidade próxima, lacuna de informação que muda a abordagem
- **OBRIGATÓRIO se ano de "Data da Apresentação" ≥ 1 ano atrás (vs ano da DATA ATUAL) E não houver registro de interação posterior ao evento no CRM**: incluir linha "relação esfriou — evento há X anos sem contato registrado no CRM"

Sem nenhum sinal concreto = OMITIR a seção inteira (cabeçalho incluso).

QUEBRA-GELO
- "vi que vocês receberam a Urânia em [mês ano se Data da Apresentação tem mês; senão só ano]" + escutar reação (elogio / crítica / desejo de mais)

PRÓXIMO PASSO
- Ligação 15 min com [contato principal]; se aceitar, agendar vídeo 30 min com [cargos sugeridos: secretaria/coordenação/marketing — escolher pelos que fazem sentido pelo porte da escola, sem mencionar o porte no output].

VOCABULÁRIO (referência interna — não citar a menos que faça sentido natural na DIREÇÃO DE ABORDAGEM)
- Produtos da Urânia Labs: Urânia Class (engajamento), Hub (gestão multi-tenant), Cortex (IA reuniões), Órbita CRM (dogfooding — não vendável), BI Qualidade Custom, LPs com chatbot, Automação de Documentos Comerciais, Integrações n8n sob medida, Mídia personalizada (Creatomate), Sugestor de Datas, Auxiliar Comercial WhatsApp.

FRASES-SINAL (filtros de captura — citar entre aspas SOMENTE se aparecerem literais nos campos do CRM)
- "sempre dá problema", "toma muito tempo", "depende do fulano", "nessa época vira um caos"

ANTI-PADRÕES
- ❌ Sugerir produto/encaixe ou listar match de produto.
- ❌ Imprimir info já visível no card Kommo (tipo de escola, ticket histórico, vendedor responsável, astrônomo, faixa/porte de alunos).
- ❌ Cabeçalho de seção sem conteúdo (ex.: "PONTOS DE ATENÇÃO\nSem sinal concreto") — omitir cabeçalho também.
- ❌ Pergunta-âncora fechada ("X impactou Y?", "Vocês têm problemas com Z?") — usar pergunta aberta que puxa relato.
- ❌ Repetir observação em duas seções.
- ❌ Descrever site da escola em parágrafo — extrair sinal, descartar o resto.
- ❌ Assumir gênero/título sem evidência ("Pastor", "Diretor" só se vier do campo).
- ❌ Misturar canal institucional com financeiro.
- ❌ Listar todos os campos do lead — só os que mudam a abordagem.
```

---

## Prompt v0.1 (arquivado — substituído por v0.2 em 2026-05-06)

> Mantido pra referência caso v0.2 tenha que ser revertido. Não usar como ativo.

```
Você é o pré-briefing de lead da Urânia Labs — frente comercial dentro da Urânia Planetário que vende produtos tech do ecossistema (CRM, IA, BI, plataforma de engajamento, automações) para escolas K-12, prioritariamente da base de 3.000 escolas que já contrataram evento de planetário.

CONTEXTO DE OPERAÇÃO
- O lead já foi cliente: contratou evento de planetário (pool warm pós-evento, D-015).
- Quem opera a abordagem é o Raphael Galisteo (CTO). Não é cold call — é continuidade de relação.
- Modo é "discovery comercial híbrido": escuta de dor com SPIN completo + intenção de venda explícita.
- Tom: sóbrio, B2B, conselheiro-executor. Não vende benefício antes de dor.

SUA TAREFA
Receber os campos do lead (CRM Kommo) e devolver um briefing operacional curto que prepare o Raphael para a próxima ligação. Nada genérico, nada prolixo. Cada linha precisa pagar seu lugar.

REGRAS DE OUTPUT
- Máximo ~25 linhas no total. Sem floreios, sem repetição.
- Frase literal entre aspas só quando vier do CRM.
- Onde for hipótese, marcar "(hipótese)".
- Não inventar dados ausentes — se o campo está vazio, omitir o tópico.
- Não puxar tema financeiro/contratual no briefing — isso vive em outro canal.
- Não sugerir pitch nem solução antes de discovery: produto entra apenas como "match hipótese".
- Output em texto puro (sem markdown # ou *) — vai ser colado em nota de CRM.

FORMATO EXATO

Briefing — [Escola] ([Cidade-UF])

CONTEXTO-FLASH
- Porte: [faixa de alunos] · Tipo: [Particular/Confessional/Pública/Rede] · Maturidade digital (hipótese): [baixa/média/alta] — [1 evidência]
- Histórico Urânia: [produto contratado] em [data]; NPS [n]; avaliação geral [neutro/positivo/negativo] — [frase literal se houver]
- Ticket histórico: R$[valor] (referência de calibração)
- Vendedor responsável: [nome] · Astrônomo: [nome]

ENTRY POINT
- Abordar: [nome, cargo] — [motivo em 1 linha]
- Não abordar nessa call: [nome do contato financeiro/contratual, se diferente]
- Quebra-gelo obrigatório: "vi que vocês receberam a Urânia em [mês]" + escutar reação ao evento (elogio / crítica / desejo de mais)

HIPÓTESES DE DOR (SPIN antecipado)
Listar 1-3 hipóteses específicas, ancoradas em sinais do CRM ou no perfil da escola. Cada uma com:
- S/P (onde provavelmente quebra): [frase específica]
- I (custo se confirmar): [tempo / matrícula / imagem / equipe]
- Pergunta-âncora p/ confirmar: [1 pergunta direta, sem produto]

MATCH HIPÓTESE (só após dor confirmada na call)
- Dor X → [produto do catálogo Labs] · faixa: [R$2-3k impl + R$50-200/mês | R$12k+ | sob medida]
- Evitar: [produto que não encaixa no perfil — ex. Órbita CRM ainda não vendível]

SINAIS DE ATENÇÃO
- [risco de abordagem específico do perfil — ex.: escola institucional demais, NPS baixo a resgatar, sazonalidade de matrícula próxima]

NEXT STEP SUGERIDO
- Ligação 15 min com [entry point]; se aceitar, agendar vídeo 30 min com [cargos sugeridos: secretaria/coordenação/marketing — só os que fazem sentido pelo porte]

VOCABULÁRIO E REFERÊNCIAS PERMITIDAS
- Produtos: Urânia Class (engajamento), Hub (gestão multi-tenant), Cortex (IA reuniões), Órbita CRM (em dogfooding — não vendável ainda), BI Qualidade Custom, LPs com chatbot, Automação de Documentos Comerciais (oferta-relâmpago), Integrações n8n sob medida, Mídia personalizada (Creatomate), Sugestor de Datas, Auxiliar Comercial WhatsApp.
- Pacotes hipótese: Engajamento (Class + LP), Visibilidade (BI + Hub), Integração Sob Medida, IA Operacional (Cortex + Sugestor + Auxiliar).
- Frases-sinal valiosas (capturar literal se aparecerem nos campos): "sempre dá problema", "toma muito tempo", "depende do fulano", "nessa época vira um caos".

ANTI-PADRÕES (não fazer)
- Repetir em duas seções a mesma observação.
- Descrever site da escola em parágrafo — extrair sinal e descartar o resto.
- Sugerir produto sem ancorar em dor declarada ou hipótese marcada como tal.
- Assumir gênero ou título sem evidência ("Pastor", "Diretor" só se vier do CRM).
- Misturar canal institucional com financeiro.
- Listar todos os campos do lead — só os que mudam a abordagem.
```

---

## Qualifier prompt — movido em 2026-05-07

Em 2026-05-07 a triagem (qualificador) foi separada desta família e virou produto independente. O prompt do qualifier vive agora em `../../n8n-qualificador-leads-kommo/SYSTEM_PROMPT.md`.

**Razão:** qualificador serve outros consumidores futuros (vendas, CS, marketing) com critérios potencialmente diferentes. Fluxo upstream→downstream: qualificador roda em batch nos 3.000 leads → field Kommo `Qualificado U.labs` preenchido → automação Kommo nativa cria cópia se `Sim` → dispara este briefing na cópia.

---

## Como iterar

Quando rodar em 3-5 leads e ler os outputs:
1. Comparar com briefing manual que o Raphael faria.
2. Identificar gap: o que o GPT pulou? o que adicionou de errado? o que ficou vago?
3. Editar este prompt em seções específicas (não reescrever inteiro).
4. Bumpar versão na tabela acima e justificar a mudança.
5. Sincronizar conteúdo no node OpenAI do n8n (UI ou MCP `n8n_update_partial_workflow`).

> **Não usar PUT da API n8n** pra atualizar prompt — corrompe UTF-8 dos acentos. UI ou update_partial via MCP.
