# SmartOps SaaS - Sistema Multi-Tenant Completo

Um sistema SaaS robusto e escalável construído com **React**, **TypeScript**, **tRPC**, **Drizzle ORM** e **MySQL**. Inclui módulos de **Dashboard**, **Financeiro**, **CRM** e **Inventário** com suporte completo a multi-tenant.

## 🚀 Características Principais

### Autenticação & RBAC
- ✅ Autenticação via OAuth (Manus)
- ✅ Sistema de Roles (Owner, Admin, User)
- ✅ Controle de acesso baseado em papéis
- ✅ Isolamento de dados multi-tenant

### Módulos Implementados
- ✅ **Dashboard**: KPIs, widgets configuráveis, visão geral do negócio
- ✅ **Financeiro**: Contas, transações, categorias, contas a pagar/receber, relatórios
- ✅ **CRM**: Leads, oportunidades, interações, pipeline de vendas, lead scoring
- ✅ **Inventário**: Produtos, fornecedores, movimentações, alertas de estoque

### Analytics & Relatórios
- ✅ Cash flow visualization
- ✅ Análise de despesas e receitas por categoria
- ✅ Pipeline de vendas com probabilidade
- ✅ Lead scoring automático
- ✅ Relatórios de inventário e rotatividade

### Gerenciamento Administrativo
- ✅ Painel administrativo (/admin)
- ✅ Gerenciamento de usuários e roles
- ✅ Histórico de pagamentos
- ✅ Logs de auditoria
- ✅ Extensão de período de trial

## 📋 Pré-requisitos

- Node.js 22+
- Docker & Docker Compose
- MySQL 8.0+
- pnpm (recomendado)

## 🛠️ Instalação Local

### 1. Clone o repositório
```bash
git clone https://github.com/kteckti/saas-system.git
cd saas-system
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL=mysql://root:root@localhost:3306/smartops
NODE_ENV=development
MANUS_OAUTH_ID=seu_id_oauth
MANUS_OAUTH_SECRET=seu_secret_oauth
OWNER_OPEN_ID=seu_open_id
```

### 3. Instale as dependências
```bash
pnpm install
```

### 4. Configure o banco de dados
```bash
pnpm run db:push
```

### 5. Inicie o servidor de desenvolvimento
```bash
pnpm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🐳 Deployment com Docker

### 1. Build da imagem Docker
```bash
docker build -t smartops:latest .
```

### 2. Execute com Docker Compose
```bash
docker-compose up -d
```

Isso iniciará:
- **MySQL**: Porta 3306
- **Aplicação**: Porta 3000

### 3. Acesse a aplicação
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
saas-system/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   └── index.html
├── server/                 # Backend Node.js
│   ├── routers/           # tRPC routers
│   │   ├── auth.ts
│   │   ├── organizations.ts
│   │   ├── financial.ts
│   │   ├── crm.ts
│   │   ├── inventory.ts
│   │   ├── admin.ts
│   │   ├── financial-analytics.ts
│   │   ├── crm-analytics.ts
│   │   └── inventory-analytics.ts
│   ├── _core/             # Core utilities
│   └── middleware/        # Middlewares
├── drizzle/               # Schema e migrações
│   ├── schema.ts          # Definição do banco
│   └── migrations/        # Histórico de migrações
├── shared/                # Código compartilhado
├── docker-compose.yml     # Configuração Docker
├── Dockerfile             # Imagem Docker
└── package.json           # Dependências
```

## 🔌 API Endpoints (tRPC)

### Autenticação
- `auth.me` - Obter usuário atual
- `auth.logout` - Fazer logout
- `auth.getCurrentOrganization` - Obter organização atual
- `auth.getOrganizationUsers` - Listar usuários da organização
- `auth.updateUserRole` - Atualizar role do usuário
- `auth.canAccessModule` - Verificar acesso ao módulo
- `auth.getActiveModules` - Obter módulos ativos

### Administração
- `admin.getOrganizationUsers` - Listar usuários
- `admin.updateUserRole` - Atualizar role
- `admin.updateUserStatus` - Atualizar status
- `admin.getSubscription` - Obter informações de assinatura
- `admin.updateSubscriptionStatus` - Atualizar status da assinatura
- `admin.getBillingHistory` - Histórico de pagamentos
- `admin.getAuditLogs` - Logs de auditoria
- `admin.extendTrialPeriod` - Estender período de trial

### Financeiro
- `financial.getAccounts` - Listar contas
- `financial.createAccount` - Criar conta
- `financial.getTransactions` - Listar transações
- `financial.createTransaction` - Criar transação
- `financial.getExpenseCategories` - Categorias de despesa
- `financial.getRevenueCategories` - Categorias de receita
- `financial.getAccountsPayable` - Contas a pagar
- `financial.getAccountsReceivable` - Contas a receber
- `financial.getSummary` - Resumo financeiro

### Analytics Financeiro
- `financialAnalytics.getCashFlow` - Fluxo de caixa
- `financialAnalytics.getExpenseBreakdown` - Análise de despesas
- `financialAnalytics.getRevenueBreakdown` - Análise de receitas
- `financialAnalytics.getFinancialReport` - Relatório financeiro

### CRM
- `crm.getLeads` - Listar leads
- `crm.createLead` - Criar lead
- `crm.getOpportunities` - Listar oportunidades
- `crm.createOpportunity` - Criar oportunidade
- `crm.getInteractions` - Interações de um lead
- `crm.createInteraction` - Registrar interação
- `crm.getPipelineStages` - Estágios do pipeline
- `crm.getSummary` - Resumo do CRM

### Analytics CRM
- `crmAnalytics.getSalesPipeline` - Visualização do pipeline
- `crmAnalytics.calculateLeadScore` - Calcular score do lead
- `crmAnalytics.getCRMReport` - Relatório do CRM
- `crmAnalytics.getLeadScoringInsights` - Insights de scoring

### Inventário
- `inventory.getProducts` - Listar produtos
- `inventory.createProduct` - Criar produto
- `inventory.getSuppliers` - Listar fornecedores
- `inventory.createSupplier` - Criar fornecedor
- `inventory.recordMovement` - Registrar movimentação
- `inventory.getMovements` - Listar movimentações
- `inventory.getLowStockAlerts` - Alertas de estoque baixo
- `inventory.getSummary` - Resumo de inventário

### Analytics Inventário
- `inventoryAnalytics.getInventoryReport` - Relatório de inventário
- `inventoryAnalytics.getMovementAnalytics` - Análise de movimentações
- `inventoryAnalytics.getStockAlertsSummary` - Resumo de alertas
- `inventoryAnalytics.getInventoryTurnover` - Rotatividade de inventário

## 🔐 Segurança

- ✅ Isolamento de dados multi-tenant em todas as queries
- ✅ Validação de permissões em todos os endpoints
- ✅ Proteção contra SQL injection com Drizzle ORM
- ✅ Autenticação obrigatória para rotas protegidas
- ✅ Logs de auditoria para ações importantes
- ✅ Controle de acesso baseado em roles

## 📊 Schema do Banco de Dados

### Tabelas Principais
- `organizations` - Tenants/Organizações
- `users` - Usuários com roles
- `modules` - Módulos disponíveis
- `tenantModules` - Módulos ativos por tenant
- `subscriptions` - Informações de assinatura
- `invoices` - Histórico de faturas

### Tabelas Financeiras
- `financialAccounts` - Contas bancárias/caixa
- `transactions` - Transações financeiras
- `expenseCategories` - Categorias de despesa
- `revenueCategories` - Categorias de receita
- `accountsPayable` - Contas a pagar
- `accountsReceivable` - Contas a receber

### Tabelas CRM
- `leads` - Leads/Prospects
- `opportunities` - Oportunidades de venda
- `interactions` - Histórico de interações
- `pipelineStages` - Estágios do pipeline

### Tabelas Inventário
- `products` - Produtos
- `suppliers` - Fornecedores
- `inventoryMovements` - Movimentações
- `stockAlerts` - Alertas de estoque

## 🧪 Testes

```bash
# Executar testes
pnpm run test

# Testes inclusos:
# - Autenticação e isolamento multi-tenant
# - Sistema RBAC
# - Cálculos financeiros
```

## 📝 Scripts Disponíveis

```bash
pnpm run dev           # Iniciar servidor de desenvolvimento
pnpm run build         # Build para produção
pnpm run start         # Iniciar servidor de produção
pnpm run check         # Verificar tipos TypeScript
pnpm run format        # Formatar código
pnpm run test          # Executar testes
pnpm run db:push       # Aplicar migrações do banco
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente Necessárias
```env
DATABASE_URL=mysql://user:password@host:3306/smartops
NODE_ENV=production
MANUS_OAUTH_ID=seu_id_oauth
MANUS_OAUTH_SECRET=seu_secret_oauth
OWNER_OPEN_ID=seu_open_id
STRIPE_SECRET_KEY=sua_chave_stripe
```

### Com Docker
```bash
docker build -t smartops:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e NODE_ENV=production \
  smartops:latest
```

### Com Vercel/Netlify
1. Conecte o repositório
2. Configure as variáveis de ambiente
3. Deploy automático em cada push

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

## 📄 Licença

MIT

## 🎯 Roadmap

- [ ] Integração com Stripe para pagamentos
- [ ] Landing page e website
- [ ] Autenticação com 2FA
- [ ] API REST adicional
- [ ] Mobile app (React Native)
- [ ] Webhooks customizáveis
- [ ] Integração com APIs externas
- [ ] Relatórios em PDF/Excel
- [ ] Notificações por email
- [ ] Backup automático

---

**Desenvolvido com ❤️ usando React, TypeScript e tRPC**
