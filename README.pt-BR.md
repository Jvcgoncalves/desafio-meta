# CaseCellShop

CaseCellShop é um pequeno projeto fullstack de checkout para capas de celular. Ele demonstra navegação pública por produtos, login com usuário semeado, checkout autenticado, reserva atômica de estoque, criação de pedidos idempotente, processamento com ERP falso, consulta de status do pedido, contratos compartilhados entre API/frontend, execução local com Docker e testes automatizados.

## Stack

- Monorepo: pnpm workspaces e Turborepo
- API: Node.js, TypeScript, Fastify, Prisma, PostgreSQL, JWT, bcrypt, Zod, Pino
- Web: React, TypeScript, Vite, Tailwind CSS v3, Vitest, Testing Library
- Contratos compartilhados: pacote de workspace `@casecellshop/shared`

## Estrutura do Monorepo

```text
apps/
  api/       API Fastify, schema Prisma, testes do backend
  web/       Storefront React, testes do frontend
packages/
  shared/    DTOs, envelopes da API, códigos de erro, schemas Zod, tipos de status do pedido
  tsconfig/  configurações TypeScript compartilhadas
```

`packages/shared` é a única fonte dos contratos de comunicação entre API e frontend. A API e a aplicação web importam DTOs, schemas, códigos de erro e tipos de status desse pacote, em vez de duplicá-los.

## Configuração

Requisitos:

- Node.js 22+
- Corepack
- Docker e Docker Compose para o PostgreSQL local e o caminho de execução local

Instale as dependências:

```bash
corepack enable pnpm
pnpm install
```

Copie os exemplos de ambiente ao executar as aplicações fora do Docker:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Credenciais de demonstração semeadas:

```text
Email: demo@casecellshop.local
Password: demo123
```

## Comandos Locais

```bash
pnpm turbo run build
pnpm turbo run typecheck
pnpm turbo run lint
pnpm turbo run test
pnpm turbo run test:integration
pnpm turbo run dev
```

Exemplos com escopo por pacote:

```bash
pnpm --filter api dev
pnpm --filter web dev
pnpm turbo run test typecheck lint --filter=web
```

## Banco de Dados

Inicie o PostgreSQL:

```bash
docker compose up -d postgres
```

Execute as migrations e semeie os dados pelo host:

```bash
pnpm --filter api prisma:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

O seed cria o usuário de demonstração com hash de senha bcrypt e onze produtos de exemplo de capas de celular.

## Docker

Faça o build e inicie o runtime:

```bash
docker compose up --build
```

Serviços:

- PostgreSQL: `localhost:5432`
- API: `http://localhost:3000`
- Documentação da API: `http://localhost:3000/docs`
- Web: `http://localhost:5173`

As imagens Docker são construídas a partir da raiz do monorepo para que `apps/api` e `apps/web` possam acessar `packages/shared` durante a instalação e o build.

Migration e seed são intencionalmente explícitos. Depois que os serviços estiverem ativos, execute:

```bash
docker compose exec api pnpm --filter api db:migrate
docker compose exec api pnpm --filter api db:seed
```

Se a porta `5173` estiver ocupada durante `docker compose up --build`, interrompa o processo local que usa essa porta e recrie o serviço web:

```bash
docker compose up -d --force-recreate web
```

## Variáveis de Ambiente

API:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://casecellshop:casecellshop@localhost:5432/casecellshop?schema=public
JWT_SECRET=local-development-secret
PENDING_ORDERS_WORKER_INTERVAL_MS=10000
```

Web:

```text
VITE_API_URL=http://localhost:3000
```

Para um segredo JWT local mais forte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Endpoints da API

| Método | Caminho | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Não | Health check |
| `POST` | `/auth/login` | Não | Login com credenciais semeadas |
| `GET` | `/products` | Não | Lista produtos |
| `GET` | `/products/:productId` | Não | Carrega o detalhe do produto |
| `POST` | `/orders` | Bearer JWT | Cria pedido com `Idempotency-Key` |
| `GET` | `/orders/:orderId` | Não | Carrega o status público do pedido |

Todas as respostas de sucesso usam:

```ts
ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  traceId?: string;
}
```

Todos os erros conhecidos usam:

```ts
ApiErrorResponse = {
  success: false;
  message: string;
  error: { code: AppErrorCode; details?: unknown };
  traceId: string;
}
```

Códigos de erro:

- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `PRODUCT_NOT_FOUND`
- `ORDER_NOT_FOUND`
- `IDEMPOTENCY_KEY_REQUIRED`
- `DUPLICATE_ORDER_CONFLICT`
- `STOCK_INSUFFICIENT`
- `ERP_TEMPORARY_FAILURE`
- `INTERNAL_ERROR`

## Comportamento do Checkout

O checkout é enviado apenas como intenção. O backend valida a requisição, verifica a autenticação, compara hashes de idempotência, reserva estoque no PostgreSQL, persiste os itens do pedido e dispara o fluxo do ERP falso.

Segurança do estoque:

- `available_stock` e `reserved_stock` ficam no PostgreSQL.
- A reserva é uma atualização condicional no banco de dados dentro da transação do pedido.
- Se nenhuma linha puder ser atualizada, a API retorna `STOCK_INSUFFICIENT`.
- Pedidos confirmados consomem o estoque reservado.
- Reservas expiradas liberam o estoque reservado.

Idempotência:

- A chave única é `(user_id, idempotency_key)`.
- O service gera o hash de um payload de requisição normalizado.
- Mesma chave e mesmo payload retornam o resultado do pedido existente.
- Mesma chave e payload diferente retornam `DUPLICATE_ORDER_CONFLICT`.

Simulação do ERP:

- Pedidos confirmados retornam `201` e `CONFIRMED`.
- Processamento atrasado retorna `202` e `PENDING_ERP`; o status pode ser consultado depois.
- Falha temporária do processador retorna `503` e `ERP_TEMPORARY_FAILURE` antes de aceitar o pedido.
- O worker de pedidos pendentes pode transicionar pedidos pendentes para `CONFIRMED`, `FAILED_TEMPORARY` ou `EXPIRED`.

## Testes

Os testes do backend ficam em `apps/api/tests/` e incluem cobertura unitária, de integração e de concorrência.

Os testes do frontend ficam ao lado dos módulos React em `apps/web/src/` e cobrem:

- cobertura de `error-mapper.ts` para todos os códigos de erro compartilhados
- geração da chave de idempotência e reuso em novas tentativas
- renderização do badge de status para todos os status de pedido compartilhados
- validação de quantidade e comportamento de decremento bloqueado
- snapshots para cards de produto, carregamento do checkout e estados de feedback

Execute todos os testes dos pacotes:

```bash
pnpm turbo run test
```

Execute a verificação final principal:

```bash
pnpm turbo run build test typecheck
```

Esse comando espera PostgreSQL em `localhost:5432` quando os testes de integração da API estiverem habilitados por `apps/api/vitest.config.ts`.

## Arquitetura

```mermaid
flowchart LR
  Browser[Aplicação web React] -->|chamadas tipadas de service| API[API Fastify]
  API --> Shared["@casecellshop/shared contracts"]
  Browser --> Shared
  API --> Prisma[Prisma client]
  Prisma --> Postgres[(PostgreSQL)]
  API --> ERP[Serviço ERP falso]
  Worker[Worker de pedidos pendentes] --> ERP
  Worker --> Prisma
```

## Fluxo de Checkout

```mermaid
sequenceDiagram
  participant U as Usuário
  participant W as Web
  participant A as API
  participant DB as PostgreSQL
  participant E as ERP falso

  U->>W: Seleciona produto e quantidade
  W->>A: POST /orders com JWT e Idempotency-Key
  A->>A: Valida body e autenticação
  A->>DB: Verifica chave de idempotência e hash da requisição
  A->>DB: Reserva estoque atomicamente
  A->>DB: Persiste pedido, itens e registro de idempotência
  A->>E: Dispara processamento no ERP
  E-->>A: Confirmado, atrasado ou falha temporária
  A-->>W: 201 CONFIRMED, 202 PENDING_ERP ou erro conhecido
  W-->>U: Renderiza feedback e link de status
```

## Fluxo de Ações do Usuário

```mermaid
flowchart TD
  Browse[Navegar por produtos] --> Login{Está logado?}
  Login -- Não --> Auth[Login com usuário demo]
  Auth --> Quantity[Escolher quantidade]
  Login -- Sim --> Quantity
  Quantity --> Valid{Inteiro positivo válido?}
  Valid -- Não --> Fix[Mostrar validação e manter controles habilitados]
  Fix --> Quantity
  Valid -- Sim --> Submit[Enviar checkout]
  Submit --> Result{Resultado da API}
  Result -- Confirmado --> Confirmed[Mostrar sucesso e link de status]
  Result -- Pendente --> Pending[Mostrar processamento e link de status]
  Result -- Erro de estoque --> Refresh[Oferecer atualização do estoque do produto]
  Result -- Erro recuperável --> Retry[Permitir nova tentativa ou nova intenção]
```

## Modelo do Banco de Dados

```mermaid
erDiagram
  users ||--o{ orders : cria
  users ||--o{ idempotency_keys : possui
  orders ||--o{ order_items : contem
  products ||--o{ order_items : reservado_como
  orders ||--o{ idempotency_keys : resultado

  users {
    uuid id PK
    string email UK
    string password_hash
  }

  products {
    uuid id PK
    string name
    string model
    int available_stock
    int reserved_stock
    int price_cents
  }

  orders {
    uuid id PK
    uuid user_id FK
    enum status
    int total_cents
    datetime reservation_expires_at
  }

  order_items {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int quantity
    int unit_price_cents
    int line_total_cents
  }

  idempotency_keys {
    uuid id PK
    uuid user_id FK
    string idempotency_key
    string request_hash
    uuid order_id FK
  }
```

## Portas e Classes da API

```mermaid
classDiagram
  class OrdersController {
    +create()
    +status()
  }
  class CreateOrderService {
    +createOrder()
  }
  class GetOrderStatusService {
    +getOrderStatus()
  }
  class OrderRepository
  class IdempotencyRepository
  class ProductRepository
  class FakeErpService
  class PendingOrdersWorker

  OrdersController --> CreateOrderService
  OrdersController --> GetOrderStatusService
  CreateOrderService --> OrderRepository
  CreateOrderService --> IdempotencyRepository
  CreateOrderService --> ProductRepository
  CreateOrderService --> FakeErpService
  GetOrderStatusService --> OrderRepository
  PendingOrdersWorker --> OrderRepository
  PendingOrdersWorker --> ProductRepository
  PendingOrdersWorker --> FakeErpService
```

## Observabilidade

O processamento do checkout emite logs estruturados com IDs de rastreio da requisição e campos contextuais como ID do usuário, ID do pedido, chave de idempotência, nome da etapa e status do resultado. Os erros da API também retornam `traceId` no envelope padrão.

## Limitações

- O armazenamento do JWT usa local storage para simplificar o desafio.
- `GET /orders/:orderId` é público por ID e não retorna dados sensíveis do usuário.
- O worker de pedidos pendentes roda no processo da API e não é escalável horizontalmente.
- Pagamento, faturamento, perfis de cliente, gerenciamento administrativo de catálogo e integração real com ERP estão fora do escopo.
- A inicialização do Docker não executa migrations nem seed automaticamente; esses comandos estão documentados explicitamente.

## Próximos Passos

- Substituir o worker em processo por uma fila real para deployments com múltiplas instâncias.
- Adicionar autenticação baseada em refresh token e armazenamento mais seguro de token no navegador.
- Adicionar uma superfície administrativa de gerenciamento de estoque de produtos.
- Adicionar testes end-to-end no navegador contra o runtime Docker.
