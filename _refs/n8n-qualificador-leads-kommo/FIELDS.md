# FIELDS.md — Qualificador U.Labs

Whitelist de campos do CRM Kommo que vão pro user prompt do qualifier. Por enquanto **idêntica à do briefing labs/** (`n8n-briefing-leads-kommo/labs/FIELDS.md`) pra simplicidade.

> **Otimização futura:** o qualifier não precisa de TODOS os campos que o briefing precisa. Pode reduzir whitelist pra cortar tokens (ex.: tirar `Vendedor/Consultor`, `Astrônomo`, `SDR` que não influenciam a decisão de qualificação). Adiar até ter volume real pra justificar.

---

## Tier S — campos de alta relevância (sempre incluir, mesmo se vazios)

**25 campos** (atualizado 2026-05-07 com decisão Raphael de tornar Observações/Objeções/Objeções livre/Dor obrigatórios):

```
Faixa de alunos · Nº de alunos · Cidade - Estado · Tipo de cliente
Produtos já contratados · Data da Apresentação · Data de Fechamento
Cliente desde · Feedback da escola sobre visita · NPS · Nota NPS
Avaliação da escola sobre exp. Geral · Avaliação da escola sobre Astrônomo
Nota da escola p/ Astrônomo · Avaliação da escola sobre equipe
Sugestões · Potencial percebido pelo astrônomo
Vendedor/Consultor · Astrônomo · SDR · venda
Observações (845519) · Objeções (1376300, multiselect) · Objeções (livre) (1376302) · Dor (1376306, multiselect)
```

**Field IDs dos novos críticos:**
- `Observações` → `845519` (text)
- `Objeções` → `1376300` (multiselect, 16 opções: Valor percebido baixo, Restrição orçamentária, Concorrente mais barato, Já trouxe planetário, Falta de espaço, Vou ver com a direção, Não sou eu quem decide, Preciso pensar, Deixar para ano que vem, Escola pública, Sem prioridade, Pedido de desconto, Sem resposta após proposta, Cliente quer só preço, Cliente trata como evento, N/A)
- `Objeções (livre)` → `1376302` (text livre)
- `Dor` → `1376306` (multiselect, 16 opções: Baixo engajamento, Falta de diferencial, Dificuldade conectar teoria/prática, Falta de acesso à ciência, Sobrecarga pedagógica, Falta de continuidade, Medo de investir em algo superficial, Dificuldade de justificar investimento, Passeios burocráticos, Poucas oportunidades culturais na região, Projetos isolados, Falta de inovação, Baixa participação das famílias, Falta de projetos BNCC, Professores sem suporte, Projetos que geram trabalho interno)

## Tier A — relevância média (incluir só se preenchido)

**6 campos** (Observações foi promovida pra Tier S):

```
Anúncio · Horizonte de Agendamento · Motivo de Perda
Ult. interação · Contato Institucional · Site do lead
```

## Tier C — descartar (não enviar pro GPT)

Todos os outros campos do lead (UTMs, IDs internos, metadata operacional, etc.).

---

## Por que essa estrutura

- **Tier S vazio aparece como `(vazio)`** — sinal pro GPT que o campo faz parte do CONTEXTO mas não tem dado. Útil pra triagem ("escola sem NPS = inconclusivo").
- **Tier A só aparece se preenchido** — campos opcionais que mudam a abordagem se houver dado, mas não se ausência for default esperada.
- **Tier C nunca aparece** — economia de token + reduz alucinação (menos vocabulário pro GPT puxar).

Lógica de filtro em `Format Qualifier Payload` Code (`.workflow-build.js`).

---

## Field destino do output

`Qualificado U.labs` `field_id: 1376198` (single-select). Enums:

| Valor | enum_id |
|---|---|
| Sim | `955466` |
| Talvez | `955468` |
| Inconclusivo | `955470` |
| Não | `955472` |

> Não está catalogado em `../n8n-ms-kommo/kommo-fields.md` ainda — pendente catalogar lá quando for fazer sync do MS-KOMMO.
