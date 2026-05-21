# Catálogo de IDs Kommo (Urania Planetário)

Referenciado pelo `CLAUDE.md` raiz e por todos os MS. **Fonte de verdade local:** workflows n8n `m5K7FZDDvVXDiywo` (Salvar campos) e `8lUufdX1Qn95KSRq` (Upsert) — onde os IDs estão hardcoded. Para o que falta, consulte a API Kommo direto.

---

## Custom fields — Leads

| field_id | Nome | Tipo |
|---|---|---|
| `848739` | Cidade | text |
| `847533` | Faixa de alunos | enum |
| `851275` | Nome da escola | text |
| `853697` | Disciplina | text/enum |
| `941939` | LP de origem | text |
| `847427` | Consultor | text/enum |
| `853875` | Origem da oportunidade | enum |
| `849769` | Canal de entrada | enum |
| `849067` | (sem nome em CF_NAMES; aparece como enum) | enum |
| `853717` | Vídeo Vendedor (citado em exemplos) | text/url |
| `841867` | Data e Hora do Agendamento | date_time |
| `848211` | Tipo de cliente | enum (23 opções — ver abaixo) |
| `849767` | Conteúdo da apresentação | enum (3 opções — ver abaixo) |
| `1376020` | Link doc onboarding | text |
| `586032` | utm_source | text |
| `586028` | utm_medium | text |
| `586030` | utm_campaign | text |
| `586034` | utm_term | text |
| `586026` | utm_content | text |
| `853789` | post_url | text/url |
| `586038` | referrer | text |

## Custom fields — Contacts

| field_id | Nome |
|---|---|
| `840300` | Cidade |
| `904188` | Cargo |

## Custom fields — Companies
Não catalogado localmente. Para listar:
```
GET https://uraniaplanetario.kommo.com/api/v4/companies/custom_fields
```

## Native fields (via `field_code`)
Aplicáveis em **contacts** (suportado pelo MS Salvar Campos):

| field_code | Nome |
|---|---|
| `EMAIL` | Email |
| `PHONE` | Telefone |

## Enum values — `847533` Faixa de alunos (leads)

| enum_id | Label |
|---|---|
| `572965` | 0 a 100 alunos |
| `572967` | 100 a 300 alunos |
| `572969` | 300 a 600 alunos |
| `572971` | 600 a 900 alunos |
| `572973` | 900 a 1.200 alunos |
| `572975` | Mais de 1.200 alunos |
| `575953` | Cobrar informação |

## Enum values — `848211` Tipo de cliente (leads)

Coletado via DOM inspect 2026-05-06. Usado pelo workflow `[KOMMO] Monta Doc Onboarding CS` (`cnNklcFg0st36YhI`) pra rotear pra template Escola/Prefeitura.

| enum_id | Label | Grupo onboarding |
|---|---|---|
| `575421` | Escola Pública | escola |
| `575423` | Escola Particular | escola |
| `573985` | Secretaria de educação | prefeitura |
| `576659` | Outro tipo de Secretária/Prefeitura | prefeitura |
| `573987` | Colônia de Férias | (fallback escola) |
| `573989` | Shoppings | (fallback escola) |
| `573991` | RH Empresas | (fallback escola) |
| `573993` | Eventos | (fallback escola) |
| `574677` | Condomínios | (fallback escola) |
| `575427` | Projeto Social | (fallback escola) |
| `575429` | Hotel | (fallback escola) |
| `576053` | Agência de turismo | (fallback escola) |
| `576055` | Associações de hotéis/resorts | (fallback escola) |
| `576655` | Pai/Mãe de aluno | (fallback escola) |
| `576657` | Aluno | (fallback escola) |
| `576661` | Aniversário | (fallback escola) |
| `581185` | Igrejas | (fallback escola) |
| `581187` | Escoteiros | (fallback escola) |
| `581747` | Bilheteria | (fallback escola) |
| `583163` | Imobiliária | (fallback escola) |
| `583165` | Incorporadora | (fallback escola) |
| `583167` | Construtora | (fallback escola) |
| `583169` | Ramo imobiliário | (fallback escola) |

> Regra de fallback do onboarding: enum_id ≠ desses 4 (Escola Pública/Particular/Secretaria/Outro Sec.) → workflow trata como `escola`. Apenas campo vazio cai em `default(erro)` do Switch.

## Enum values — `849767` Conteúdo da apresentação (leads)

Coletado via DOM inspect 2026-05-06. Usado pelos workflows `Monta Proposta` e `Monta Doc Onboarding`.

| enum_id | Label | Tema onboarding |
|---|---|---|
| `576009` | Astronerd | astronomia |
| `576011` | Astronomia (tradicional) | astronomia |
| `576013` | Ciências da Natureza | ciencias |

> Astronerd compartilha template Astronomia no onboarding (decisão 2026-05-06).

## Enum values — não-mapeados (a confirmar field parent)

Encontrados hardcoded no Upsert (`8lUufdX1Qn95KSRq`) em 2026-05-06. Field parent provável: `849769` Canal de entrada ou `853875` Origem da oportunidade. Confirmar via:
```
GET https://uraniaplanetario.kommo.com/api/v4/leads/custom_fields/<field_id>
```

| enum_id | Label | Origem |
|---|---|---|
| `575871` | *(a confirmar)* | Upsert workflow |
| `583355` | *(a confirmar)* | Upsert workflow |
| `598880` | *(a confirmar)* | Upsert workflow |
| `598916` | *(a confirmar)* | Upsert workflow |
| `620318` | *(a confirmar)* | Upsert workflow |

---

## Pipelines & Status

| ID | Nome | Notas |
|---|---|---|
| `10832516` | Vendas WhatsApp | pipeline default do Upsert |
| `99618623` | Saudação Manual | status default no pipeline acima |
| `6965920` | (referenciado em exemplos como pipeline alternativo) | — |
| `86750988` | (status no `6965920`) | — |

> Listar todos: `GET https://uraniaplanetario.kommo.com/api/v4/leads/pipelines`

## Users

| user_id | Notas |
|---|---|
| `13346000` | **Usuário fallback** — não é vendedor real. MS `Aguardar Responsável` faz polling até `responsible_user_id` ser ≠ disso. Também é default em `Upsert.responsible_user_id`. |

> Listar todos: `GET https://uraniaplanetario.kommo.com/api/v4/users`

## Tags

| tag_id | Nome | Aplicação |
|---|---|---|
| `159754` | Indefinido | usada como `lead_tag_id` default no Upsert |
| `159756` | *(a confirmar via API)* | aparece em Upsert (`8lUufdX1Qn95KSRq`) — descoberta via sync 2026-05-06 |

> Listar todas: `GET https://uraniaplanetario.kommo.com/api/v4/leads/tags`

## Tipos de task

| task_type_id | Notas |
|---|---|
| `1` | task type default no Upsert e no MS Add task |

> Listar todos: `GET https://uraniaplanetario.kommo.com/api/v4/account?with=task_types`

---

## Como descobrir IDs novos

1. **API Kommo direto** — endpoints listados em cada seção. Use a credencial Bearer `skV2BHNge0lsu6UO` (ou um token de teste).
2. **Admin do Kommo** — abrir o campo/pipeline na UI, ID aparece na URL.
3. **Workflow existente** — buscar no JSON do workflow por `field_id`, `pipeline_id`, etc.

> Ao adicionar campo novo aqui, atualize também a seção "IDs operacionais críticos" do `CLAUDE.md` raiz se for um campo recorrente em produtos.
