# SmartOps SaaS - Sistema Multi-Tenant Completo

Um sistema SaaS robusto e escalável construído com **React**, **TypeScript**, **tRPC**, **Drizzle ORM** e **PostgreSQL**. Inclui módulos de **Dashboard**, **Financeiro**, **CRM** e **Inventário** com suporte completo a multi-tenant.

## 🔐 Credenciais de Acesso (Administrador)

| Campo    | Valor                    |
|----------|--------------------------|
| Email    | kteckti@gmail.com        |
| Senha    | SmartOps@2026!           |
| Role     | owner (acesso total)     |
| URL      | http://localhost:3000/login |

> **Importante:** Execute `docker compose run --rm migrate` após subir o Docker para criar as tabelas e o usuário admin automaticamente.

## 🚀 Início Rápido (Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/kteckti/saas-system.git
cd saas-system

# 2. Configure as variáveis de ambiente
cp .env.example .env
# As configurações padrão já funcionam com Docker

# 3. Suba o PostgreSQL + Aplicação
docker compose up -d

# 4. Execute as migrações e crie o usuário admin
docker compose run --rm migrate

# 5. Acesse o sistema
open http://localhost:3000/login
```

## 🛠️ Desenvolvimento Local

```bash
# Pré-requisitos: Node.js 22+, pnpm, PostgreSQL 16+

# 1. Instale as dependências
pnpm install

# 2. Configure o banco PostgreSQL local
# Crie um banco chamado 'smartops' no PostgreSQL
# Edite DATABASE_URL no .env

# 3. Execute as migrações
pnpm run db:push

# 4. Crie o usuário admin
pnpm run db:seed

# 5. Inicie o servidor de desenvolvimento
pnpm run dev
```

## 🚀 Características Principais

### Autenticação & RBAC
- Login local com email/senha (bcryptjs, JWT)
- Autenticação via OAuth (Manus) — opcional
- Sistema de Roles (Owner, Admin, User)
- Controle de acesso baseado em papéis
- Isolamento de dados multi-tenant

### Módulos Implementados
- **Dashboard**: KPIs, widgets configuráveis, visão geral do negócio
- **Financeiro**: Contas, transações, categorias, contas a pagar/receber, relatórios
- **CRM**: Leads, oportunidades, interações, pipeline de vendas, lead scoring, atribuição de leads
- **Inventário**: Produtos, fornecedores, movimentações, alertas de estoque, gestão barcode/SKU

### Analytics & Relatórios
- Cash flow visualization
- Análise de despesas e receitas por categoria
- Pipeline de vendas com probabilidade
- Lead scoring automático
- Relatórios de inventário e rotatividade

### Gerenciamento Administrativo
- Painel administrativo
- Gerenciamento de usuários e roles
- Histórico de pagamentos
- Logs de auditoria
- Extensão de período de trial

## 🗄️ Banco de Dados (PostgreSQL)

O projeto usa **PostgreSQL 16** como banco de dados principal.

### Configuração Local

```env
DATABASE_URL=postgresql://smartops:SmartOps@2026!@localhost:5432/smartops
```

### Produção (Vercel/Neon/Supabase)

```env
DATABASE_URL=postgresql://user:password@host:5432/smartops?sslmode=require
```

### Comandos

```bash
pnpm run db:push    # Gera e aplica migrações
pnpm run db:seed    # Cria dados iniciais (admin user, módulos)
pnpm run db:studio  # Abre o Drizzle Studio (GUI do banco)
pnpm run db:reset   # Reseta e recria o banco
```

## 📁 Estrutura do Projeto

```
saas-system/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/          # Home, Login, Dashboard, Settings
│       ├── _core/          # Hooks, contextos, utilitários
│       └── components/     # Componentes UI (shadcn/ui)
├── server/                 # Backend Express + tRPC
│   ├── routers/            # Routers tRPC por módulo
│   │   ├── auth.ts         # OAuth auth
│   │   ├── auth-local.ts   # Email/senha auth (NOVO)
│   │   ├── organizations.ts
│   │   ├── financial.ts
│   │   ├── crm.ts
│   │   ├── inventory.ts
│   │   ├── admin.ts
│   │   ├── financial-analytics.ts
│   │   ├── crm-analytics.ts
│   │   ├── crm-assignment.ts    # Atribuição de leads (NOVO)
│   │   ├── inventory-analytics.ts
│   │   ├── inventory-barcode.ts # Barcode/SKU (NOVO)
│   │   └── dashboard-widgets.ts # Widgets (NOVO)
│   ├── _core/              # SDK, contexto, env, OAuth
│   ├── db.ts               # Conexão PostgreSQL
│   ├── rbac.ts             # Sistema de permissões
│   └── seed.ts             # Script de seed (NOVO)
├── drizzle/                # Schema e migrações
│   ├── schema.ts           # Schema PostgreSQL completo
│   ├── relations.ts        # Relações entre tabelas
│   └── 0001_postgres_migration.sql  # Migração SQL (NOVO)
├── Dockerfile              # Build multi-stage
├── docker-compose.yml      # PostgreSQL 16 + App
└── .env.example            # Variáveis de ambiente
```

## 📦 Módulos

| Módulo      | Slug        | Preço/mês | Funcionalidades |
|-------------|-------------|-----------|-----------------|
| Dashboard   | dashboard   | Grátis    | KPIs, widgets, analytics |
| Financeiro  | financial   | R$ 99     | Transações, contas, relatórios |
| CRM         | crm         | R$ 149    | Leads, pipeline, interações |
| Estoque     | inventory   | R$ 129    | Produtos, fornecedores, alertas |

## 👥 RBAC (Controle de Acesso)

| Role  | Permissões |
|-------|------------|
| owner | Tudo: gerenciar organização, usuários, módulos, billing |
| admin | Gerenciar usuários, configurações, analytics |
| user  | Acessar módulos atribuídos, analytics básico |

## 🐳 Docker Compose

```yaml
services:
  db:      # PostgreSQL 16
  app:     # SmartOps Application
  migrate: # Migrations + Seed (runs once)
```

## 🌐 Deploy no Vercel

1. Crie um banco PostgreSQL no [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente no Vercel:
   ```
   DATABASE_URL=postgresql://...?sslmode=require
   JWT_SECRET=your-secret-min-32-chars
   OWNER_OPEN_ID=local_admin_kteckti
   ```
3. Execute o seed após o deploy:
   ```bash
   DATABASE_URL=postgresql://... pnpm run db:seed
   ```

## 📡 API (tRPC Routers)

| Router               | Descrição |
|----------------------|-----------|
| `auth`               | Autenticação OAuth, me, logout |
| `authLocal`          | Login email/senha, alterar senha |
| `organizations`      | Gestão de organizações |
| `financial`          | Módulo financeiro |
| `financialAnalytics` | Analytics financeiro |
| `crm`                | Módulo CRM |
| `crmAnalytics`       | Analytics CRM |
| `crmAssignment`      | Atribuição de leads |
| `inventory`          | Módulo estoque |
| `inventoryAnalytics` | Analytics estoque |
| `inventoryBarcode`   | Gestão barcode/SKU |
| `dashboardWidgets`   | Widgets customizáveis |
| `admin`              | Painel administrativo |

## 📝 Scripts Disponíveis

```bash
pnpm run dev           # Iniciar servidor de desenvolvimento
pnpm run build         # Build para produção
pnpm run start         # Iniciar servidor de produção
pnpm run check         # Verificar tipos TypeScript
pnpm run test          # Executar testes
pnpm run db:push       # Aplicar migrações do banco
pnpm run db:seed       # Criar dados iniciais
pnpm run db:studio     # Abrir Drizzle Studio
```

## 🔧 Variáveis de Ambiente

Veja `.env.example` para a lista completa.

### Obrigatórias

```env
DATABASE_URL=postgresql://smartops:SmartOps@2026!@localhost:5432/smartops
JWT_SECRET=min-32-chars-secret
```

### Opcionais

```env
VITE_APP_ID=         # OAuth Manus App ID
OAUTH_SERVER_URL=    # OAuth Server URL
STRIPE_SECRET_KEY=   # Stripe (pagamentos)
AWS_ACCESS_KEY_ID=   # S3 (arquivos)
SMTP_HOST=           # Email (notificações)
```

## 🎯 Roadmap

- [ ] Integração com Stripe para pagamentos
- [ ] CI/CD com GitHub Actions
- [ ] Autenticação com 2FA
- [ ] Mobile app (React Native)
- [ ] Relatórios em PDF/Excel
- [ ] Notificações por email

---

**Desenvolvido com React, TypeScript, tRPC e PostgreSQL**
