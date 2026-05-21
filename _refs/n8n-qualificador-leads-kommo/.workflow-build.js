// Builds workflow JSON for [KOMMO] Qualificador U.Labs
// Triagem standalone: lead_id → triagem GPT → field Kommo "Qualificado U.labs" preenchido.
// Idempotente via IF Already Qualified.
const fs = require('fs');

const QUALIFIER_SYSTEM_PROMPT = `Você é o triador de leads pra Urânia Labs (frente comercial que vende produtos tech do ecossistema Urânia: CRM, IA, BI, engajamento, automações). ICP inclui escolas K-12 (Escola Particular) E parceiros B2B do ecossistema: Shoppings, RH Empresas, Eventos, Hotel, Agência de turismo, Associações de hotéis/resorts.

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

Sem comentário. Só JSON.`;

const VALIDATE_CODE = `// Aceita { lead_id } direto (Salesbot/script) ou payload nativo Kommo (leads[add|update|status][0][id]).
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

const EMPTY_EXTRAS_CODE = `// Lead sem contatos nem empresa — emite estrutura vazia pra Format Qualifier prosseguir.
return [{ json: { contacts: [], company: null } }];`;

const FORMAT_QUALIFIER_CODE = `// Monta payload pro qualifier (whitelist Tier S/A) + system prompt.
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

const BUILD_AUDIT_NOTE_CODE = `// Monta nota de auditoria compacta (3 linhas) pra anexar no lead após salvar a triagem.
// Formato: TRIAGEM U.Labs: <decisão> / Lead: X/Y campos / Críticos vazios: ...
const TIER_S_NAMES = [
  'Faixa de alunos','Nº de alunos','Cidade - Estado','Tipo de cliente',
  'Produtos já contratados','Data da Apresentação','Data de Fechamento',
  'Cliente desde','Feedback da escola sobre visita','NPS','Nota NPS',
  'Avaliação da escola sobre exp. Geral','Avaliação da escola sobre Astrônomo',
  'Nota da escola p/ Astrônomo','Avaliação da escola sobre equipe',
  'Sugestões','Potencial percebido pelo astrônomo',
  'Vendedor/Consultor','Astrônomo','SDR','venda',
  'Observações','Objeções','Objeções (livre)','Dor'
];
const TIER_A_NAMES = [
  'Anúncio','Horizonte de Agendamento','Motivo de Perda',
  'Ult. interação','Contato Institucional','Site do lead'
];
const TIER_S = new Set(TIER_S_NAMES);
const TIER_A = new Set(TIER_A_NAMES);
const TOTAL = TIER_S.size + TIER_A.size;

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
const qualificado = $('Parse Qualifier').first().json.qualificado;

const cfv = lead.custom_fields_values || [];
const filledS = new Set();
const filledA = new Set();
for (let i = 0; i < cfv.length; i++) {
  const f = cfv[i];
  const val = fieldValue(f);
  if (isEmpty(val)) continue;
  if (TIER_S.has(f.field_name)) filledS.add(f.field_name);
  else if (TIER_A.has(f.field_name)) filledA.add(f.field_name);
}

const totalFilled = filledS.size + filledA.size;
const emptyCriticos = TIER_S_NAMES.filter(function(n){ return !filledS.has(n); });

const contactsCount = (lead._embedded && lead._embedded.contacts || []).length;
const companiesCount = (lead._embedded && lead._embedded.companies || []).length;

const lines = [
  'TRIAGEM U.Labs: ' + qualificado,
  'Lead: ' + totalFilled + '/' + TOTAL + ' campos com info · Contatos: ' + contactsCount + ' · Empresa: ' + companiesCount,
  'Críticos vazios: ' + (emptyCriticos.length > 0 ? emptyCriticos.join(', ') + '.' : 'nenhum.')
];

return [{ json: {
  entity_id: lead.id,
  entity_type: 'leads',
  note_type: 'common',
  text: lines.join('\\n')
} }];`;

const PARSE_QUALIFIER_CODE = `// Extrai resposta JSON do qualifier e mapeia pro enum_id do field 1376198 (Qualificado U.labs).
const r = $input.first().json;
const content = (r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '';
if (!content) {
  throw new Error('Qualifier sem content. Recebido: ' + JSON.stringify(r).slice(0, 500));
}

let parsed;
try {
  // tolera variações: pode vir com markdown fences ou texto antes/depois
  const match = content.match(/\\{[\\s\\S]*\\}/);
  parsed = JSON.parse(match ? match[0] : content);
} catch (e) {
  throw new Error('Qualifier output não é JSON válido. Content: ' + content.slice(0, 500));
}

const QUALIFIED = parsed.qualificado;
const ENUM_MAP = {
  'sim': 955466,
  'talvez': 955468,
  'inconclusivo': 955470,
  'não': 955472,
  'nao': 955472
};
const enum_id = ENUM_MAP[QUALIFIED && QUALIFIED.toLowerCase()];
if (!enum_id) {
  throw new Error('Qualifier devolveu valor inesperado: ' + QUALIFIED + '. Esperado: sim|talvez|inconclusivo|não');
}

const leadId = $('Format Qualifier Payload').first().json.leadId;
return [{ json: {
  qualificado: QUALIFIED,
  entity_type: 'leads',
  entity_id: leadId,
  save: [{ field_id: 1376198, enum_id: enum_id }]
} }];`;

const wf = {
  name: '[KOMMO] Qualificador U.Labs',
  nodes: [
    {
      id: 'a01-webhook',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2.1,
      position: [-1400, 0],
      parameters: {
        httpMethod: 'POST',
        path: 'qualificador-labs-kommo',
        // Fire-and-forget: padrão Kommo da casa.
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
              value: QUALIFIER_SYSTEM_PROMPT,
              type: 'string'
            }
          ]
        },
        includeOtherFields: true,
        options: {}
      },
      notes: 'Prompt do qualifier v0.6 (editável aqui na UI). Fonte de verdade: .workflow-build.js > const QUALIFIER_SYSTEM_PROMPT.'
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
      id: 'a05-if-extras',
      name: 'IF Has Extras',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [-600, 0],
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
      id: 'a06-plan',
      name: 'Plan Fetches',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-400, -120],
      parameters: { jsCode: PLAN_FETCHES_CODE }
    },
    {
      id: 'a07-get-each',
      name: 'Get Each Extra',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [-200, -120],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'pSUCb5GTYWc4B99I', mode: 'id' },
        options: {}
      }
    },
    {
      id: 'a08-aggregate',
      name: 'Aggregate Extras',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [0, -120],
      parameters: { jsCode: AGGREGATE_EXTRAS_CODE }
    },
    {
      id: 'a09-empty',
      name: 'Empty Extras',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-400, 120],
      parameters: { jsCode: EMPTY_EXTRAS_CODE }
    },
    {
      id: 'a10-format',
      name: 'Format Qualifier Payload',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [200, 0],
      parameters: { jsCode: FORMAT_QUALIFIER_CODE }
    },
    {
      id: 'a11-openai',
      name: 'OpenAI Qualifier',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [400, 0],
      parameters: {
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'openAiApi',
        sendBody: true,
        contentType: 'raw',
        rawContentType: 'application/json',
        body: '={{ JSON.stringify({ model: "gpt-4o", temperature: 0.2, max_tokens: 100, response_format: { type: "json_object" }, messages: [ { role: "system", content: $json.systemPrompt }, { role: "user", content: $json.userPrompt } ] }) }}',
        options: {}
      },
      retryOnFail: true,
      maxTries: 2,
      waitBetweenTries: 1000
    },
    {
      id: 'a12-parse',
      name: 'Parse Qualifier',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [600, 0],
      parameters: { jsCode: PARSE_QUALIFIER_CODE }
    },
    {
      id: 'a13-save',
      name: 'Save Qualified Field',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [800, 0],
      parameters: {
        source: 'database',
        workflowId: { __rl: true, value: 'm5K7FZDDvVXDiywo', mode: 'id' },
        options: {}
      }
    },
    {
      id: 'a14-build-audit',
      name: 'Build Audit Note',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1000, 0],
      parameters: { jsCode: BUILD_AUDIT_NOTE_CODE }
    },
    {
      id: 'a15-add-audit',
      name: 'Add Audit Note',
      type: 'n8n-nodes-base.executeWorkflow',
      typeVersion: 1.1,
      position: [1200, 0],
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
    'Aggregate Extras': { main: [[{ node: 'Format Qualifier Payload', type: 'main', index: 0 }]] },
    'Empty Extras': { main: [[{ node: 'Format Qualifier Payload', type: 'main', index: 0 }]] },
    'Format Qualifier Payload': { main: [[{ node: 'OpenAI Qualifier', type: 'main', index: 0 }]] },
    'OpenAI Qualifier': { main: [[{ node: 'Parse Qualifier', type: 'main', index: 0 }]] },
    'Parse Qualifier': { main: [[{ node: 'Save Qualified Field', type: 'main', index: 0 }]] },
    'Save Qualified Field': { main: [[{ node: 'Build Audit Note', type: 'main', index: 0 }]] },
    'Build Audit Note': { main: [[{ node: 'Add Audit Note', type: 'main', index: 0 }]] }
  },
  settings: {
    executionOrder: 'v1',
    errorWorkflow: 'HQGrY3cUDvQJLGMZ',
    callerPolicy: 'workflowsFromSameOwner'
  }
};

fs.writeFileSync('C:/Projetos-Vibe-Coding/Urania/n8n-qualificador-leads-kommo/.workflow.json', JSON.stringify(wf, null, 2));
console.log('OK — nodes:', wf.nodes.length, 'connections keys:', Object.keys(wf.connections).length);
