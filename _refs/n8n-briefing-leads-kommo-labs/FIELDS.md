# FIELDS.md — Whitelist de campos enviados ao GPT

> Filtragem do `custom_fields_values` antes de mandar pro OpenAI. Reduz tokens, evita alucinação em campos de processo interno, foca o GPT no que muda a abordagem.
>
> **Critério:** chave do filtro é `field.field_name` (string legível direto da API Kommo), NÃO `field_id`. Se Kommo renomear, atualizar lista aqui.

---

## Tier S — sempre enviar (ouro pro briefing)

**25 campos** (atualizado 2026-05-07: Observações + Objeções + Objeções livre + Dor promovidos pra Tier S).

```
Faixa de alunos
Nº de alunos
Cidade - Estado
Tipo de cliente
Produtos já contratados
Data da Apresentação
Data de Fechamento
Cliente desde
Feedback da escola sobre visita
NPS
Nota NPS
Avaliação da escola sobre exp. Geral
Avaliação da escola sobre Astrônomo
Nota da escola p/ Astrônomo
Avaliação da escola sobre equipe
Sugestões
Potencial percebido pelo astrônomo
Vendedor/Consultor
Astrônomo
SDR
venda
Observações                  ← 845519 (text)
Objeções                     ← 1376300 (multiselect, 16 opções)
Objeções (livre)             ← 1376302 (text livre)
Dor                          ← 1376306 (multiselect, 16 opções)
```

**Por que cada um:**
- **Faixa/Nº de alunos** — porte, calibra produto provável.
- **Cidade-Estado** — sazonalidade de matrícula varia por UF.
- **Tipo de cliente** — Confessional/Particular/Pública muda tom.
- **Produtos já contratados** + **Data Apresentação/Fechamento** — base do quebra-gelo do evento.
- **Bloco pós-evento (Feedback/NPS/Avaliações/Sugestões)** — leitura direta da relação atual.
- **Potencial percebido pelo astrônomo** — única opinião interna sobre a escola.
- **Vendedor/Astrônomo/SDR** — quem da Urânia já tocou; nome usado no briefing.
- **venda** — ticket histórico de calibração.
- **Observações/Objeções/Objeções (livre)** — registro de barreiras conhecidas. Insumo direto pra DIREÇÃO DE ABORDAGEM e PONTOS DE ATENÇÃO.
- **Dor** — campo dedicado a sintomas mapeados (16 opções tipo "baixo engajamento", "falta de diferencial", etc.). Insumo crítico pra HIPÓTESES DE DOR ancoradas (resolve diretamente o issue v0.1 de hipóteses sem ancoragem).

---

## Tier A — enviar se preenchido

**6 campos** (Observações foi promovida pra Tier S):

```
Anúncio
Horizonte de Agendamento
Motivo de Perda
Ult. interação
Contato Institucional
Site do lead
```

**Por que:** úteis quando preenchidos, mas a maioria dos leads tem vazio. Lógica: se `value` é null/vazio/`Selecione`, descartar antes de mandar pro GPT.

---

## Tier C — descartar (ruído)

```
Conteúdo da apresentação
Nº de Diárias
Brinde
Turnos do evento
Data Ofertada
PDF proposta
Mídia Consultor/vendedor (com site) Link
Mídia SDR link
Mídia Onboarding Consultor link
Status ligação IA
teste
```

**Por que descartar antes do GPT:**
- Operacional do evento (diárias/brinde/turnos) — não muda abordagem comercial.
- Links de PDF/mídia — não actionable em briefing de texto.
- Campos de processo interno (`teste`, `Status ligação IA`) — sujos.

---

## Contatos vinculados — todos

Pra cada contato em `_embedded.contacts`, fazer Get Entity adicional e enviar:
- `name`
- `is_main` (boolean — sinaliza contato principal)
- Telefones (com label: Oficial / Business / Lite)
- E-mails (com label: pessoal / financeiro@ / secretaria@ / direção@)
- `Cargo` (custom_field se houver — varia por escola)

→ Esse bloco é o que decide **entry point vs canal financeiro** no briefing.

---

## Empresa vinculada — sempre

Get Entity da company referenciada:
- `name`
- `CNPJ` ou `CNPJ2` (custom_field — verificar qual existe)
- `Site` (se preenchido — útil pra inferir maturidade digital)

---

## Implementação no Code node

Pseudo-código (a ser colado no node `Format payload GPT`):

```js
const TIER_S = new Set([
  'Faixa de alunos','Nº de alunos','Cidade - Estado','Tipo de cliente',
  'Produtos já contratados','Data da Apresentação','Data de Fechamento',
  'Cliente desde','Feedback da escola sobre visita','NPS','Nota NPS',
  'Avaliação da escola sobre exp. Geral','Avaliação da escola sobre Astrônomo',
  'Nota da escola p/ Astrônomo','Avaliação da escola sobre equipe',
  'Sugestões','Potencial percebido pelo astrônomo',
  'Vendedor/Consultor','Astrônomo','SDR','venda'
]);

const TIER_A = new Set([
  'Observações','Anúncio','Horizonte de Agendamento','Motivo de Perda',
  'Ult. interação','Contato Institucional','Site do lead'
]);

const isEmpty = v => !v || v === 'Selecione' || (Array.isArray(v) && v.length === 0);

// Itera custom_fields_values do lead, filtra:
const lines = [];
for (const f of lead.custom_fields_values || []) {
  const inS = TIER_S.has(f.field_name);
  const inA = TIER_A.has(f.field_name);
  if (!inS && !inA) continue;
  const value = f.field_type === 'multiselect'
    ? f.values.map(v => v.value).join(', ')
    : f.values[0]?.value;
  if (inA && isEmpty(value)) continue;
  lines.push(`${f.field_name}: ${value}`);
}
// Adiciona contatos e empresa em seções separadas
// Retorna texto plano pro GPT
```

---

## Calibração futura

Após 5-10 briefings reais, revisar:
- Algum Tier S aparecendo sempre vazio? → mover pra Tier A.
- Algum Tier C sendo útil? → promover pra A.
- Algum field name no Kommo renomeado? → atualizar whitelist aqui e no Code node.

Atualizações aqui devem refletir no Code node do workflow (e vice-versa).
