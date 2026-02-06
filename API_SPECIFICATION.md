# API Specification - Security Admin Backend

Backend REST API para sistema administrativo de gestão de usuários, roles e client credentials.

## Stack Recomendada
- Java 17+
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- JWT (JSON Web Token)
- PostgreSQL ou MySQL

---

## Entidades

### User
```java
{
  "id": Long,
  "username": String,
  "email": String,
  "password": String (hash, não retornar na API),
  "enabled": Boolean,
  "roles": List<Role>,
  "createdAt": LocalDateTime,
  "updatedAt": LocalDateTime
}
```

### Role
```java
{
  "id": Long,
  "name": String (ex: "ROLE_ADMIN"),
  "description": String,
  "active": Boolean
}
```

### ClientCredential
```java
{
  "id": Long,
  "clientId": String (único, gerado automaticamente),
  "clientName": String,
  "clientSecret": String (hash, retornar apenas na criação/regeneração),
  "description": String,
  "active": Boolean,
  "lastUsedAt": LocalDateTime (nullable),
  "createdAt": LocalDateTime
}
```

### LoginRequest
```java
{
  "username": String,
  "password": String
}
```

### LoginResponse
```java
{
  "token": String,
  "type": String ("Bearer"),
  "expiresIn": Long (segundos)
}
```

### CacheStats
```java
{
  "size": Integer,
  "hitCount": Long,
  "missCount": Long,
  "hitRate": Double (0.0 a 1.0)
}
```

---

## Endpoints

### 1. Autenticação

#### POST /auth/login
Autentica usuário e retorna JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresIn": 86400
}
```

**Response 401:**
```json
{
  "message": "Usuário ou senha inválidos",
  "status": 401,
  "timestamp": "2024-04-20T10:00:00Z"
}
```

**Regras:**
- Verificar se usuário existe e está enabled
- Validar senha com BCrypt
- Gerar JWT com claims: sub (username), roles, exp
- Token deve expirar em 24h (86400 segundos)

---

### 2. Usuários

> Todos os endpoints de usuários requerem autenticação (Bearer Token)

#### GET /users/me
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@empresa.com",
  "enabled": true,
  "roles": [
    {
      "id": 1,
      "name": "ROLE_ADMIN",
      "description": "Administrador do sistema",
      "active": true
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-04-20T15:30:00Z"
}
```

**Regras:**
- Extrair username do JWT token
- Retornar usuário com suas roles

---

#### GET /users
Lista todos os usuários.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@empresa.com",
    "enabled": true,
    "roles": [
      {
        "id": 1,
        "name": "ROLE_ADMIN",
        "description": "Administrador",
        "active": true
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

**Regras:**
- Requer role ADMIN
- Não retornar campo password
- Ordenar por username

---

#### GET /users/{id}
Obtém usuário por ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@empresa.com",
  "enabled": true,
  "roles": [...],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Response 404:**
```json
{
  "message": "Usuário não encontrado",
  "status": 404
}
```

**Regras:**
- Requer role ADMIN

---

#### POST /users/{username}/enable
Ativa um usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Usuário ativado com sucesso"
}
```

**Response 404:**
```json
{
  "message": "Usuário não encontrado"
}
```

**Regras:**
- Requer role ADMIN
- Setar enabled = true
- Atualizar updatedAt

---

#### POST /users/{username}/disable
Desativa um usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Usuário desativado com sucesso"
}
```

**Regras:**
- Requer role ADMIN
- Setar enabled = false
- Não permitir desativar o próprio usuário logado
- Atualizar updatedAt

---

#### POST /users/{username}/roles/{roleName}
Adiciona uma role ao usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Role adicionada com sucesso"
}
```

**Response 404:**
```json
{
  "message": "Usuário não encontrado"
}
// ou
{
  "message": "Role não encontrada"
}
```

**Response 400:**
```json
{
  "message": "Usuário já possui esta role"
}
```

**Regras:**
- Requer role ADMIN
- Verificar se usuário existe
- Verificar se role existe e está ativa
- Verificar se usuário já não possui a role

---

#### DELETE /users/{username}/roles/{roleName}
Remove uma role do usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Role removida com sucesso"
}
```

**Response 404:**
```json
{
  "message": "Usuário não encontrado"
}
```

**Regras:**
- Requer role ADMIN
- Verificar se usuário existe
- Remover associação user-role

---

### 3. Roles

> Todos os endpoints de roles requerem autenticação e role ADMIN

#### GET /roles
Lista todas as roles.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "ROLE_ADMIN",
    "description": "Administrador do sistema com acesso total",
    "active": true
  },
  {
    "id": 2,
    "name": "ROLE_USER",
    "description": "Usuário padrão",
    "active": true
  }
]
```

**Regras:**
- Ordenar por name

---

#### GET /roles/{id}
Obtém role por ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "name": "ROLE_ADMIN",
  "description": "Administrador do sistema",
  "active": true
}
```

**Response 404:**
```json
{
  "message": "Role não encontrada"
}
```

---

#### POST /roles
Cria uma nova role.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "MANAGER",
  "description": "Gerente com acesso a relatórios"
}
```

**Response 201:**
```json
{
  "id": 3,
  "name": "ROLE_MANAGER",
  "description": "Gerente com acesso a relatórios",
  "active": true
}
```

**Response 400:**
```json
{
  "message": "Role com este nome já existe"
}
```

**Regras:**
- Se name não começar com "ROLE_", adicionar prefixo automaticamente
- Nome deve ser único
- Converter nome para UPPERCASE
- Criar com active = true

---

#### PUT /roles/{id}
Atualiza uma role.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "description": "Nova descrição da role"
}
```

**Response 200:**
```json
{
  "id": 1,
  "name": "ROLE_ADMIN",
  "description": "Nova descrição da role",
  "active": true
}
```

**Regras:**
- Não permitir alterar o name
- Apenas description pode ser alterado via PUT

---

#### POST /roles/{id}/enable
Ativa uma role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Role ativada com sucesso"
}
```

---

#### POST /roles/{id}/disable
Desativa uma role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Role desativada com sucesso"
}
```

**Regras:**
- Não permitir desativar ROLE_ADMIN

---

#### DELETE /roles/{id}
Deleta uma role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Role deletada com sucesso"
}
```

**Response 400:**
```json
{
  "message": "Não é possível deletar role em uso"
}
```

**Regras:**
- Não permitir deletar se houver usuários com esta role
- Não permitir deletar ROLE_ADMIN

---

### 4. Client Credentials

> Todos os endpoints requerem autenticação e role ADMIN

#### GET /api/client-credentials
Lista todos os client credentials.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "clientId": "srv-payments-prod",
    "clientName": "Payment Service",
    "description": "Serviço de processamento de pagamentos",
    "active": true,
    "lastUsedAt": "2024-04-20T10:30:00Z",
    "createdAt": "2024-01-10T10:00:00Z"
  }
]
```

**Regras:**
- NÃO retornar clientSecret
- Ordenar por clientName

---

#### GET /api/client-credentials/active
Lista apenas client credentials ativos.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "clientId": "srv-payments-prod",
    "clientName": "Payment Service",
    "description": "...",
    "active": true,
    "lastUsedAt": "2024-04-20T10:30:00Z",
    "createdAt": "2024-01-10T10:00:00Z"
  }
]
```

**Regras:**
- Filtrar apenas active = true

---

#### GET /api/client-credentials/{id}
Obtém client credential por ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "clientId": "srv-payments-prod",
  "clientName": "Payment Service",
  "description": "...",
  "active": true,
  "lastUsedAt": "2024-04-20T10:30:00Z",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

**Regras:**
- NÃO retornar clientSecret

---

#### POST /api/client-credentials
Cria um novo client credential.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "clientName": "New Service",
  "description": "Descrição do novo serviço"
}
```

**Response 201:**
```json
{
  "id": 6,
  "clientId": "srv-new-service-a1b2c3d4",
  "clientName": "New Service",
  "description": "Descrição do novo serviço",
  "active": true,
  "lastUsedAt": null,
  "createdAt": "2024-04-20T15:00:00Z",
  "clientSecret": "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3r"
}
```

**Regras:**
- Gerar clientId único: `srv-{clientName-kebab-case}-{8-chars-random}`
- Gerar clientSecret seguro (64 caracteres alfanuméricos)
- Armazenar clientSecret como hash (BCrypt)
- Retornar clientSecret em PLAIN TEXT apenas nesta resposta (única vez!)
- Criar com active = true

---

#### POST /api/client-credentials/{id}/enable
Ativa um client credential.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Client credential ativado com sucesso"
}
```

---

#### POST /api/client-credentials/{id}/disable
Desativa um client credential.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Client credential desativado com sucesso"
}
```

---

#### DELETE /api/client-credentials/{id}
Deleta um client credential.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Client credential deletado com sucesso"
}
```

---

#### POST /api/client-credentials/{id}/regenerate-secret
Regenera o secret de um client credential.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": 1,
  "clientId": "srv-payments-prod",
  "clientName": "Payment Service",
  "description": "...",
  "active": true,
  "lastUsedAt": "...",
  "createdAt": "...",
  "clientSecret": "novoSecretGerado7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9n"
}
```

**Regras:**
- Gerar novo clientSecret (64 caracteres)
- Armazenar como hash
- Retornar em PLAIN TEXT apenas nesta resposta
- O secret antigo é invalidado imediatamente

---

#### POST /api/client-credentials/cache/reload
Recarrega o cache de client credentials.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Cache recarregado com sucesso"
}
```

**Regras:**
- Limpar cache atual
- Recarregar todos os client credentials ativos do banco

---

#### GET /api/client-credentials/cache/stats
Retorna estatísticas do cache.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "size": 127,
  "hitCount": 15234,
  "missCount": 892,
  "hitRate": 0.9447
}
```

**Regras:**
- size: quantidade de itens no cache
- hitCount: total de cache hits
- missCount: total de cache misses
- hitRate: hitCount / (hitCount + missCount)

---

## Segurança

### JWT Token
- Algoritmo: HS256 ou RS256
- Claims obrigatórios:
  - sub: username
  - roles: array de role names
  - iat: issued at
  - exp: expiration (24h)

### Endpoints Públicos
- POST /auth/login

### Endpoints Protegidos (requer token válido)
- GET /users/me

### Endpoints Admin (requer token + ROLE_ADMIN)
- Todos os outros endpoints

### CORS
Configurar para permitir:
- Origin: http://localhost:3000 (desenvolvimento)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Authorization, Content-Type

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Bad Request (validação, regra de negócio) |
| 401 | Não autenticado |
| 403 | Não autorizado (sem permissão) |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

### Formato de Erro
```json
{
  "message": "Descrição do erro",
  "status": 400,
  "timestamp": "2024-04-20T10:00:00Z",
  "path": "/api/endpoint"
}
```

---

## Dados Iniciais (Seed)

### Roles
```sql
INSERT INTO roles (name, description, active) VALUES
('ROLE_ADMIN', 'Administrador do sistema com acesso total', true),
('ROLE_MANAGER', 'Gerente com acesso a relatórios e usuários', true),
('ROLE_USER', 'Usuário padrão com acesso básico', true);
```

### Usuário Admin
```sql
-- Password: admin123 (BCrypt hash)
INSERT INTO users (username, email, password, enabled) VALUES
('admin', 'admin@empresa.com', '$2a$10$...hash...', true);

INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
```

---

## Resumo de Endpoints

| # | Método | Endpoint | Auth | Role | Descrição |
|---|--------|----------|------|------|-----------|
| 1 | POST | /auth/login | - | - | Login |
| 2 | GET | /users/me | JWT | * | Usuário logado |
| 3 | GET | /users | JWT | ADMIN | Listar usuários |
| 4 | GET | /users/{id} | JWT | ADMIN | Obter usuário |
| 5 | POST | /users/{username}/enable | JWT | ADMIN | Ativar usuário |
| 6 | POST | /users/{username}/disable | JWT | ADMIN | Desativar usuário |
| 7 | POST | /users/{username}/roles/{roleName} | JWT | ADMIN | Adicionar role |
| 8 | DELETE | /users/{username}/roles/{roleName} | JWT | ADMIN | Remover role |
| 9 | GET | /roles | JWT | ADMIN | Listar roles |
| 10 | GET | /roles/{id} | JWT | ADMIN | Obter role |
| 11 | POST | /roles | JWT | ADMIN | Criar role |
| 12 | PUT | /roles/{id} | JWT | ADMIN | Atualizar role |
| 13 | POST | /roles/{id}/enable | JWT | ADMIN | Ativar role |
| 14 | POST | /roles/{id}/disable | JWT | ADMIN | Desativar role |
| 15 | DELETE | /roles/{id} | JWT | ADMIN | Deletar role |
| 16 | GET | /api/client-credentials | JWT | ADMIN | Listar credentials |
| 17 | GET | /api/client-credentials/active | JWT | ADMIN | Listar ativos |
| 18 | GET | /api/client-credentials/{id} | JWT | ADMIN | Obter credential |
| 19 | POST | /api/client-credentials | JWT | ADMIN | Criar credential |
| 20 | POST | /api/client-credentials/{id}/enable | JWT | ADMIN | Ativar |
| 21 | POST | /api/client-credentials/{id}/disable | JWT | ADMIN | Desativar |
| 22 | DELETE | /api/client-credentials/{id} | JWT | ADMIN | Deletar |
| 23 | POST | /api/client-credentials/{id}/regenerate-secret | JWT | ADMIN | Regenerar secret |
| 24 | POST | /api/client-credentials/cache/reload | JWT | ADMIN | Reload cache |
| 25 | GET | /api/client-credentials/cache/stats | JWT | ADMIN | Stats cache |

**Total: 25 endpoints**
