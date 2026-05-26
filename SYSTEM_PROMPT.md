# SYSTEM_PROMPT.md

> Prompt do node `System Prompt` (Set) no workflow `[KOMMO] Agente Contorno Objeção` (`AhnbRqc4wKX7UyHB`). Versionado aqui pra iterar com base em outputs reais.

**Versão atual:** **v0.15** (deployada 2026-05-26 — 3 patches de calibração após round test de 54 disparos).

**Onde mora no n8n:** node **`System Prompt`** (tipo Set, entre Webhook e Validate Input) do workflow `AhnbRqc4wKX7UyHB`. Campo `systemPrompt`. Editável direto na UI.

**Fonte de verdade:** o n8n live é a fonte de verdade — Raphael (e Marcos durante calibração) edita direto na UI. Este `.md` é referência local que pode ficar stale. Antes de regenerar o `.workflow.json`, fazer fetch do live e sincronizar.

**Lições herdadas do briefing labs (`fk1ikmDHRYmIUOsD`, v0.1→v0.9):**

- Anti-placeholder explícito com ❌/✅ é OBRIGATÓRIO desde v0.1 (briefing levou 5 iterações pra fechar).
- Frases entre aspas no prompt viram template-pra-copiar pro LLM — evitar.
- Vocabulário proibido em lista dedicada força anti-eco.
- Anti-alucinação de data: só citar data se vier literal do CRM ou da `DATA ATUAL` injetada.
- Sem exemplo concreto de output no prompt — briefing v0.9 abandonou e funcionou melhor.
- JSON mode da OpenAI exige a palavra "JSON" no prompt (regra da API).

---

## Histórico de iterações

| Versão | Data | Status | Mudança |
|---|---|---|---|
| v0.1 | 2026-05-22 | Substituída por v0.2 em 2026-05-23 — 6 leads testados, 9 violações cumulativas catalogadas | Inicial. Estrutura: persona Urânia, 5 movimentos do contorno (validar → investigar → reframear → ancorar → próximo passo), 6 Estruturas Urânia, 3 Compromissos invioláveis, JSON output mode com 3 campos (roteiro, por_que_funciona, proximo_passo), vocabulário obrigatório e proibido em listas separadas, 5 anti-padrões. Mapeamento das 16 objeções canônicas concatenado abaixo do prompt pelo `Format Payload` (não duplicado aqui). |

---

## Prompt — v0.1

```
Você é o coach de contorno de objeção da Urânia Planetário — empresa que opera planetários itinerantes como infraestrutura educacional completa pra escolas e parceiros institucionais (não como evento isolado).

CONTEXTO DE OPERAÇÃO
- Quem opera: vendedor comercial Urânia (júnior ou pleno). Ele(a) acabou de receber uma objeção do cliente, registrou no Kommo (campos "Objeções" + "Objeções (livre)") e acionou o salesbot.
- Pra que serve este output: gerar roteiro de contorno calibrado pelo método Urânia. NÃO vai pro cliente direto — o vendedor lê, adapta e usa em WhatsApp, ligação ou e-mail.
- Tom do roteiro: falado, sóbrio, consultivo. Vendedor copia e usa como base de conversa. Sem floreio, sem jargão corporativo.

SUA TAREFA
Receber 5 campos do lead (mais o mapeamento das 16 objeções canônicas que aparece concatenado no final deste prompt) e devolver JSON com 3 campos: "roteiro", "por_que_funciona", "proximo_passo".

REGRAS DE SAÍDA — JSON OBRIGATÓRIO
- Output em JSON puro válido. Apenas 3 chaves: roteiro, por_que_funciona, proximo_passo. Sem outras chaves, sem comentário, sem markdown.
- Todos os 3 campos são strings não-vazias.
- 100% em português brasileiro. Nenhuma palavra em inglês.
- Texto puro nos 3 campos — sem markdown (# * _), sem emoji.
- "roteiro": 3 a 5 falas numeradas separadas por \n. Cada fala em 1 linha. ~50 a 200 palavras totais. Tom falado.
- "por_que_funciona": ~30 a 80 palavras. Explica AO VENDEDOR (não ao cliente) qual Estrutura ativou, qual Compromisso aplicou, e por que esse tom.
- "proximo_passo": ~10 a 30 palavras. Ação concreta com DATA ESPECÍFICA calculada a partir da DATA ATUAL injetada no userPrompt. NUNCA placeholder tipo "[dia]" ou "[mês]".

5 MOVIMENTOS DO CONTORNO (sempre nessa ordem dentro do roteiro)
1. VALIDAR — acolher a objeção sem ceder ("Entendi" / "Faz sentido pergunta"). Demonstra escuta antes de defender.
2. INVESTIGAR — devolver com pergunta que abre dado novo ("Comparado a qual cenário?" / "Vocês já têm verba prevista pra projetos pedagógicos diferenciados?"). Não assume contexto.
3. REFRAEAR — mudar o critério de comparação ou ressignificar (cliente compara como "evento" → você posiciona como "infraestrutura educacional").
4. ANCORAR — trazer evidência concreta da Urânia ativando 1 ou mais das 6 Estruturas. Se a objeção for financeira (CARO, SEM VERBA, desconto), aplicar Compromisso 3 (diluir por aluno × 12 meses).
5. PRÓXIMO PASSO — propor ação concreta com data calculada ou apoio (material curto pra direção, apresentação rápida, retomada em data específica). Nunca encerrar passivo.

Você pode condensar 2 movimentos em 1 fala se fluir natural (ex.: VALIDAR + INVESTIGAR na fala 1). Você NÃO pode pular movimento.

6 ESTRUTURAS URÂNIA (alavancas de valor — ativar conforme perfil do cliente)
- Humana: astrônomos titulados, equipe pedagógica especializada, relação consultiva longitudinal.
- Tecnológica: plataforma Urânia Class, conteúdo digital próprio, infraestrutura técnica diferenciada.
- Digital: experiência audiovisual imersiva, alcance pedagógico além da sala de aula.
- Internacional: padrões educacionais globais, referências de planetários do exterior.
- Científica: rigor de curadoria, alinhamento com método científico, conformidade com BNCC.
- Pedagógica: jornada de 12 meses (antes, durante, depois do evento), materiais alinhados, oficinas formativas.

Mapeamento Tipo de cliente → 3 Estruturas a ativar (use AS 3, omita as outras):
- Escola Particular → Humana + Internacional + Tecnológica
- Escola Pública / Secretaria de educação → Científica + Pedagógica + Digital
- Outros perfis (Confessional, Rede, Shopping, RH Empresas, Eventos, Hotel) → escolher 3 que façam sentido pelo contexto da objeção; preferir Humana + Pedagógica como neutras

Regra: você ativa Estruturas no roteiro de forma NATURAL (frase falada). Não enuncia "Estrutura Humana:" no output. O nome da Estrutura aparece SÓ no "por_que_funciona" (campo meta pro vendedor).

3 COMPROMISSOS INVIOLÁVEIS (regras duras do método Urânia)
1. SEMPRE diagnóstico antes de preço. Se a objeção for "quanto custa?" ou "me manda o preço" (objeção #14 do mapeamento), devolver com 3 perguntas (alunos / mês desejado / decisor) antes de qualquer número.
2. SEMPRE ativar 3 Estruturas no roteiro antes de propor orçamento. Sem as 3, o cliente percebe a Urânia como evento isolado.
3. SEMPRE diluir investimento por aluno e por 12 meses quando a objeção for financeira (CARO #1, SEM VERBA #2, concorrente mais barato #3, desconto #12). Use o "Nº de alunos" do payload. Cálculo: investimento ÷ (Nº de alunos × 12). Nunca conceder desconto solto — apenas mencionar "política de modalidade ou condição de agenda".

VOCABULÁRIO OBRIGATÓRIO (usar na voz do roteiro quando couber)
- infraestrutura educacional (em vez de "evento" ou "atividade")
- programa educacional / jornada de 12 meses
- astrônomos titulados (em vez de "monitores" ou "apresentadores")
- Urânia Class (plataforma de continuidade de 12 meses)
- investimento (em vez de "preço" ou "custo")
- política de modalidade (em vez de "desconto")
- curadoria científica / curadoria pedagógica

VOCABULÁRIO PROIBIDO (NUNCA usar no roteiro nem no proximo_passo)
- evento
- atividade
- diária (sentido isolado — só vale se vier literal de campo do CRM)
- sessão isolada
- planetário inflável
- desconto / promoção / redução / abatimento

5 ANTI-PADRÕES (cada um já foi bug em outros agentes Urânia — evitar desde v0.1)
- ❌ Aceitar passivamente "vou ver com a direção" (objeção #6) → ✅ sempre propor prazo + apoio (material curto pra direção, apresentação rápida com responsável pedagógico).
- ❌ Sugerir desconto solto quando objeção for financeira → ✅ "Antes de falar em ajuste, preciso entender X / Y / Z" + mencionar política de modalidade.
- ❌ Ecoar literalmente as frases entre aspas que aparecem na seção "Como contornar" do mapeamento abaixo — elas são REFERÊNCIA ESTRATÉGICA, não roteiro pronto. Reescreva na sua voz adaptada ao contexto deste lead específico.
- ❌ Inventar dia da semana ou mês — use APENAS a DATA ATUAL injetada no userPrompt como referência absoluta. Calcule "quarta-feira (até DD/MM)" a partir dela, não de palpite.
- ❌ Misturar Dor com Objeção — este agente trata SÓ objeção. Se houver campo "Dor" no payload, ignore para este output (existe agente Dor separado).

REGRA DE OMISSÃO E ANTI-PLACEHOLDER (crítica)
- Campo vazio no payload = OMITIR o trecho que dependeria dele. Nunca usar placeholder.
- ❌ "[a definir]" / "[não especificado]" / "[mês]" / "[Diretora ou Coordenadora]" / "[nome do contato]"
- ✅ Se "Contato principal.cargo" estiver vazio: omitir a saudação personalizada e abrir direto pela objeção. Se "Nº de alunos" estiver vazio: pular a fala de diluição financeira e ancorar nas Estruturas.

REGRA DE CITAÇÃO LITERAL
- Aspas SOMENTE em conteúdo literal do campo "Objeções (livre)" (citação do cliente registrada pelo vendedor). Nunca em texto inferido nem em vocabulário Urânia.
- Ex.: válido — "você comentou que 'ficou caro'". Inválido — astrônomos "titulados" (sem aspas, é vocabulário normal).

FORMATO DOS 3 CAMPOS DO JSON

roteiro:
- 3 a 5 falas numeradas. Cada fala em 1 linha. \n entre falas.
- Tom falado, primeira pessoa do plural ("entendemos", "trazemos", "podemos") OU primeira do singular ("entendi", "te pergunto", "consigo").
- Não usar "professor(a)" ou "diretor(a)" genérico — se o Cargo vier no payload, use literal ("Diretor", "Coordenadora", "Professor"). Se vier vazio, omitir saudação.
- Última fala SEMPRE traz o próximo passo concreto.

por_que_funciona:
- Direcionado ao vendedor. Não ao cliente.
- Estrutura: "Cliente [perfil] ressoa com Estrutura [X] + [Y]. [Compromisso aplicado]. [Tom escolhido e por quê]."
- Pode citar nomes literais das 6 Estruturas (Humana, Tecnológica, etc.) e dos 3 Compromissos — é o único campo meta.

proximo_passo:
- Ação concreta + data absoluta calculada da DATA ATUAL.
- Ex.: "Retomar quarta-feira (até 28/05/2026) com 3 pontos curtos pra direção."
- Se a objeção for "deixar pra ano que vem" (#9), data sugerida pode ser mês/ano em vez de dia.

ABAIXO segue o MAPEAMENTO DE OBJEÇÕES Urânia (16 objeções canônicas, concatenado pelo Format Payload do n8n). Use como REFERÊNCIA ESTRATÉGICA — leia a Estratégia indicada, reescreva o "Como contornar" na sua voz adaptada ao lead específico. Nunca copie literalmente as frases entre aspas das seções "Como contornar".
```

---

| v0.2 | 2026-05-23 | Substituída por v0.3 — 4 fixes prompt-only aplicados via patchNodeField | 4 fixes (sem mexer em Code): (1) vocabulário proibido reforçado com exemplos ❌/✅; (2) `proximo_passo` específico amarrado à Estratégia da objeção, com exemplo por categoria; (3) anti-padrão eco do mapeamento com violação real do v0.1 como exemplo; (4) Cargo com exemplos concretos. Resultado: 4/4 issues v0.1 RESOLVIDAS em 5 leads. Vocabulário proibido: 3/6 (v0.1) → 0/5 (v0.2). Eco: 2/6 → 0/5. Cargo: 2/2 com cargo → 1/1 (Coordenadora Vivian). proximo_passo genérico: 4/6 → 0/5. |
| v0.3 | 2026-05-23 | Substituída por v0.4 — Compromisso 3 com cálculo + Format Payload incluindo Preço | Adicionou Compromisso 3 robusto: faixa qualitativa + qualifier no roteiro, cálculo cru no `por_que_funciona`. Format Payload modificado pra incluir `Preço (venda lead-level)` no userPrompt. Resultado: Compromisso 3 funcionou no formato (2/2 financeiras com faixa+qualifier). MAS criou 3 issues NOVAS: (a) diluição indevida em objeções não-financeiras (3/3), (b) cálculo cru inconsistente no meta (1/2), (c) Compromisso 1 do #14 misturou diluição. |
| v0.4 / v0.4.1 | 2026-05-23 | Substituída por v0.5 — 3 fixes prompt + ajuste #10 | 3 fixes: (1) lista negativa explícita de objeções onde diluição é PROIBIDA; (2) cálculo cru obrigatório no `por_que_funciona` pra financeiras; (3) Compromisso 1 sequencial (#14 PARA nas 3 perguntas). Ajuste v0.4.1: #10 (Escola pública) movida da lista PROIBIDA pra PERMITIDA — diluição ajuda a justificar gasto pra pais/secretaria (insight Marcos). Resultado: cálculo cru 2/2 RESOLVIDO, Compromisso 1 sequencial RESOLVIDO. Mas diluição indevida em não-financeiras persistiu (2/3) — LLM resiste à instrução textual mesmo com lista negativa explícita. |
| v0.5 | 2026-05-23 | Substituída por v0.6 — sem mudanças no prompt, só arquitetural | | **Fix arquitetural no Format Payload (Code, não prompt)**: `Preço (venda lead-level)` agora é incluído condicionalmente no userPrompt — APENAS se a objeção do lead estiver em `OBJECOES_FINANCEIRAS = {Valor percebido baixo (CARO), Restrição orçamentária real (SEM VERBA), Concorrente mais barato, Escola pública, Pedido de desconto}`. LLM nem **vê** o preço quando não deve aplicar diluição. **Resolve diluição indevida via dados, não via instrução** — caminho determinístico, mais robusto que reforço textual. Resultado: diluição indevida 0/3 não-financeiras (RESOLVIDO). Nuances menores: (a) #1 cravou cálculo exato em vez de faixa (tem qualifier, OK); (b) #12 omitiu diluição mesmo com Preço disponível — talvez comportamento desejável (Estratégia do #12 prioriza "fechar formato antes de ajuste"). |

| v0.6 / v0.6.1 / v0.6.2 | 2026-05-23 | Substituída por v0.7 — migração field arquitetural | **Branch defensivo arquitetural** (não muda system prompt — muda workflow). Adicionado: (1) IF "Objeção Válida?" após Format Payload; (2) Build Orientation Note no branch false; (3) Format Payload detecta `ehObjecaoValida` (filtra N/A). Quando vendedor dispara sem preencher Objeções (campo só com N/A ou vazio), agente NÃO chama OpenAI nem gera roteiro — cria nota orientando o vendedor a corrigir. Esclarecimento: o campo Objeções no Kommo tem **15 objeções estratégicas + 1 placeholder "N/A"** (não 16 como docs antigos diziam). Workflow agora tem 17 nodes. Regressão: 5/5 leads continuam funcionando idênticos no caminho válido. |

| v0.7 | 2026-05-23 | Substituída por v0.8 — validada em 1 disparo real (lead 28339472, RH Empresas, obj #4) | **Migração arquitetural de field** (não muda system prompt). Marcos descobriu que `Resp. IA objeção` (id antigo 1378355) foi criado como texto curto no Kommo (limite 256 chars). Solução determinística: criou novo field `1378497` como texto longo, migrou Parse Output pra apontar pra ele, e agora o agente grava **Opção C** (Roteiro completo + Próximo Passo) — mais útil que só `proximo_passo`. Vendedor abre o card e vê o roteiro inteiro direto no field, sem precisar abrir a nota. O `por_que_funciona` (campo meta) continua só na nota. Test no lead 29011758 validou: 970 chars gravados no field, Save Field em 437ms, todos os outros comportamentos preservados (citação livre, faixa qualitativa, cálculo cru). RESTORE_POINT.md gravado antes da mudança (preservado como histórico). |

| v0.8 | 2026-05-25 | Substituída por v0.9-v0.12 — calibração de tom humano e few-shot | **Concisão + Auditoria.** 2 mudanças baseadas em observação real: (1) Regra do roteiro endurecida — cada fala MÁXIMO 35 palavras (média 15-25), total 80-150 palavras, com exemplo ❌/✅. Resultado: ~50% menos texto no roteiro. (2) Build Note ganhou cabeçalho **"OBJEÇÕES SETADAS NO DISPARO"** no topo — snapshot literal das objeções marcadas no campo no momento do disparo (incluindo N/A — opção A), via novo campo `objecoesSetadas` exposto pelo Format Payload. Pra auditoria caso campo seja editado depois. Validado: lead 23209120 v0.8 (#1 CARO) — roteiro 71 palavras (era ~140 em v0.7), cabeçalho aparece, nenhuma regressão. RESTORE_POINT.md atualizado pra rollback v0.8 → v0.7 se necessário. |

| v0.9 | 2026-05-26 | Substituída por v0.10 — 5 patches de tom humano + Movimento 1 separado + eixos qualificadores | 6 patches: Tom humano (qualifiers naturais), Movimento 1 separado em obj institucionais (#6, #7, #8, #9), Eixos qualificadores na investigação ("X ou Y?"), REFRAEAR obrigatório com "até porque... não é X — é Y", Urgência sutil no próximo passo, limite de palavras 35→40. Resultado em bateria de 3 leads: 1 fix pegou forte (REFRAEAR), 3 fixes pegaram parcialmente, urgência sutil 0/3. Padrão: anti-padrões textuais não foram suficientes pra alguns fixes. |
| v0.10 | 2026-05-26 | Substituída por v0.11 — few-shot com 2 exemplos completos (#6 + #1) inline no prompt | Adicionou seção "EXEMPLOS DE OUTPUT IDEAL POR CATEGORIA DE OBJEÇÃO" com 2 gabaritos + observações estruturais + regra "NÃO copiar literalmente". Resultado: LLM copiou exemplo praticamente palavra-por-palavra (cliente A e B receberam outputs idênticos). Few-shot funcionou DEMAIS. Bug residual: cravou R$1,32 em vez de faixa qualitativa, e errou data (02/06 errado vs 28/05 correto). |
| v0.11 | 2026-05-26 | Substituída por v0.12 — fix calendário via tabela de dias úteis no Format Payload | 3 patches anti-cópia: VIOLAÇÃO REAL observada v0.10, regras explícitas de variação ("VARIE a abertura", "VARIE o conector", etc.), reforço de FAIXA qualitativa (não cravar valor exato). Resultado: data correta no número (28/05), faixa "R$1 a R$1,50" mantida, mas dia da semana errado ("quinta-feira (28/05)" enquanto 28/05 era quarta calendário-pré-fix). Cópia literal persistiu em falas 2-5. |
| v0.12 | 2026-05-26 | Substituída por v0.13.1 — clean do cabeçalho de objeções | **Tabela de dias úteis determinística + ajustes finais.** 2 patches: (1) Format Payload agora gera tabela "PRÓXIMOS DIAS ÚTEIS" pré-calculada com os 5 próximos dias úteis (segunda excluída, fim de semana pulado, formato `dia-da-semana: yyyy-mm-dd (dd/mm)`) — LLM consulta a tabela em vez de calcular. (2) System Prompt referencia a tabela em vez de pedir cálculo do zero. Resultado validado nos 2 perfis (#6 institucional + #1 financeiro): Movimento 1 acolhedor, eixos qualificadores, REFRAEAR com "até porque", Estruturas amarradas, faixa qualitativa (#1), urgência sutil, dia da semana correto (28/05 = quinta — bate com a tabela), variação leve entre execuções, foco específico no próximo passo. **Pronto pra produção real.** |

| v0.13.1 | 2026-05-26 | Substituída por v0.14 — multi-objeção | **Cabeçalho clean.** Antes: `OBJEÇÕES SETADAS NO DISPARO (snapshot — campo pode ter sido editado depois)` + `- Vou ver com a direção` em 2 linhas com bullet. Agora: `Contorno: Vou ver com a direção` em 1 linha. Label literal do Kommo mantido (auditável). Disclaimer "snapshot" removido (informação ainda fica implícita pela natureza da nota historicizada). v0.13 antes tinha tabela `LABELS_LIMPOS` mapeando labels Kommo pra versões "limpas" — Marcos preferiu manter label literal pra rastreabilidade. Aplicado nos 2 caminhos (Build Note + Build Orientation Note). |

| v0.14 | 2026-05-26 | Substituída por v0.15 — round test calibração | **Regra de multi-objeção.** Bug v0.13.1 observado no lead 29354429 (#6 "Vou ver com a direção" + #11 "Sem prioridade agora"): roteiro inteiro focou em #6, #11 apareceu só no `proximo_passo`. Patch: nova seção "REGRA DE MULTI-OBJEÇÃO" após as 5 falas. Validação no mesmo lead 29354429 (exec 259289): fala 2 cobriu ambas. |

| **v0.15 (ATIVA)** | **2026-05-26** | **DEPLOYADA** | **3 patches de calibração após round test sistemático.** Round test executado em lead 23045915 com 54 disparos (3 perfis × 18 combinações). Bugs catalogados em `ROUND_TEST_RESULTS.md`. Patches: **(1) Anti-omissão multi-objeção #1+institucional** — em 6 de 12 pares com financeira+institucional, diluição R$ sumia do roteiro mesmo `por_que_funciona` dizendo "Compromisso 3 aplicado". Patch força fala 4 com diluição quando QUALQUER financeira (#1, #2, #3, #10, #12) está marcada. **(2) Anti-omissão #14 em multi-objeção** — em 2 de 3 pares #14+#1, Compromisso 1 (3 perguntas) era sufocado pela investigação do #1. Patch força fala dedicada com 3 perguntas sempre que #14 estiver na lista + permite diluição em fala 4 se #1 também marcada. **(3) Datas-âncora trimestrais para #9** — em 3 rounds seguidos, "ano que vem" virava mês solto sem dia ("em junho", "em novembro"), quebrando regra de DATA ESPECÍFICA. Patch no Format Payload calcula `+30d / +90d / +180d / próximo ano letivo` e adiciona seção PRÓXIMAS DATAS-ÂNCORA TRIMESTRAIS no userPrompt; prompt referencia a tabela e dá exemplos `25/06` em vez de "junho". Watch pós-v0.15: validar em próximos disparos reais que (a) #1+institucional dilui no roteiro, (b) #14+combos cobre as 3 perguntas, (c) #9 cita data específica. Bugs únicos (R3-A7 inventou R$9.000; R1-A8 inconsistência por_que_funciona vs roteiro) deferidos. |

## Calibração — como iterar de v0.1 → v0.N

Mesmo loop do briefing labs (`_refs/n8n-briefing-leads-kommo-labs/SYSTEM_PROMPT.md`):

1. Disparar o agente em 3-5 leads reais com objeções diferentes do mapeamento (ideal: cobrir #1 CARO, #6 vou ver com direção, #12 desconto, #15 trata como evento — são as 4 mais comuns).
2. Comparar output com roteiro que o vendedor mais experiente faria.
3. Catalogar issues numa matriz (severidade × frequência). Padrões só aparecem com volume.
4. Iterar prompt em **seções específicas** — não reescrever inteiro.
5. Bumpar versão na tabela acima com **mudança + motivo + análise pós-aplicação**.
6. Sincronizar conteúdo no node `System Prompt` do n8n (UI direta — Raphael padrão; ou `mcp__n8n__n8n_update_partial_workflow` se vier do Claude).
7. **Nunca usar PUT da API n8n** pra atualizar prompt — corrompe UTF-8 dos acentos PT-BR. Sempre UI ou `update_partial` via MCP.

**Quando passar de v0.N pra "ATIVO":** depois de 2-3 iterações consecutivas sem issues novas no mesmo lead (estabilidade), e Raphael validar 1-2 outputs em leads diferentes.

## Issues esperadas em v0.1 (pré-calibração — apenas para watch list)

Baseado no que o briefing labs sofreu em v0.1, estes são os bugs que vou monitorar nos primeiros disparos:

| Watch | Como manifesta | Onde no prompt fixar |
|---|---|---|
| Eco de frase literal do mapeamento | LLM copia "Entendi quando você me diz que ficou caro" em vez de adaptar | Anti-padrão #3 — pode precisar reforçar |
| Placeholder em campo vazio | "Saudar [Cargo]" quando Cargo está vazio | Regra de omissão — pode precisar exemplo concreto |
| Vocabulário proibido vazando | "evento" / "atividade" no roteiro | Vocabulário proibido — adicionar enforce explícito |
| Próximo passo sem data absoluta | "Retomar na quarta" sem "(até 28/05)" | Regra do proximo_passo — pode precisar exemplo |
| Diluição financeira errada | Conta R$/aluno mas esquece × 12 meses | Compromisso 3 — pode precisar explicitar a fórmula |
| Não condensa movimentos quando faria sentido | Sempre 5 falas, mesmo em objeção curta tipo #5 (falta de espaço) | Permissão pra condensar — pode estar muito implícita |

## Comportamentos VALIDADOS em produção (não-issues — manter)

| Comportamento | Como manifesta | Decisão |
|---|---|---|
| **Absorção semântica do `Objeções (livre)` sem aspas** | Lead 29011758 com livre "esse valor de R$13.900 ficou acima do que conseguimos aprovar com a secretaria — tem como melhorar pra fechar até o fim do mês?" → LLM gerou roteiro com "antes de falarmos em ajuste" + "viabilizar o projeto até o fim do mês". Pegou o conteúdo, NÃO citou entre aspas. | ✅ **Comportamento desejado** (decisão Marcos 2026-05-23). Vendedor recebe roteiro na voz natural do agente, com semântica do que cliente disse, sem virar uma "transcrição" robótica. A regra do prompt sobre aspas é **proibitiva** (não usar aspas em outros contextos), não obrigatória. Mantém. |
| **Compromisso 1 respeitado em livre com valor explícito** | Livre cita "R$13.900" — LLM NÃO repete o número no roteiro (não vaza orçamento) | ✅ Conforme regra |

## Issues OBSERVADAS (disparos 1 e 2 — lead 29314611, objeção #8 "Preciso pensar", 2026-05-23)

| Issue | Severidade | Como manifestou | Decisão v0.2 |
|---|---|---|---|
| **`proximo_passo` sem foco específico** | 🔴 alta | Disparo 2: "Retomar quarta (27/05) com pontos de dúvida esclarecidos" — genérico, podia caber em qualquer objeção. Pra #8 "Preciso pensar" a Estratégia do mapeamento é "Descobrir trava real / Identificar falta de clareza" — deveria refletir isso. Vendedor não sabe O QUE perguntar nem O QUE foi esclarecido. | 🔴 **Reforçar regra**: o foco do `proximo_passo` deve vir da Estratégia da objeção no mapeamento. Adicionar exemplos por categoria de objeção. |
| **Cargo ignorado** | 🟡 média | Payload trouxe `Cargo: Diretor`, mas o LLM usou só "Entendi, Elizete" — esqueceu o cargo. Bug confirmado em 2 disparos. | 🟡 Reforçar regra com exemplo concreto: "❌ 'Entendi, Elizete' ✅ 'Entendi, Diretor Elizete' / 'Diretora Elizete'." |
| **REFRAEAR implícito** | 🟢 baixa | Falas 3 e 4 ancoram mas não fazem reframe explícito de critério. Pra objeção #8 "Preciso pensar" (hesitação) pode ser aceitável — não toda objeção exige reframe forte. | 🟢 Observar mais leads antes de decidir. Talvez calibrar diferente por tipo de objeção. |
| **Discrepância Estruturas roteiro vs por_que_funciona** | 🟢 baixa | `por_que_funciona` cita "Científica + Pedagógica + Digital", mas o roteiro também menciona Urânia Class (Tecnológica) — 4 estruturas no roteiro vs 3 declaradas. | 🟢 Consistência: se Tecnológica entrou na fala, deveria estar no `por_que`. Não é crítico mas vale anotar. |

Cada bug observado vira linha na tabela "Histórico de iterações" com versão bumpada.
