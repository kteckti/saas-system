CREATE TYPE "public"."account_type" AS ENUM('bank', 'credit_card', 'cash', 'investment');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('low_stock', 'out_of_stock', 'overstock');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('call', 'email', 'meeting', 'note', 'task');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'void', 'uncollectible');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'lost', 'converted');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('in', 'out', 'adjustment', 'return');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('open', 'won', 'lost', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."payable_status" AS ENUM('pending', 'partial', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'unpaid', 'trial');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."widget_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TABLE "accountsPayable" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"supplierId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"dueDate" timestamp NOT NULL,
	"status" "payable_status" DEFAULT 'pending',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accountsReceivable" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"customerId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"dueDate" timestamp NOT NULL,
	"status" "payable_status" DEFAULT 'pending',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"userId" integer,
	"action" varchar(255) NOT NULL,
	"entityType" varchar(100) NOT NULL,
	"entityId" integer,
	"changes" json,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboardWidgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"userId" integer NOT NULL,
	"widgetType" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"position" integer DEFAULT 0,
	"size" "widget_size" DEFAULT 'medium',
	"config" json,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenseCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financialAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "account_type" NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'BRL',
	"bankName" varchar(255),
	"accountNumber" varchar(50),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"leadId" integer NOT NULL,
	"type" "interaction_type" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"duration" integer,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventoryMovements" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"productId" integer NOT NULL,
	"type" "movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(255),
	"reference" varchar(100),
	"notes" text,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"stripeInvoiceId" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft',
	"pdfUrl" text,
	"invoiceNumber" varchar(50),
	"dueDate" timestamp,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100),
	"email" varchar(320),
	"phone" varchar(20),
	"company" varchar(255),
	"position" varchar(100),
	"source" varchar(100),
	"status" "lead_status" DEFAULT 'new',
	"score" integer DEFAULT 0,
	"assignedTo" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"monthlyPrice" numeric(10, 2) NOT NULL,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modules_name_unique" UNIQUE("name"),
	CONSTRAINT "modules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"leadId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"value" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL',
	"stage" varchar(100) NOT NULL,
	"probability" integer DEFAULT 0,
	"expectedCloseDate" timestamp,
	"assignedTo" integer,
	"status" "opportunity_status" DEFAULT 'open',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"logo" text,
	"website" varchar(255),
	"industry" varchar(100),
	"country" varchar(2),
	"timezone" varchar(50) DEFAULT 'UTC',
	"theme" "theme" DEFAULT 'light',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_tenantId_unique" UNIQUE("tenantId"),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pipelineStages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"order" integer NOT NULL,
	"color" varchar(7),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"description" text,
	"category" varchar(100),
	"quantity" integer DEFAULT 0,
	"minQuantity" integer DEFAULT 0,
	"unitPrice" numeric(15, 2) NOT NULL,
	"costPrice" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'BRL',
	"supplier" varchar(255),
	"status" "product_status" DEFAULT 'active',
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenueCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stockAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"productId" integer NOT NULL,
	"alertType" "alert_type" NOT NULL,
	"isResolved" boolean DEFAULT false,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"status" "subscription_status" DEFAULT 'trial',
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"canceledAt" timestamp,
	"trialEndsAt" timestamp,
	"monthlyAmount" numeric(10, 2) DEFAULT '0',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_tenantId_unique" UNIQUE("tenantId")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"zipCode" varchar(20),
	"website" varchar(255),
	"contactPerson" varchar(255),
	"paymentTerms" varchar(100),
	"status" "supplier_status" DEFAULT 'active',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenantModules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"moduleId" integer NOT NULL,
	"isActive" boolean DEFAULT false,
	"activatedAt" timestamp,
	"deactivatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"accountId" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL',
	"description" text,
	"categoryId" integer,
	"relatedTransactionId" integer,
	"status" "transaction_status" DEFAULT 'completed',
	"transactionDate" timestamp NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" varchar(64) NOT NULL,
	"openId" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" text,
	"avatar" text,
	"passwordHash" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"theme" "theme" DEFAULT 'light',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
