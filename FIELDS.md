# FIELDS — Agente Contorno de Objeção

Whitelist de campos lidos do lead Kommo + spec do payload do webhook + destinos de output.

> Justificativa por trás dessa whitelist (12 campos avaliados, 5 entraram, 7 saíram) → [`DESIGN.md`](./DESIGN.md) §1 (decisão #10) e seção "Campos NÃO lidos" abaixo.

---

## Webhook (input)

| Campo | Valor |
|---|---|
| Method | `POST` |
| Path | `/contorno-objecao-kommo` |
| URL produção | `https://n8n-queue-mode-n8n-web.mmjkgs.easypanel.host/webhook/contorno-objecao-kommo` |
| Body esperado | `{ "lead_id": <number> }` |
| Body alternativo (salesbot Kommo nativo) | `leads[add\|update\|status][0][id]=<number>` (form-urlencoded) |
| Response | `200` imediato (`responseMode: 'onReceived'` — fire-and-forget) |

Node `Validate Input` parseia ambos os formatos.

---

## Campos lidos do lead (whitelist — 5 campos)

Todos enviados ao LLM **mesmo se vazios** — sinaliza ao modelo que o campo existe mas está em branco. Regra no system prompt: omitir trechos quando dado ausente, sem placeholders tipo `[a definir]`.

Chave do filtro: `field.field_name` (string legível direto da API Kommo), não `field_id`. Lógica de filtragem fica no node `Format Payload` (Code).

| # | Campo (`field_name`) | `field_id` | Tipo | Por que é crítico |
|---|---|---|---|---|
| 1 | `Objeções` | `1376300` | multiselect (16 opções) | **Input primário** — tipo da objeção (1 de 16 do mapeamento canônico). Define qual estratégia base aplicar. |
| 2 | `Objeções (livre)` | `1376302` | text | Citação literal do cliente — fundamenta a fala de validação ("Entendi que você disse X"). Vendedor consolida nuance aqui (trecho de WhatsApp, contexto adicional, etc). |
| 3 | `Tipo de cliente` | `848211` | enum | Define **quais 3 das 6 Estruturas Urânia ativar** (Particular → Humana/Internacional/Tecnológica; Pública → Científica/Pedagógica/Digital; etc). Sem isso, coach genérico escolhe Estrutura errada pro perfil. |
| 4 | `Nº de alunos` | `849729` | text (string, não number — apesar do nome) | Pilar do **Compromisso 3** do método (sempre diluir por aluno e 12 meses). Crítico em objeções 1 (CARO) e 12 (desconto). Sem isso, roteiro perde âncora financeira mais forte. |
| 5 | `Contato principal.cargo` | `904188` (em contacts) | select (enum — Diretor, Coordenador, Professor, etc.) | Personaliza fala ("Professor", "Diretor", "Coordenadora") em vez do "Professor(a)" genérico. **Nota arquitetural:** `_embedded.contacts` do Get Lead retorna só `{id, is_main}` — o Cargo exige 2º Get Entity em `entity: contacts`. Isso é exatamente o que o ramo `IF Has Extras → Plan Fetches → Get Each Extra → Aggregate Extras` (clonado do briefing labs) já resolve. |

> **Enum values:**
> - `Objeções` (16 opções) → ver mapeamento literal em [`./mapeamento-objecoes-lead-urania.txt`](./mapeamento-objecoes-lead-urania.txt)
> - `Tipo de cliente` (Particular, Pública, Confessional, Rede, etc.) → ver [`_refs/n8n-ms-kommo/kommo-fields.md`](./_refs/n8n-ms-kommo/kommo-fields.md) · monorepo: `../n8n-ms-kommo/kommo-fields.md`

---

## Campos NÃO lidos (referência rápida)

Excluídos da whitelist pra minimizar tokens e ruído. Listados aqui pra evitar "vamos adicionar X" sem reler a justificativa.

| Campo excluído | Por quê |
|---|---|
| `Dor` (1376306) | **Princípio de separação** — agente Dor é workflow separado (monorepo Urânia · `n8n-ativacao-dor-kommo/` · fora deste snapshot). Misturar degrada raciocínio do LLM (mesma razão do split qualifier/briefing em 2026-05-07). |
| `Faixa de alunos` (847533) | Duplica `Nº de alunos`. |
| `Motivo de Perda` | Vendedor que dispara o salesbot já decidiu que faz sentido contornar — flag adicional gera dúvida no LLM. |
| `Data da Apresentação`, `Horizonte de Agendamento`, `Ult. interação` | Useful em 1-2 objeções específicas; ROI baixo vs token cost. Vendedor codifica em `Objeções (livre)` se importar. |
| `Cidade-Estado`, `Feedback da escola sobre visita`, `NPS`/`Nota NPS` | Território de briefing/qualifier, não contorno. |
| `Observações`, `Sugestões` | Redundante com `Objeções (livre)` — vendedor consolida tudo lá. |
| `Produtos já contratados`, `venda` | Calibram tom warm-vs-frio em 2-3 objeções; vendedor anota em livre se for crítico. |
| `Vendedor/Consultor`, `Astrônomo`, `SDR` | Quem da Urânia tocou no lead **não muda estratégia** de contorno. |
| `Anúncio`, UTMs (`utm_*`), `post_url`, `Site do lead` | Campanha de origem é input pra qualifier/briefing, ruído puro pra contorno. |

---

## Output — 2 destinos

### Destino 1 — Custom field `Resp. IA objeção`

| Campo | Valor |
|---|---|
| `field_id` | `1378497` |
| Type | text |
| Entity | lead (do `lead_id` recebido no webhook) |
| Conteúdo | **`proximo_passo` retornado pelo LLM** (~10-30 palavras, ~150 chars). Mudou de "roteiro inline" pra "proximo_passo" em 2026-05-23 quando descobrimos via execution 256934 que o field aceita só **256 chars** (não os ~2000 que DESIGN.md assumiu). Roteiro completo fica só na nota (Destino 2). UX: vendedor olha o card e vê o próximo passo no field — clica na nota se quiser ler o roteiro inteiro. |
| Comportamento | **Sobrescreve** a cada run — último roteiro vale |
| MS usado | `[MS-KOMMO] Salvar campos em uma Entity` (`m5K7FZDDvVXDiywo`) |

### Destino 2 — Nota no lead

| Campo | Valor |
|---|---|
| `entity_type` | `leads` |
| `entity_id` | `<lead_id>` do webhook |
| `note_type` | **DUAL** em v0.6.2 (2026-05-23): cria **2 registros simultâneos** no Kommo a cada disparo — uma **Nota** (`note_type: common`) pro histórico permanente + uma **msg interna do bot** (`note_type: service_message`, `service: Agente Contorno Objeção`) pro fluxo de conversa. Decisão Marcos. Build Note retorna 2 items, executeWorkflow Add Note (mode each) chama o MS 2 vezes. |
| Identificação | Prefixo `Agente Contorno Objeção` na 1ª linha do texto |
| Conteúdo | Nota completa com 3 seções: `ROTEIRO COPIÁVEL` + `POR QUE FUNCIONA` + `PRÓXIMO PASSO`. Headers em texto puro (sem markdown). **Multiline preservado:** notas do Kommo aceitam `\n` real e renderizam com quebra de linha (confirmado 2026-05-22). O field 1378497 (texto longo, criado em substituição ao 1378355 que era curto) também aceita multiline. Logo: `roteiro` vai com `\n` natural na nota, e separador ` · ` só no field. |
| Comportamento | **Acumula** — cada run cria 1 nota nova (histórico contextualizado) |
| MS usado | `[MS-KOMMO] Add note` (`QYvm2okgK3bQgMbR`) |

---

## Regras de saída obrigatórias

(Específicas do contorno — herdadas como restrições no system prompt; validadas em prompt review e nos primeiros disparos.)

1. **100% PT-BR.** Sem palavra em inglês.
2. **Texto puro** — sem markdown `#` ou `*` (vai pra nota CRM + field text).
3. **Vocabulário Urânia proibido:** `evento`, `atividade`, `diária` (sentido isolado), `sessão isolada`, `planetário inflável`.
4. **Sem dado/evidência no CRM = omitir trecho.** Sem placeholders tipo `[a definir]` ou `[não especificado]`.
5. **Aspas SOMENTE** em conteúdo literal de `Objeções (livre)` (citação do cliente).
6. **Nunca desconto solto** — só "política de modalidade".
7. **Nunca aceitar passivamente "vou ver com a direção"** — sempre propor prazo + apoio.
