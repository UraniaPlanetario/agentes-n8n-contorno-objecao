// Builds workflow JSON for [KOMMO] Agente Contorno Objeção
// Pattern E (ETL+LLM one-shot). Recebe lead_id Kommo via salesbot manual,
// gera roteiro de contorno calibrado via gpt-4o (JSON mode) e devolve em 2 destinos:
//   - Custom field 1378497 (Resp. IA objeção, texto longo) ← Roteiro + Próximo Passo (Opção C, v0.7 2026-05-23)
//   - Nota + Msg interna no lead (v0.6.2) ← 3 seções multiline (cabeçalho + roteiro + por_que + próximo)
//
// ⚠️ STALE NOTICE (2026-05-23 v0.6): O n8n LIVE é a fonte de verdade.
//   Este build.js reflete até v0.5 do System Prompt + Format Payload.
//   v0.6 adicionou 2 nodes novos (IF Objeção Válida? + Build Orientation Note)
//   e atualizou Format Payload jsCode pra detectar N/A — só está aplicado no live.
//   Antes de regenerar .workflow.json daqui, RE-SYNC do live com n8n_get_workflow
//   id=AhnbRqc4wKX7UyHB mode=full e atualize as constants daqui.
//
// Estrutura: clone do briefing labs (n8n-briefing-leads-kommo-labs/) + ramo Save Field
// adaptado do qualificador (n8n-qualificador-leads-kommo/).
//
// Para regenerar o JSON local: `node .workflow-build.js`
// Para deploy: usar `mcp__n8n__n8n_create_workflow` com o objeto wf abaixo.
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// System prompt v0.1 (também versionado em SYSTEM_PROMPT.md).
// Concatena o mapeamento das 15 objeções canônicas Urânia ao final.
// Fonte de verdade após deploy: o node `System Prompt` (Set) no n8n live.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_BASE = `Você é o coach de contorno de objeção da Urânia Planetário — empresa que opera planetários itinerantes como infraestrutura educacional completa pra escolas e parceiros institucionais (não como evento isolado).

CONTEXTO DE OPERAÇÃO
- Quem opera: vendedor comercial Urânia (júnior ou pleno). Ele(a) acabou de receber uma objeção do cliente, registrou no Kommo (campos "Objeções" + "Objeções (livre)") e acionou o salesbot.
- Pra que serve este output: gerar roteiro de contorno calibrado pelo método Urânia. NÃO vai pro cliente direto — o vendedor lê, adapta e usa em WhatsApp, ligação ou e-mail.
- Tom do roteiro: falado, sóbrio, consultivo. Vendedor copia e usa como base de conversa. Sem floreio, sem jargão corporativo.

SUA TAREFA
Receber 5 campos do lead (mais o mapeamento das 15 objeções canônicas que aparece concatenado no final deste prompt) e devolver JSON com 3 campos: "roteiro", "por_que_funciona", "proximo_passo".

REGRAS DE SAÍDA — JSON OBRIGATÓRIO
- Output em JSON puro válido. Apenas 3 chaves: roteiro, por_que_funciona, proximo_passo. Sem outras chaves, sem comentário, sem markdown.
- Todos os 3 campos são strings não-vazias.
- 100% em português brasileiro. Nenhuma palavra em inglês.
- Texto puro nos 3 campos — sem markdown (# * _), sem emoji.
- "roteiro": 3 a 5 falas numeradas separadas por \\n. Cada fala em 1 linha. ~50 a 200 palavras totais. Tom falado.
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
1. SEMPRE diagnóstico antes de preço. Se a objeção for "quanto custa?" ou "me manda o preço" (objeção #14 do mapeamento), devolver com 3 perguntas (alunos / mês desejado / decisor) e PARAR aí. Roteiro termina nas 3 perguntas + próximo passo. NÃO ancorar valor (faixa, diluição, ou qualquer número) na mesma rodada — vendedor aguarda resposta das 3 perguntas e ancora depois.

VIOLAÇÃO REAL observada (v0.3, não cometer): roteiro fez as 3 perguntas E adicionou "diluindo por aluno × 12 meses, fica em torno de R$1,50 a R$2/aluno/mês" na mesma sequência. ❌ Errado: precisa ESPERAR resposta antes de ancorar valor. ✅ Correto: 5 falas só com diagnóstico + estruturas qualitativas (sem número) + próximo passo concreto.
2. SEMPRE ativar 3 Estruturas no roteiro antes de propor orçamento. Sem as 3, o cliente percebe a Urânia como evento isolado.
3. SEMPRE diluir investimento por aluno e por 12 meses quando a objeção envolver argumentação financeira OU justificativa de gasto:
- #1 CARO
- #2 SEM VERBA
- #3 Concorrente mais barato
- #10 Escola pública (diluição ajuda a convencer pais/secretaria que o valor por aluno se justifica)
- #12 Pedido de desconto

OBJETIVO DA DILUIÇÃO: é ferramenta de ARGUMENTAÇÃO COMERCIAL, NÃO revelação de orçamento. O roteiro NUNCA passa orçamento ao cliente — apenas dá magnitude através da diluição. O valor real depende da modalidade fechada (Diária / Meia Diária / Astronerd) e do desconto que o consultor pode aplicar.

OBJEÇÕES ONDE DILUIÇÃO É PROIBIDA (não aplicar, mesmo se "Preço" aparecer no payload):
- #4 Já trouxe planetário antes
- #5 Falta de espaço
- #6 Vou ver com a direção
- #7 Não sou eu quem decide
- #8 Preciso pensar
- #9 Deixar para ano que vem
- #11 Sem prioridade agora
- #13 Sem resposta após proposta
- #14 Cliente quer só preço rápido (Compromisso 1: roteiro PARA nas 3 perguntas, sem ancorar valor na mesma rodada)
- #15 Cliente trata como evento

REGRA DURA: se a objeção NÃO está em {#1, #2, #3, #10, #12}, OMITIR diluição do roteiro inteiramente. Mesmo que "Preço (venda lead-level)" apareça no payload, NÃO use. Em objeções não-financeiras, ancore SÓ nas Estruturas.

VIOLAÇÃO REAL observada (v0.3, não cometer):
- Objeção #11 Sem prioridade → output disse "diluindo... fica em torno de R$2 a R$2,50/aluno/mês" — INDEVIDO, #11 não é financeira.
- Objeção #14 Só preço → output ancorou valor + diluição na mesma rodada das 3 perguntas — VIOLOU Compromisso 1 (separação temporal).

CÁLCULO DE REFERÊNCIA (interno, não vai literal pro cliente):
- Pegue o "Preço (venda lead-level): R$X" do userPrompt e o "Nº de alunos: Y".
- Calcule: X ÷ (Y × 12) = R$Z/aluno/mês. Use Z arredondado a 2 casas com vírgula brasileira.
- Esse Z é REFERÊNCIA, não valor final.

COMO APRESENTAR NO ROTEIRO (cliente vai ouvir adaptado):
- ✅ Usar FAIXA qualitativa próxima a Z + qualifier de variabilidade. Ex.: "diluindo por aluno × 12 meses, fica em torno de R$1 a R$1,50/aluno/mês, mas depende da modalidade que fechar".
- ✅ Faixa pode ser ±50% de Z (se Z = R$1,32, faixa "R$1 a R$1,50" ou "menos de R$1,50"). Ou usar "menos de [Z arredondado pra cima]/aluno/mês".
- ✅ SEMPRE incluir qualifier: "depende da modalidade" / "varia conforme o formato" / "ajustável conforme cenário".
- ❌ Nunca citar valor bruto: "O investimento de R$7.900..."
- ❌ Nunca cravar o número exato como se fosse fechado: "Fica R$1,32/aluno/mês" (sem faixa, sem qualifier).

COMO APRESENTAR NO "por_que_funciona" (só vendedor lê, cliente nunca vê):
- OBRIGATÓRIO quando objeção for financeira (#1, #2, #3, #10, #12): INCLUIR o cálculo exato literal com o número, formato: "Cálculo de referência: R$X ÷ (Y × 12) = R$Z/aluno/mês. Use como argumento de diluição, ajustando à modalidade real fechada."
- Substitua X, Y, Z pelos valores reais do payload (não placeholders).
- Ex. correto: "Cálculo de referência: R$7.900 ÷ (500 × 12) = R$1,32/aluno/mês. Use como argumento de diluição, ajustando à modalidade real fechada."
- ❌ Apenas dizer "Compromisso 3 aplicado ao diluir por aluno × 12 meses" (sem o número) — vendedor perde a referência exata.
- Este campo é meta-info pro vendedor — cliente nunca vê esse campo, ele fica só na nota.

Se "Preço" ou "Nº de alunos" estiver vazio: omitir diluição do roteiro, ancorar nas Estruturas. NÃO inventar valor.

Nunca conceder desconto solto pelo roteiro — apenas mencionar "política de modalidade ou condição de agenda". O desconto real é decisão do consultor, não do agente.

VOCABULÁRIO OBRIGATÓRIO (usar na voz do roteiro quando couber)
- infraestrutura educacional (em vez de "evento" ou "atividade")
- programa educacional / jornada de 12 meses
- astrônomos titulados (em vez de "monitores" ou "apresentadores")
- Urânia Class (plataforma de continuidade de 12 meses)
- investimento (em vez de "preço" ou "custo")
- política de modalidade (em vez de "desconto")
- curadoria científica / curadoria pedagógica

VOCABULÁRIO PROIBIDO (NUNCA pronunciar — nem como pergunta, nem em referência ao que o cliente disse, nem em qualquer contexto)
- evento
- atividade
- diária (sentido isolado — só vale se vier literal de campo do CRM)
- sessão isolada
- planetário inflável
- desconto / promoção / redução / abatimento

EXEMPLOS DE VIOLAÇÃO REAL OBSERVADA (não cometer):
- ❌ "comparando com qual atividade anterior?" → ✅ "comparando com qual cenário / qual proposta?"
- ❌ "Entendi sua pergunta sobre desconto" → ✅ "Entendi sua pergunta sobre ajuste"
- ❌ "não apenas uma atividade isolada" → ✅ "não apenas uma ação pontual"

REGRA: se uma palavra proibida apareceria na frase, REESCREVA antes de devolver. Mesmo que o cliente tenha usado a palavra, você NÃO repete — reframeia pro vocabulário Urânia.

5 ANTI-PADRÕES (cada um já foi bug em outros agentes Urânia — evitar desde v0.1)
- ❌ Aceitar passivamente "vou ver com a direção" (objeção #6) → ✅ sempre propor prazo + apoio (material curto pra direção, apresentação rápida com responsável pedagógico).
- ❌ Sugerir desconto solto quando objeção for financeira → ✅ "Antes de falar em ajuste, preciso entender X / Y / Z" + mencionar política de modalidade.
- ❌ Ecoar literalmente as frases entre aspas que aparecem na seção "Como contornar" do mapeamento abaixo — elas são REFERÊNCIA ESTRATÉGICA, não roteiro pronto. Reescreva na sua voz adaptada ao contexto deste lead específico.
  - VIOLAÇÃO REAL observada (não cometer): "Hoje o principal ponto é agenda, orçamento ou prioridade pedagógica?" é a frase literal do "Como contornar" da objeção #11. Reescrever: "Hoje, o que está pesando mais — a janela do ano, o orçamento, ou outras demandas pedagógicas?" (mesma INVESTIGAÇÃO, palavras suas).
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
- 3 a 5 falas numeradas. Cada fala em 1 linha. \\n entre falas.
- Tom falado, primeira pessoa do plural ("entendemos", "trazemos", "podemos") OU primeira do singular ("entendi", "te pergunto", "consigo").
- Não usar "professor(a)" ou "diretor(a)" genérico. Se o Cargo vier no payload, USE LITERAL na saudação. Exemplos:
  - Cargo=Diretor, Nome=Vivian → "Entendi, Diretora Vivian" (ou "Diretor", se masculino)
  - Cargo=Coordenador, Nome=Carlos → "Entendi, Coordenador Carlos"
  - Cargo=Professor, Nome=Ana → "Entendi, Professora Ana"
  - Cargo=(vazio), Nome=João → "Entendi, João" (só nome OK)
  - Cargo=(vazio), Nome=(vazio) → omitir saudação, abrir direto pela objeção.
- VIOLAÇÃO REAL observada: payload veio com `Cargo: Diretor` mas output usou só "Entendi, Elizete" — esqueceu o cargo. **Se o cargo veio no payload, ele DEVE aparecer na primeira saudação.**
- Última fala SEMPRE traz o próximo passo concreto.

por_que_funciona:
- Direcionado ao vendedor. Não ao cliente.
- Estrutura: "Cliente [perfil] ressoa com Estrutura [X] + [Y]. [Compromisso aplicado]. [Tom escolhido e por quê]."
- Pode citar nomes literais das 6 Estruturas (Humana, Tecnológica, etc.) e dos 3 Compromissos — é o único campo meta.

proximo_passo:
- Ação concreta + data absoluta calculada da DATA ATUAL + FOCO ESPECÍFICO da Estratégia da objeção.
- O foco vem da Estratégia indicada na seção da objeção no MAPEAMENTO abaixo. NÃO use frases genéricas tipo "alinhar próximos passos" ou "esclarecer pontos de dúvida" — sempre amarre ao que aquela objeção específica pede.
- Exemplos por objeção (FORMA, não conteúdo a copiar):
  - #1 CARO → "rever cenário de diluição financeira" / "comparar valor por aluno × 12 meses"
  - #2 SEM VERBA → "mapear janela orçamentária do próximo ciclo"
  - #6 Vou ver direção → "alinhar material curto pra apresentar à direção"
  - #8 Preciso pensar → "investigar a trava real / o que ainda gera dúvida"
  - #11 Sem prioridade → "entender se a trava é agenda, verba ou prioridade"
  - #12 Desconto → "fechar formato (alunos / período / mês) pra verificar política aplicável"
  - #14 Só preço → "fechar diagnóstico das 3 perguntas (alunos / mês / decisor)"
- ❌ "Retomar quarta para alinhar próximos passos." (vago)
- ✅ "Retomar quarta (27/05) para investigar a trava real da decisão da escola." (específico)
- Se a objeção for "deixar pra ano que vem" (#9), data sugerida pode ser mês/ano em vez de dia.

ABAIXO segue o MAPEAMENTO DE OBJEÇÕES Urânia (15 objeções canônicas, concatenado pelo build script). Use como REFERÊNCIA ESTRATÉGICA — leia a Estratégia indicada, reescreva o "Como contornar" na sua voz adaptada ao lead específico. Nunca copie literalmente as frases entre aspas das seções "Como contornar".`;

const MAPEAMENTO = fs.readFileSync(path.join(__dirname, 'mapeamento-objecoes-lead-urania.txt'), 'utf-8');
const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE + '\n\n---\n\n' + MAPEAMENTO;

// ---------------------------------------------------------------------------
// Code dos nodes Code. Strings JS que vão dentro de `parameters.jsCode`.
// Idênticos ao briefing labs onde marcado; adaptados onde indicado.
// ---------------------------------------------------------------------------

const VALIDATE_CODE = `// Idêntico ao briefing labs / qualificador.
// Aceita { lead_id } direto (Salesbot) ou payload nativo Kommo (leads[add|update|status][0][id]).
const input = $input.first().json;
const body = (input && input.body) ? input.body : input;

let lead_id = body && body.lead_id;

if (!lead_id && body) {
  const keys = ['leads[add][0][id]', 'leads[update][0][id]', 'leads[status][0][id]'];
  for (const k of keys) {
    if (body[k]) { lead_id = body[k]; break; }
  }
}

if (!lead_id || isNaN(Number(lead_id))) {
  throw new Error('lead_id obrigatório (numérico). Recebido: ' + JSON.stringify(body));
}
return [{ json: { entity_id: Number(lead_id), entity: 'leads', with: 'contacts' } }];`;

const PLAN_FETCHES_CODE = `// Idêntico ao briefing labs.
// Lê o lead retornado por Get Lead e gera N items para fetch dos contatos + empresa.
const lead = $input.first().json;
const out = [];
const contacts = (lead._embedded && lead._embedded.contacts) || [];
for (const c of contacts) {
  out.push({ json: { entity_id: c.id, entity: 'contacts' } });
}
const companies = (lead._embedded && lead._embedded.companies) || [];
for (const co of companies) {
  out.push({ json: { entity_id: co.id, entity: 'companies' } });
}
return out;`;

const AGGREGATE_EXTRAS_CODE = `// Idêntico ao briefing labs.
// Agrega N entidades fetched, classifica por _links.self.href.
const items = $input.all();
const contacts = [];
let company = null;
for (const it of items) {
  const f = it.json;
  if (!f || !f._links) continue;
  const url = (f._links.self && f._links.self.href) || '';
  if (url.indexOf('/contacts/') !== -1) contacts.push(f);
  else if (url.indexOf('/companies/') !== -1) company = f;
}
return [{ json: { contacts: contacts, company: company } }];`;

const EMPTY_EXTRAS_CODE = `// Idêntico ao briefing labs.
// Lead sem contatos nem empresa — emite estrutura vazia pra Format prosseguir.
return [{ json: { contacts: [], company: null } }];`;

const FORMAT_PAYLOAD_CODE = `// ADAPTADO vs briefing labs: whitelist enxuta de 5 campos (não 25).
// Inclui todos os campos da whitelist mesmo se vazios (sinaliza ao LLM "campo existe mas vazio").
// Extrai Cargo do contato principal (via Aggregate Extras).
// v0.5 (2026-05-23): Preço só aparece no userPrompt se a objeção for financeira.
//   Resolve bug v0.3/v0.4 de diluição indevida em objeções não-financeiras —
//   LLM nem vê o preço quando não deve usar diluição. Determinístico via dados.
const TIER_S_LEAD = new Set([
  'Objeções',
  'Objeções (livre)',
  'Tipo de cliente',
  'Nº de alunos'
]);

const OBJECOES_FINANCEIRAS = new Set([
  'Valor percebido baixo (CARO)',
  'Restrição orçamentária real (SEM VERBA)',
  'Concorrente mais barato',
  'Escola pública',
  'Pedido de desconto'
]);

// Prompt vive no node "System Prompt" (Set) — editável pela UI do n8n.
const SYSTEM_PROMPT = $('System Prompt').first().json.systemPrompt;

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && (v === '' || v === 'Selecione')) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function fieldValue(f) {
  if (!f.values || f.values.length === 0) return null;
  if (f.field_type === 'multiselect') {
    return f.values.map(function(v){return v.value;}).join(', ');
  }
  return f.values[0].value;
}

const lead = $('Get Lead').first().json;
const extras = $input.first().json;

// Coleta campos presentes ANTES de decidir incluir Preço
const cfv = lead.custom_fields_values || [];
const present = {};
for (let i = 0; i < cfv.length; i++) {
  const f = cfv[i];
  if (TIER_S_LEAD.has(f.field_name)) {
    const val = fieldValue(f);
    present[f.field_name] = isEmpty(val) ? null : val;
  }
}

// Verifica se objeção do lead é financeira (lista PERMITIDA do Compromisso 3)
const objecoesLead = (present['Objeções'] || '').split(', ').map(function(s){return s.trim();});
const ehFinanceira = objecoesLead.some(function(o){return OBJECOES_FINANCEIRAS.has(o);});

const today = new Date().toISOString().slice(0,10);
const lines = ['DATA ATUAL: ' + today, '', 'LEAD'];

// Preço SÓ aparece se objeção for financeira (#1, #2, #3, #10, #12).
// Resolve bug v0.3/v0.4: LLM via o preço e aplicava diluição indevida em objeções não-financeiras.
if (lead.price && ehFinanceira) {
  lines.push('Preço (venda lead-level): R$' + lead.price);
}

// Emite todos os 4 campos do lead na ordem fixa (vazio explícito quando ausente)
const orderLead = ['Objeções', 'Objeções (livre)', 'Tipo de cliente', 'Nº de alunos'];
for (const name of orderLead) {
  lines.push(name + ': ' + (present[name] != null ? present[name] : '(vazio)'));
}

// Contato principal (5º campo da whitelist: Cargo)
lines.push('', 'CONTATO PRINCIPAL');
const contacts = (extras && extras.contacts) || [];
const main = contacts.find(function(c){ return c.is_main === true || c.is_main === 'true'; }) || contacts[0];
if (main) {
  lines.push('Nome: ' + (main.name || ''));
  const ccfv = main.custom_fields_values || [];
  const cargoField = ccfv.find(function(f){ return f.field_name === 'Cargo'; });
  const cargoVal = cargoField ? fieldValue(cargoField) : null;
  lines.push('Cargo: ' + (isEmpty(cargoVal) ? '(vazio)' : cargoVal));
} else {
  lines.push('(nenhum contato principal identificado)');
}

const userPrompt = lines.join('\\n');

return [{ json: {
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userPrompt,
  leadId: lead.id
} }];`;

const PARSE_OUTPUT_CODE = `// NOVO node (briefing não tem). Valida JSON do LLM, separa roteiro inline vs multiline.
const r = $input.first().json;
const content = (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '';
if (!content) {
  throw new Error('OpenAI sem content. Recebido: ' + JSON.stringify(r).slice(0, 500));
}

let parsed;
try {
  parsed = JSON.parse(content);
} catch (e) {
  throw new Error('Output não é JSON válido. Content: ' + content.slice(0, 500));
}

const roteiro = String(parsed.roteiro || '').trim();
const porQue = String(parsed.por_que_funciona || '').trim();
const proximo = String(parsed.proximo_passo || '').trim();

if (!roteiro || !porQue || !proximo) {
  throw new Error('JSON com campo vazio. roteiro=' + roteiro.length + ' por_que_funciona=' + porQue.length + ' proximo_passo=' + proximo.length);
}

const leadId = $('Format Payload').first().json.leadId;
// HISTÓRICO: field 1378355 (texto curto, 256 chars) foi descoberto na execução 256934 em 2026-05-23.
// MIGRAÇÃO 2026-05-23: Marcos criou field 1378497 (texto longo) em substituição. Field antigo deletado.
// v0.7: field 1378497 recebe Roteiro completo + Próximo Passo (Opção C), sem o por_que_funciona (esse fica só na nota).
const valorField = 'ROTEIRO COPIÁVEL\\n' + roteiro + '\\n\\nPRÓXIMO PASSO\\n' + proximo;

return [{ json: {
  // Payload pro MS Salvar Campos (Save Field)
  entity_id: leadId,
  entity_type: 'leads',
  save: [{ field_id: 1378497, value: valorField }],
  // Dados pro Build Note ler depois (roteiro multiline preservado)
  roteiro: roteiro,
  por_que_funciona: porQue,
  proximo_passo: proximo,
  leadId: leadId
} }];`;

const BUILD_NOTE_CODE = `// ADAPTADO vs briefing labs: monta 3 seções fixas em vez de usar content cru do LLM.
// Roteiro vai multiline (notas Kommo aceitam \\n natural).
// v0.6.2: cria 2 registros no Kommo — Nota (common) + Msg interna (service_message).
//   Marcos quer ambos: Nota pro histórico + msg interna pro fluxo de conversa.
//   Add Note (executeWorkflow mode each) itera os 2 items e cria 2 chamadas ao MS.
const p = $('Parse Output').first().json;

const texto = 'Agente Contorno Objeção\\n\\n' +
              'ROTEIRO COPIÁVEL\\n' + p.roteiro + '\\n\\n' +
              'POR QUE FUNCIONA\\n' + p.por_que_funciona + '\\n\\n' +
              'PRÓXIMO PASSO\\n' + p.proximo_passo;

return [
  { json: {
    entity_id: p.leadId,
    entity_type: 'leads',
    note_type: 'common',
    text: texto
  }},
  { json: {
    entity_id: p.leadId,
    entity_type: 'leads',
    note_type: 'service_message',
    service: 'Agente Contorno Objeção',
    text: texto
  }}
];`;

// ---------------------------------------------------------------------------
// Workflow definition (15 nodes)
// ---------------------------------------------------------------------------

const wf = {
  name: '[KOMMO] Agente Contorno Objeção',
  nodes: [
    {
      id: 'a01-webhook',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2.1,
      position: [-1400, 0],
      parameters: {
        httpMethod: 'POST',
        path: 'contorno-objecao-kommo',
        // Fire-and-forget: responde 200 imediato no ingest. Kommo timeouta webhook em ~2s,
        // workflow demora 8-15s (OpenAI). Sem isso, Kommo retenta e gera N notas duplicadas.
        responseMode: 'onReceived',
        options: {}
      }
    },
    {
      id: 'a01b-system-prompt',
      name: 'System Prompt',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [-1300, 200],
      parameters: {
        assignments: {
          assignments: [
            {
              id: 'sp-1',
              name: 'systemPrompt',
              value: SYSTEM_PROMPT,
              type: 'string'
            }
          ]
        },
        includeOtherFields: true,
        options: {}
      },
      notes: 'Prompt v0.1 + mapeamento 15 objeções (concatenado). Editável aqui na UI. Fonte de verdade local: .workflow-build.js > const SYSTEM_PROMPT.'
    },
    {
      id: 'a02-validate',
      name: 'Validate Input',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-1200, 0],
      parameters: { jsCode: VALIDATE_CODE }
    },
    {
      id: 'a03-get-lead',
      name: 'Get Lead',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [-1000, 0],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'pSUCb5GTYWc4B99I', mode: 'id' },
        options: {}
      }
    },
    {
      id: 'a04-if',
      name: 'IF Has Extras',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [-800, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
          conditions: [
            {
              id: 'c1',
              leftValue: '={{ ($json._embedded && (($json._embedded.contacts || []).length + ($json._embedded.companies || []).length)) || 0 }}',
              rightValue: 0,
              operator: { type: 'number', operation: 'gt' }
            }
          ],
          combinator: 'and'
        },
        options: {}
      }
    },
    {
      id: 'a05-plan',
      name: 'Plan Fetches',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-600, -120],
      parameters: { jsCode: PLAN_FETCHES_CODE }
    },
    {
      id: 'a06-get-each',
      name: 'Get Each Extra',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [-400, -120],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'pSUCb5GTYWc4B99I', mode: 'id' },
        options: {}
      }
    },
    {
      id: 'a07-aggregate',
      name: 'Aggregate Extras',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-200, -120],
      parameters: { jsCode: AGGREGATE_EXTRAS_CODE }
    },
    {
      id: 'a08-empty',
      name: 'Empty Extras',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-600, 120],
      parameters: { jsCode: EMPTY_EXTRAS_CODE }
    },
    {
      id: 'a09-format',
      name: 'Format Payload',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [0, 0],
      parameters: { jsCode: FORMAT_PAYLOAD_CODE }
    },
    {
      id: 'a10-openai',
      name: 'OpenAI Chat',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [200, 0],
      parameters: {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'openAiApi',
        sendBody: true,
        contentType: 'raw',
        rawContentType: 'application/json',
        body: '={{ JSON.stringify({ model: "gpt-4o", temperature: 0.4, max_tokens: 1500, response_format: { type: "json_object" }, messages: [ { role: "system", content: $json.systemPrompt }, { role: "user", content: $json.userPrompt } ] }) }}',
        options: {}
      },
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    {
      id: 'a11-parse',
      name: 'Parse Output',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [400, 0],
      parameters: { jsCode: PARSE_OUTPUT_CODE }
    },
    {
      id: 'a12-save-field',
      name: 'Save Field',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [600, -120],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'm5K7FZDDvVXDiywo', mode: 'id' },
        options: {}
      },
      // Se Save Field falhar (ex.: Kommo 400), Build Note + Add Note continuam.
      // Defensive — nota é mais importante que o field pra UX do vendedor.
      onError: 'continueRegularOutput'
    },
    {
      id: 'a13-build-note',
      name: 'Build Note',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [600, 120],
      parameters: { jsCode: BUILD_NOTE_CODE }
    },
    {
      id: 'a14-add-note',
      name: 'Add Note',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [800, 120],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'QYvm2okgK3bQgMbR', mode: 'id' },
        options: {}
      }
    }
  ],
  connections: {
    Webhook: { main: [[{ node: 'System Prompt', type: 'main', index: 0 }]] },
    'System Prompt': { main: [[{ node: 'Validate Input', type: 'main', index: 0 }]] },
    'Validate Input': { main: [[{ node: 'Get Lead', type: 'main', index: 0 }]] },
    'Get Lead': { main: [[{ node: 'IF Has Extras', type: 'main', index: 0 }]] },
    'IF Has Extras': {
      main: [
        [{ node: 'Plan Fetches', type: 'main', index: 0 }],
        [{ node: 'Empty Extras', type: 'main', index: 0 }]
      ]
    },
    'Plan Fetches': { main: [[{ node: 'Get Each Extra', type: 'main', index: 0 }]] },
    'Get Each Extra': { main: [[{ node: 'Aggregate Extras', type: 'main', index: 0 }]] },
    'Aggregate Extras': { main: [[{ node: 'Format Payload', type: 'main', index: 0 }]] },
    'Empty Extras': { main: [[{ node: 'Format Payload', type: 'main', index: 0 }]] },
    'Format Payload': { main: [[{ node: 'OpenAI Chat', type: 'main', index: 0 }]] },
    'OpenAI Chat': { main: [[{ node: 'Parse Output', type: 'main', index: 0 }]] },
    // Fork: Parse Output → Save Field (paralelo) Build Note → Add Note
    'Parse Output': {
      main: [[
        { node: 'Save Field', type: 'main', index: 0 },
        { node: 'Build Note', type: 'main', index: 0 }
      ]]
    },
    'Build Note': { main: [[{ node: 'Add Note', type: 'main', index: 0 }]] }
    // Save Field não tem successor (ramo terminal paralelo)
  },
  settings: {
    executionOrder: 'v1',
    errorWorkflow: 'HQGrY3cUDvQJLGMZ',
    callerPolicy: 'workflowsFromSameOwner'
  }
};

if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, '.workflow.json'), JSON.stringify(wf, null, 2));
  console.log('OK — nodes:', wf.nodes.length, '| connections keys:', Object.keys(wf.connections).length, '| system prompt size:', SYSTEM_PROMPT.length, 'chars');
}

module.exports = { wf, SYSTEM_PROMPT };
