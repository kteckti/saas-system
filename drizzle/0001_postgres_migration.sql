-- ============================================================================
-- SmartOps SaaS - PostgreSQL Migration
-- Migração completa do MySQL para PostgreSQL
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE theme AS ENUM ('light', 'dark');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'trial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'cash', 'investment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payable_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost', 'converted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'note', 'task');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'inactive', 'discontinued');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE supplier_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'return');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('low_stock', 'out_of_stock', 'overstock');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE widget_size AS ENUM ('small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Organizations
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT,
  "logo" TEXT,
  "website" VARCHAR(255),
  "industry" VARCHAR(100),
  "country" VARCHAR(2),
  "timezone" VARCHAR(50) DEFAULT 'UTC',
  "theme" theme DEFAULT 'light',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  "email" VARCHAR(320) NOT NULL,
  "name" TEXT,
  "avatar" TEXT,
  "passwordHash" TEXT,
  "role" user_role DEFAULT 'user' NOT NULL,
  "status" user_status DEFAULT 'active' NOT NULL,
  "theme" theme DEFAULT 'light',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Modules
CREATE TABLE IF NOT EXISTS "modules" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "slug" VARCHAR(100) NOT NULL UNIQUE,
  "description" TEXT,
  "icon" VARCHAR(50),
  "monthlyPrice" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tenant Modules
CREATE TABLE IF NOT EXISTS "tenantModules" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "moduleId" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT FALSE,
  "activatedAt" TIMESTAMP,
  "deactivatedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL UNIQUE,
  "stripeCustomerId" VARCHAR(255),
  "stripeSubscriptionId" VARCHAR(255),
  "status" subscription_status DEFAULT 'trial',
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "canceledAt" TIMESTAMP,
  "trialEndsAt" TIMESTAMP,
  "monthlyAmount" DECIMAL(10,2) DEFAULT '0',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "stripeInvoiceId" VARCHAR(255),
  "amount" DECIMAL(10,2) NOT NULL,
  "status" invoice_status DEFAULT 'draft',
  "pdfUrl" TEXT,
  "invoiceNumber" VARCHAR(50),
  "dueDate" TIMESTAMP,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Financial Accounts
CREATE TABLE IF NOT EXISTS "financialAccounts" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "type" account_type NOT NULL,
  "balance" DECIMAL(15,2) DEFAULT '0',
  "currency" VARCHAR(3) DEFAULT 'BRL',
  "bankName" VARCHAR(255),
  "accountNumber" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS "expenseCategories" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "color" VARCHAR(7),
  "icon" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Revenue Categories
CREATE TABLE IF NOT EXISTS "revenueCategories" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "color" VARCHAR(7),
  "icon" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "accountId" INTEGER NOT NULL,
  "type" transaction_type NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'BRL',
  "description" TEXT,
  "categoryId" INTEGER,
  "relatedTransactionId" INTEGER,
  "status" transaction_status DEFAULT 'completed',
  "transactionDate" TIMESTAMP NOT NULL,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Accounts Payable
CREATE TABLE IF NOT EXISTS "accountsPayable" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "supplierId" INTEGER,
  "description" VARCHAR(255) NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "status" payable_status DEFAULT 'pending',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Accounts Receivable
CREATE TABLE IF NOT EXISTS "accountsReceivable" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "customerId" INTEGER,
  "description" VARCHAR(255) NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "status" payable_status DEFAULT 'pending',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Leads
CREATE TABLE IF NOT EXISTS "leads" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100),
  "email" VARCHAR(320),
  "phone" VARCHAR(20),
  "company" VARCHAR(255),
  "position" VARCHAR(100),
  "source" VARCHAR(100),
  "status" lead_status DEFAULT 'new',
  "score" INTEGER DEFAULT 0,
  "assignedTo" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Opportunities
CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "leadId" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "value" DECIMAL(15,2) NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'BRL',
  "stage" VARCHAR(100) NOT NULL,
  "probability" INTEGER DEFAULT 0,
  "expectedCloseDate" TIMESTAMP,
  "assignedTo" INTEGER,
  "status" opportunity_status DEFAULT 'open',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Interactions
CREATE TABLE IF NOT EXISTS "interactions" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "leadId" INTEGER NOT NULL,
  "type" interaction_type NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "duration" INTEGER,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS "pipelineStages" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL,
  "color" VARCHAR(7),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "sku" VARCHAR(100) NOT NULL,
  "barcode" VARCHAR(100),
  "description" TEXT,
  "category" VARCHAR(100),
  "quantity" INTEGER DEFAULT 0,
  "minQuantity" INTEGER DEFAULT 0,
  "unitPrice" DECIMAL(15,2) NOT NULL,
  "costPrice" DECIMAL(15,2),
  "currency" VARCHAR(3) DEFAULT 'BRL',
  "supplier" VARCHAR(255),
  "status" product_status DEFAULT 'active',
  "image" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320),
  "phone" VARCHAR(20),
  "address" TEXT,
  "city" VARCHAR(100),
  "state" VARCHAR(100),
  "country" VARCHAR(100),
  "zipCode" VARCHAR(20),
  "website" VARCHAR(255),
  "contactPerson" VARCHAR(255),
  "paymentTerms" VARCHAR(100),
  "status" supplier_status DEFAULT 'active',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS "inventoryMovements" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "productId" INTEGER NOT NULL,
  "type" movement_type NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" VARCHAR(255),
  "reference" VARCHAR(100),
  "notes" TEXT,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Stock Alerts
CREATE TABLE IF NOT EXISTS "stockAlerts" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "productId" INTEGER NOT NULL,
  "alertType" alert_type NOT NULL,
  "isResolved" BOOLEAN DEFAULT FALSE,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS "dashboardWidgets" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "userId" INTEGER NOT NULL,
  "widgetType" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "position" INTEGER DEFAULT 0,
  "size" widget_size DEFAULT 'medium',
  "config" JSONB,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS "auditLogs" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" VARCHAR(64) NOT NULL,
  "userId" INTEGER,
  "action" VARCHAR(255) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" INTEGER,
  "changes" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant ON "users" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_users_email ON "users" ("email");
CREATE INDEX IF NOT EXISTS idx_users_openid ON "users" ("openId");
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON "leads" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON "transactions" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_products_tenant ON "products" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON "auditLogs" ("tenantId");
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON "tenantModules" ("tenantId");
