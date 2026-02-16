# Backend — Modulo de Documentos & Assinaturas

## Contexto

O frontend ja tem a tela pronta (`/documentos`) com busca de tutor por CPF, selecao de pet, listagem de templates e historico de documentos enviados. Hoje o servico esta 100% mockado. Precisamos criar as rotas reais no backend.

**Arquitetura de templates:** Os arquivos `.hbs` ficam **exclusivamente no backend** (single source of truth). O frontend faz download do template raw (string HBS), compila client-side com `Handlebars.js`, injeta os dados do tutor/pet e gera o HTML para preview. Para envio (email/WhatsApp/PDF), o backend renderiza server-side com os mesmos templates.

**Base URL da API:** `http://localhost:8084/api`
**Auth:** `Authorization: Bearer {token}` em todos os endpoints
**Content-Type padrao:** `application/json` (exceto endpoints de stream/download)

---

## Tipos/Enums (referencia do frontend)

```typescript
type DocumentType = 'SIGNATURE_REQUIRED' | 'SEND_ONLY';
type DocumentStatus = 'PENDING' | 'SENT' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
```

---

## Rotas Necessarias

### 1. Templates

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `GET` | `/documents/templates` | Lista todos os templates ativos |
| `GET` | `/documents/templates/:id` | Detalhes de um template especifico |
| `GET` | `/documents/templates/:id/raw` | **Download do conteudo HBS raw** (string do template para compilacao no frontend) |
| `POST` | `/documents/templates` | Criar novo template (admin) |
| `PUT` | `/documents/templates/:id` | Atualizar template (admin) |
| `DELETE` | `/documents/templates/:id` | Soft-delete do template (admin) |

#### `GET /documents/templates` — Response

```json
[
  {
    "id": "uuid",
    "name": "Termo de Consentimento para Cirurgia",
    "description": "Termo que autoriza a realizacao de procedimento cirurgico no animal.",
    "type": "SIGNATURE_REQUIRED",
    "category": "Cirurgia",
    "active": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

#### `GET /documents/templates/:id/raw` — Response

```
Content-Type: text/plain; charset=utf-8
```

Retorna a string HBS pura do template. O frontend faz `Handlebars.compile(raw)(context)` para gerar o HTML e renderizar no `<iframe srcDoc={html}>`.

#### `POST /documents/templates` — Request Body

```json
{
  "name": "string",
  "description": "string",
  "type": "SIGNATURE_REQUIRED | SEND_ONLY",
  "category": "string",
  "templateContent": "string (conteudo HBS)"
}
```

---

### 2. Documentos (Envio & Historico)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/documents/send` | Envia/gera um documento (renderiza server-side + envia) |
| `POST` | `/documents/:id/reprocess` | Reenvia/reprocessa um documento existente |
| `GET` | `/documents/by-customer-pet?customerId=X&petId=Y` | Historico de documentos por tutor+pet |
| `GET` | `/documents/:id` | Detalhes de um documento especifico |
| `GET` | `/documents/:id/download` | **Download do documento renderizado como PDF** (stream) |

#### `POST /documents/send` — Request Body

```json
{
  "templateId": "uuid",
  "petId": "uuid",
  "customerId": "uuid"
}
```

#### `POST /documents/send` — Response `201`

```json
{
  "id": "uuid",
  "templateId": "uuid",
  "templateName": "Termo de Consentimento para Cirurgia",
  "type": "SIGNATURE_REQUIRED",
  "status": "AWAITING_SIGNATURE",
  "petId": "uuid",
  "petName": "Thor",
  "customerId": "uuid",
  "customerName": "Joao Silva",
  "sentAt": "2026-02-14T15:00:00Z",
  "signedAt": null,
  "expiresAt": "2026-03-14T15:00:00Z",
  "createdAt": "2026-02-14T15:00:00Z",
  "updatedAt": "2026-02-14T15:00:00Z"
}
```

**Logica do `status` inicial:**
- Se `type === 'SIGNATURE_REQUIRED'` -> status = `AWAITING_SIGNATURE`
- Se `type === 'SEND_ONLY'` -> status = `SENT`

#### `POST /documents/:id/reprocess` — Response `200`

Mesmo shape do DocumentRecord acima, com `sentAt` e `updatedAt` atualizados.

#### `GET /documents/by-customer-pet?customerId=X&petId=Y` — Response

```json
[
  { "/* DocumentRecord */" },
  { "/* DocumentRecord */" }
]
```

Ordenado por `createdAt DESC`.

#### `GET /documents/:id/download` — Response

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="termo-cirurgia-thor-2026-02-14.pdf"
```

Stream do PDF renderizado server-side a partir do template HBS + dados salvos no documento.

---

### 3. Assinatura (futuro, ja preparar a rota)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/documents/:id/sign` | Registra assinatura digital do documento |
| `GET` | `/documents/:id/signature-status` | Consulta status da assinatura |

#### `POST /documents/:id/sign` — Request Body

```json
{
  "signatureData": "string (base64 da assinatura ou token do provider)",
  "signedBy": "string (nome/CPF de quem assinou)"
}
```

#### `POST /documents/:id/sign` — Response `200`

```json
{
  "id": "uuid",
  "status": "SIGNED",
  "signedAt": "2026-02-14T16:00:00Z",
  "updatedAt": "2026-02-14T16:00:00Z"
}
```

---

## Variaveis disponiveis nos templates HBS

Campos que o backend injeta ao renderizar server-side, e que o frontend passa ao compilar client-side:

```typescript
interface TemplateContext {
  // Template
  templateName: string;
  templateCategory: string;
  templateDescription: string;

  // Tutor
  customerName: string;
  customerCpf: string;         // ja formatado: 000.000.000-00
  customerEmail: string;
  customerPhone: string;       // ja formatado: (00) 00000-0000

  // Pet
  petName: string;
  petSpecies: string;          // traduzido: "Cao", "Gato", etc.
  petBreed: string;
  petGender: string;           // traduzido: "Macho", "Femea"
  petBirthDate: string;        // formatado: dd/mm/aaaa
  petWeight: string;           // ex: "12,5 kg"
  petColor: string;

  // Meta
  currentDate: string;         // dd/mm/aaaa
  currentDateTime: string;     // dd/mm/aaaa HH:mm
  clinicName: string;          // nome da clinica (config)
  clinicAddress: string;       // endereco da clinica (config)
  clinicPhone: string;         // telefone da clinica (config)
  clinicCnpj: string;          // CNPJ da clinica (config)

  // Condicional
  isSignatureRequired: boolean;
}
```

---

## Seed dos Templates

Ao inicializar, inserir se nao existirem:

| slug | name | type | category | arquivo HBS |
|------|------|------|----------|-------------|
| `surgery-consent` | Termo de Consentimento para Cirurgia | `SIGNATURE_REQUIRED` | Cirurgia | `surgery-consent.hbs` |
| `vaccination-auth` | Autorizacao de Vacinacao | `SIGNATURE_REQUIRED` | Vacinacao | `vaccination-auth.hbs` |
| `pet-registration` | Ficha Cadastral do Pet | `SEND_ONLY` | Cadastro | `pet-registration.hbs` |
| `hospitalization-consent` | Termo de Internacao | `SIGNATURE_REQUIRED` | Internacao | `hospitalization-consent.hbs` |
| `prescription` | Receituario Veterinario | `SEND_ONLY` | Receituario | `prescription.hbs` |
| `grooming-consent` | Termo de Banho e Tosa | `SIGNATURE_REQUIRED` | Estetica | `grooming-consent.hbs` |

Os arquivos `.hbs` estao na pasta `examples/templates/` deste repositorio como referencia.

---

## Fluxo Resumido

```
PREVIEW (frontend-side rendering):
  Frontend -> GET /documents/templates/:id/raw -> recebe string HBS
  Frontend -> Handlebars.compile(hbs)(context) -> HTML
  Frontend -> <iframe srcDoc={html}> -> usuario ve o preview

ENVIO (backend-side rendering):
  Frontend -> POST /documents/send { templateId, petId, customerId }
  Backend  -> busca template HBS + dados do customer/pet no banco
  Backend  -> Handlebars.compile(hbs)(context) -> HTML
  Backend  -> gera PDF (puppeteer/wkhtmltopdf) e/ou envia por email/WhatsApp
  Backend  -> salva DocumentRecord com status AWAITING_SIGNATURE ou SENT

DOWNLOAD:
  Frontend -> GET /documents/:id/download
  Backend  -> busca DocumentRecord -> re-renderiza template -> stream PDF
```
