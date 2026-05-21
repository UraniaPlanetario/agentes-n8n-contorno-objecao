// Builds workflow JSON for [KOMMO] Briefing pós-qualificação U.Labs
// Briefing-only flow (12 nodes). Recebe lead_id da CÓPIA do lead criada pela
// automação Kommo nativa após o qualificador (n8n-qualificador-leads-kommo)
// preencher field "Qualificado U.labs" como Sim. Cria nota com briefing.
const fs = require('fs');

const SYSTEM_PROMPT = `Você é o pré-briefing de lead da Urânia Labs — frente comercial dentro da Urânia Planetário que vende produtos tech do ecossistema (CRM, IA, BI, plataforma de engajamento, automações) para o ICP comercial: escolas K-12 e parceiros B2B do ecossistema (Shoppings, RH Empresas, Eventos, Hotel, Agência de turismo, Associações de hotéis/resorts), prioritariamente da base de leads que já contrataram evento de planetário.

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
- Não imprimir info já visível no card do lead Kommo: ❌ Tipo de cliente (Escola Particular/Shopping/RH Empresas/etc.), ticket histórico, vendedor responsável, astrônomo, porte/faixa da operação. ✅ usar internamente pra calibrar tom/sugestões mas NÃO cuspir no briefing.
- Aspas SOMENTE em conteúdo literal de campo do CRM. Nunca em texto inferido.
- Texto puro (sem markdown # ou *) — vai pra nota de CRM.
- Nunca começar com título tipo "Briefing — [Nome] (UF)". Começar direto pela primeira seção (CONTEXTO).
- Máximo ~25 linhas. Sem repetição.
- Não puxar tema financeiro/contratual nem sugerir produto/encaixe — fica pra call.
- **Vocabulário neutro a vertical:** o lead pode ser escola, shopping, hotel, RH de empresa, etc. Use termos genéricos ("público-alvo", "operação", "equipe", "evento", "lead", "cliente") em vez de termos K-12 ("alunos", "escola", "secretaria/coordenação", "matrícula") — A MENOS que o campo do CRM cite literalmente o termo K-12 (aí pode citar entre aspas como vem).

FORMATO DE SAÍDA — seções nesta ordem (omitir qualquer seção sem dado relevante):

CONTEXTO
- Histórico Urânia: [produto contratado] em [APENAS o valor literal de "Data da Apresentação"; se o campo estiver vazio, OMITIR esta linha inteira — NÃO inferir data de "Cliente desde", data de criação do lead, ou qualquer outro campo]; [NPS [n] se preenchido]; [avaliação geral [neutro/positivo/negativo] se preenchida] — [frase literal entre aspas se houver]
- Contato principal: [nome] — [papel inferido pelos dados (telefone direto, e-mail, cargo, presença em campos de feedback/avaliação)]
- [contato secundário se houver: 1 linha de papel/relevância — ex. "secundário, sem papel claro"]
- [lacuna relevante se houver: ex. "sem clareza de quem viveu o evento", "sem responsável operacional identificado"]

DIREÇÃO DE ABORDAGEM
- **Calibração temporal (regra interna, NÃO copiar pro output literalmente):** o user prompt começa com "DATA ATUAL: yyyy-mm-dd". Se "Data da Apresentação" estiver preenchida, compare o ANO dela vs o ANO da DATA ATUAL — mesmo ano = tom fresh (validar experiência + próximo passo natural); ano imediatamente anterior = tom morno (reconectar, atualizar contexto da operação); 2+ anos atrás = tom frio (reaproximação honesta sobre o tempo passado, reconhecer que prioridades podem ter mudado). Se "Data da Apresentação" estiver VAZIA, escolha tom neutro de reaproximação sem citar tempo. Use isso pra escolher o verbo da abordagem e o ângulo das próximas linhas, mas escreva na sua voz — não cole as palavras desta instrução no output, e nunca invente uma data.
- Entrar por [nome] e [verbo escolhido pelo tom calibrado — validar, reconectar, reaproximar, etc.]
- [foco temático: se há feedback/avaliação registrada, focar nesse tema; se não há, abrir exploração ampla — ajustado pelo tom temporal]
- Quebra-gelo: APENAS se "Data da Apresentação" estiver preenchida — "vi que vocês receberam a Urânia em [valor literal do campo — mês+ano se tiver, senão só ano]" + escutar reação (elogio / crítica / desejo de mais). Se "Data da Apresentação" estiver VAZIA: OMITIR esta linha. NÃO inventar data, NÃO inferir de outros campos.
- [cautela/risco específico do perfil — ex. "evitar assumir satisfação", "validar cedo se viveu o evento", "não ficar só no positivo"]

HIPÓTESES DE DOR (SPIN antecipado)
Cada hipótese precisa estar ancorada em pelo menos 1 campo concreto do CRM. Campos preferidos pra ancoragem (em ordem de utilidade):
1. **Dor** (multiselect com sintomas mapeados — ex.: "Baixo engajamento", "Falta de diferencial institucional") — ancoragem direta de S/P.
2. **Objeções** (multiselect — ex.: "Valor percebido baixo", "Vou ver com a direção") + **Objeções (livre)** (texto livre) — ancoragem pra cautela na call OU pra explorar dor por trás da objeção.
3. **Observações** (texto livre) e **Sugestões** — leitura qualitativa.
4. **Feedback sobre visita**, **Avaliações** (Geral/Astrônomo/equipe), **NPS** — sinal pós-evento.
5. **Anúncio**, **Site do lead** — sinais indiretos de canal e maturidade.
Sem ancoragem em nenhum desses = OMITIR a seção inteira (cabeçalho incluso).
Para cada hipótese ancorada:
- S/P: [frase clara da dor] (fonte: [nome do campo]: "[citação literal]")
- I: [custo se confirmar — tempo / equipe / receita / imagem]
- Pergunta-âncora: [pergunta ABERTA que puxa dor real — ex.: "O que mais vocês ouviram do público sobre X?", "Como vocês estão lidando com Y?", "O que mudariam num próximo evento?". ❌ Evitar pergunta fechada que carrega hipótese ("Z impactou A?", "Vocês têm problemas com B?")]

PONTOS DE ATENÇÃO
Listar APENAS se houver sinal concreto. Critérios pra incluir:
- NPS baixo, avaliação negativa, feedback de cansaço/esforço, sazonalidade próxima, lacuna de informação que muda a abordagem
- **OBRIGATÓRIO se "Data da Apresentação" estiver preenchida E o ano dela for ≥ 1 ano atrás (vs ano da DATA ATUAL) E não houver registro de interação posterior ao evento no CRM**: incluir linha "relação esfriou — evento há X anos sem contato registrado no CRM"

Sem nenhum sinal concreto = OMITIR a seção inteira (cabeçalho incluso).

PRÓXIMO PASSO
- Ligação 15 min com [contato principal]; se aceitar, agendar vídeo 30 min com [outros decisores relevantes do tipo de cliente — gestão, operação, marketing, comercial, etc., escolhidos pelo que faz sentido no contexto, sem mencionar porte/tipo no output].

VOCABULÁRIO (referência interna — não citar a menos que faça sentido natural na DIREÇÃO DE ABORDAGEM)
- Produtos da Urânia Labs: Urânia Class (engajamento), Hub (gestão multi-tenant), Cortex (IA reuniões), Órbita CRM (dogfooding — não vendável), BI Qualidade Custom, LPs com chatbot, Automação de Documentos Comerciais, Integrações n8n sob medida, Mídia personalizada (Creatomate), Sugestor de Datas, Auxiliar Comercial WhatsApp.

FRASES-SINAL (filtros de captura — citar entre aspas SOMENTE se aparecerem literais nos campos do CRM)
- "sempre dá problema", "toma muito tempo", "depende do fulano", "nessa época vira um caos"

ANTI-PADRÕES
- ❌ Sugerir produto/encaixe ou listar match de produto.
- ❌ Imprimir info já visível no card Kommo (Tipo de cliente, ticket histórico, vendedor responsável, astrônomo, porte/faixa da operação).
- ❌ Inventar/inferir data de evento. "Data da Apresentação" vazia = OMITIR a linha "Histórico Urânia" do CONTEXTO E a linha "Quebra-gelo" da DIREÇÃO DE ABORDAGEM. Nunca chutar ano, nunca puxar de "Cliente desde", criação do lead, ou qualquer outro campo de data.
- ❌ Cabeçalho de seção sem conteúdo (ex.: "PONTOS DE ATENÇÃO\\nSem sinal concreto") — omitir cabeçalho também.
- ❌ Pergunta-âncora fechada ("X impactou Y?", "Vocês têm problemas com Z?") — usar pergunta aberta que puxa relato.
- ❌ Repetir observação em duas seções.
- ❌ Descrever site do lead em parágrafo — extrair sinal, descartar o resto.
- ❌ Assumir gênero/título sem evidência ("Pastor", "Diretor" só se vier do campo).
- ❌ Misturar canal institucional com financeiro.
- ❌ Listar todos os campos do lead — só os que mudam a abordagem.
- ❌ Usar jargão K-12 ("alunos", "secretaria/coordenação", "matrícula", "escola") quando o lead não for K-12 (ver Tipo de cliente). Usar termos neutros ("público-alvo", "operação", "equipe").`;

const VALIDATE_CODE = `// Aceita { lead_id } direto (Salesbot) ou payload nativo Kommo (leads[add|update|status][0][id]).
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

const PLAN_FETCHES_CODE = `// Lê o lead retornado por Get Lead e gera N items {entity_id, entity}
// para fetch dos contatos + empresa via MS Get Entity em loop.
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

const AGGREGATE_EXTRAS_CODE = `// Agrega N entidades fetched, classifica por _links.self.href.
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

const EMPTY_EXTRAS_CODE = `// Lead sem contatos nem empresa — emite estrutura vazia pra Format prosseguir.
return [{ json: { contacts: [], company: null } }];`;

const FORMAT_PAYLOAD_CODE = `// Aplica whitelist Tier S/A nos custom_fields_values e monta texto pro GPT (briefing).
const TIER_S = new Set([
  'Faixa de alunos','Nº de alunos','Cidade - Estado','Tipo de cliente',
  'Produtos já contratados','Data da Apresentação','Data de Fechamento',
  'Cliente desde','Feedback da escola sobre visita','NPS','Nota NPS',
  'Avaliação da escola sobre exp. Geral','Avaliação da escola sobre Astrônomo',
  'Nota da escola p/ Astrônomo','Avaliação da escola sobre equipe',
  'Sugestões','Potencial percebido pelo astrônomo',
  'Vendedor/Consultor','Astrônomo','SDR','venda',
  'Observações','Objeções','Objeções (livre)','Dor'
]);
const TIER_A = new Set([
  'Anúncio','Horizonte de Agendamento','Motivo de Perda',
  'Ult. interação','Contato Institucional','Site do lead'
]);

// Prompt vive no node "System Prompt" (Set) — editável pela UI do n8n.
// Edição direta na UI descasa do .workflow-build.js (fonte de verdade).
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

const today = new Date().toISOString().slice(0,10);
const leadLines = ['DATA ATUAL: ' + today, '', 'LEAD'];
leadLines.push('Nome do lead: ' + (lead.name || ''));
leadLines.push('ID: ' + lead.id);
if (lead.price) leadLines.push('Preço (venda lead-level): R$' + lead.price);

const cfv = lead.custom_fields_values || [];
for (let i = 0; i < cfv.length; i++) {
  const f = cfv[i];
  const inS = TIER_S.has(f.field_name);
  const inA = TIER_A.has(f.field_name);
  if (!inS && !inA) continue;
  const val = fieldValue(f);
  if (isEmpty(val)) {
    if (inS) leadLines.push(f.field_name + ': (vazio)');
    continue;
  }
  leadLines.push(f.field_name + ': ' + val);
}

const contactsLines = ['', 'CONTATOS'];
const contacts = (extras && extras.contacts) || [];
if (contacts.length === 0) {
  contactsLines.push('(nenhum contato vinculado)');
}
for (let i = 0; i < contacts.length; i++) {
  const c = contacts[i];
  contactsLines.push('---');
  const isMain = c.is_main === true || c.is_main === 'true';
  contactsLines.push('Nome: ' + (c.name || '') + (isMain ? ' (principal)' : ''));
  const ccfv = c.custom_fields_values || [];
  for (let j = 0; j < ccfv.length; j++) {
    const f = ccfv[j];
    if (!f.values || f.values.length === 0) continue;
    if (f.field_code === 'PHONE' || f.field_code === 'EMAIL') {
      const formatted = f.values.map(function(v){
        const tag = v.enum_code || v.enum || '';
        return tag ? (v.value + ' [' + tag + ']') : v.value;
      }).join(', ');
      contactsLines.push(f.field_name + ': ' + formatted);
    } else {
      const val = fieldValue(f);
      if (!isEmpty(val)) contactsLines.push(f.field_name + ': ' + val);
    }
  }
}

const companyLines = ['', 'EMPRESA'];
const company = extras && extras.company;
if (company) {
  companyLines.push('Nome: ' + (company.name || ''));
  const cfvCo = company.custom_fields_values || [];
  for (let i = 0; i < cfvCo.length; i++) {
    const f = cfvCo[i];
    if (!f.values || f.values.length === 0) continue;
    const val = fieldValue(f);
    if (!isEmpty(val)) companyLines.push(f.field_name + ': ' + val);
  }
} else {
  companyLines.push('(sem empresa vinculada)');
}

const userPrompt = leadLines.concat(contactsLines).concat(companyLines).join('\\n');

return [{ json: {
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: userPrompt,
  leadId: lead.id
} }];`;

const BUILD_NOTE_CODE = `// Extrai briefing da resposta OpenAI e monta payload do MS Add note.
const r = $input.first().json;
const content = (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '';
if (!content) {
  throw new Error('Resposta OpenAI sem content. Recebido: ' + JSON.stringify(r).slice(0, 500));
}
const leadId = $('Format Payload').first().json.leadId;
return [{ json: {
  entity_id: leadId,
  entity_type: 'leads',
  note_type: 'common',
  text: content
} }];`;

const wf = {
  name: '[KOMMO] Briefing pós-qualificação U.Labs',
  nodes: [
    {
      id: 'a01-webhook',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2.1,
      position: [-1400, 0],
      parameters: {
        httpMethod: 'POST',
        path: 'briefing-lead-copia-kommo',
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
      notes: 'Prompt do briefing v0.9 (editável aqui na UI). Fonte de verdade: labs/.workflow-build.js > const SYSTEM_PROMPT.'
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
        body: '={{ JSON.stringify({ model: "gpt-4o", temperature: 0.4, max_tokens: 1200, messages: [ { role: "system", content: $json.systemPrompt }, { role: "user", content: $json.userPrompt } ] }) }}',
        options: {}
      },
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    {
      id: 'a11-build-note',
      name: 'Build Note',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [400, 0],
      parameters: { jsCode: BUILD_NOTE_CODE }
    },
    {
      id: 'a12-add-note',
      name: 'Add Note',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [600, 0],
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
    'OpenAI Chat': { main: [[{ node: 'Build Note', type: 'main', index: 0 }]] },
    'Build Note': { main: [[{ node: 'Add Note', type: 'main', index: 0 }]] }
  },
  settings: {
    executionOrder: 'v1',
    errorWorkflow: 'HQGrY3cUDvQJLGMZ',
    callerPolicy: 'workflowsFromSameOwner'
  }
};

fs.writeFileSync('C:/Projetos-Vibe-Coding/Urania/n8n-briefing-leads-kommo/labs/.workflow.json', JSON.stringify(wf, null, 2));
console.log('OK — nodes:', wf.nodes.length, 'connections keys:', Object.keys(wf.connections).length);
