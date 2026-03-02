import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  serial,
  unique,
} from "drizzle-orm/pg-core";

/**
 * MULTI-TENANT ARCHITECTURE:
 * Every table includes tenantId to ensure complete data isolation between organizations.
 * This is the foundation of the multi-tenant SaaS system.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "user"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);
export const themeEnum = pgEnum("theme", ["light", "dark"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "unpaid", "trial"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "open", "paid", "void", "uncollectible"]);
export const accountTypeEnum = pgEnum("account_type", ["bank", "credit_card", "cash", "investment"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "transfer"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "canceled"]);
export const payableStatusEnum = pgEnum("payable_status", ["pending", "partial", "paid", "overdue"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "lost", "converted"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["open", "won", "lost", "suspended"]);
export const interactionTypeEnum = pgEnum("interaction_type", ["call", "email", "meeting", "note", "task"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "discontinued"]);
export const supplierStatusEnum = pgEnum("supplier_status", ["active", "inactive"]);
export const movementTypeEnum = pgEnum("movement_type", ["in", "out", "adjustment", "return"]);
export const alertTypeEnum = pgEnum("alert_type", ["low_stock", "out_of_stock", "overstock"]);
export const widgetSizeEnum = pgEnum("widget_size", ["small", "medium", "large"]);

// ============================================================================
// CORE AUTHENTICATION & ORGANIZATION TABLES
// ============================================================================

/**
 * Organizations/Tenants table
 * Each organization is a separate tenant with isolated data
 */
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 2 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  theme: themeEnum("theme").default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Users table with RBAC
 * Each user belongs to an organization (tenant) with a specific role
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name"),
  avatar: text("avatar"),
  // Autenticação por senha (opcional - para login local)
  passwordHash: text("passwordHash"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  theme: themeEnum("theme").default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// MODULE MANAGEMENT TABLES
// ============================================================================

/**
 * Modules table
 * Defines available modules: Dashboard, Financial, CRM, Inventory
 */
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

/**
 * Tenant Modules table
 * Maps which modules are active for each tenant
 */
export const tenantModules = pgTable("tenantModules", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  moduleId: integer("moduleId").notNull(),
  isActive: boolean("isActive").default(false),
  activatedAt: timestamp("activatedAt"),
  deactivatedAt: timestamp("deactivatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TenantModule = typeof tenantModules.$inferSelect;
export type InsertTenantModule = typeof tenantModules.$inferInsert;

// ============================================================================
// SUBSCRIPTION & BILLING TABLES
// ============================================================================

/**
 * Subscriptions table
 * Manages tenant subscriptions and billing
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: subscriptionStatusEnum("status").default("trial"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  monthlyAmount: decimal("monthlyAmount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Invoices table
 * Stores billing invoices for each tenant
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("draft"),
  pdfUrl: text("pdfUrl"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ============================================================================
// FINANCIAL MODULE TABLES
// ============================================================================

/**
 * Financial Accounts table
 */
export const financialAccounts = pgTable("financialAccounts", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  bankName: varchar("bankName", { length: 255 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = typeof financialAccounts.$inferInsert;

/**
 * Expense Categories table
 */
export const expenseCategories = pgTable("expenseCategories", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Revenue Categories table
 */
export const revenueCategories = pgTable("revenueCategories", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RevenueCategory = typeof revenueCategories.$inferSelect;
export type InsertRevenueCategory = typeof revenueCategories.$inferInsert;

/**
 * Transactions table
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  accountId: integer("accountId").notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  description: text("description"),
  categoryId: integer("categoryId"),
  relatedTransactionId: integer("relatedTransactionId"),
  status: transactionStatusEnum("status").default("completed"),
  transactionDate: timestamp("transactionDate").notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Accounts Payable table
 */
export const accountsPayable = pgTable("accountsPayable", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  supplierId: integer("supplierId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: payableStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AccountsPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountsPayable = typeof accountsPayable.$inferInsert;

/**
 * Accounts Receivable table
 */
export const accountsReceivable = pgTable("accountsReceivable", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  customerId: integer("customerId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: payableStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AccountsReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountsReceivable = typeof accountsReceivable.$inferInsert;

// ============================================================================
// CRM MODULE TABLES
// ============================================================================

/**
 * Leads table
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  source: varchar("source", { length: 100 }),
  status: leadStatusEnum("status").default("new"),
  score: integer("score").default(0),
  assignedTo: integer("assignedTo"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Opportunities table
 */
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  leadId: integer("leadId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  stage: varchar("stage", { length: 100 }).notNull(),
  probability: integer("probability").default(0),
  expectedCloseDate: timestamp("expectedCloseDate"),
  assignedTo: integer("assignedTo"),
  status: opportunityStatusEnum("status").default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Interactions table
 */
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  leadId: integer("leadId").notNull(),
  type: interactionTypeEnum("type").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  duration: integer("duration"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Sales Pipeline Stages table
 */
export const pipelineStages = pgTable("pipelineStages", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").notNull(),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

// ============================================================================
// INVENTORY MODULE TABLES
// ============================================================================

/**
 * Products table
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  quantity: integer("quantity").default(0),
  minQuantity: integer("minQuantity").default(0),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  costPrice: decimal("costPrice", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  supplier: varchar("supplier", { length: 255 }),
  status: productStatusEnum("status").default("active"),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Suppliers table
 */
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  zipCode: varchar("zipCode", { length: 20 }),
  website: varchar("website", { length: 255 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  status: supplierStatusEnum("status").default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Inventory Movements table
 */
export const inventoryMovements = pgTable("inventoryMovements", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  productId: integer("productId").notNull(),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

/**
 * Stock Alerts table
 */
export const stockAlerts = pgTable("stockAlerts", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  productId: integer("productId").notNull(),
  alertType: alertTypeEnum("alertType").notNull(),
  isResolved: boolean("isResolved").default(false),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = typeof stockAlerts.$inferInsert;

// ============================================================================
// DASHBOARD CONFIGURATION TABLES
// ============================================================================

/**
 * Dashboard Widgets table
 */
export const dashboardWidgets = pgTable("dashboardWidgets", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: integer("userId").notNull(),
  widgetType: varchar("widgetType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  position: integer("position").default(0),
  size: widgetSizeEnum("size").default("medium"),
  config: json("config"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;

// ============================================================================
// AUDIT & LOGGING TABLES
// ============================================================================

/**
 * Audit Logs table
 */
export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: integer("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: integer("entityId"),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
