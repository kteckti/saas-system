import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * MULTI-TENANT ARCHITECTURE:
 * Every table includes tenantId to ensure complete data isolation between organizations.
 * This is the foundation of the multi-tenant SaaS system.
 */

// ============================================================================
// CORE AUTHENTICATION & ORGANIZATION TABLES
// ============================================================================

/**
 * Organizations/Tenants table
 * Each organization is a separate tenant with isolated data
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logo: text("logo"), // URL to logo
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 2 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Users table with RBAC
 * Each user belongs to an organization (tenant) with a specific role
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  openId: varchar("openId", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name"),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["owner", "admin", "user"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

/**
 * Tenant Modules table
 * Maps which modules are active for each tenant
 */
export const tenantModules = mysqlTable("tenantModules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  moduleId: int("moduleId").notNull(),
  isActive: boolean("isActive").default(false),
  activatedAt: timestamp("activatedAt"),
  deactivatedAt: timestamp("deactivatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "past_due", "canceled", "unpaid", "trial"]).default("trial"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  monthlyAmount: decimal("monthlyAmount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Invoices table
 * Stores billing invoices for each tenant
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).default("draft"),
  pdfUrl: text("pdfUrl"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ============================================================================
// FINANCIAL MODULE TABLES
// ============================================================================

/**
 * Financial Accounts table
 * Stores bank accounts, credit cards, and cash accounts for each tenant
 */
export const financialAccounts = mysqlTable("financialAccounts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["bank", "credit_card", "cash", "investment"]).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  bankName: varchar("bankName", { length: 255 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = typeof financialAccounts.$inferInsert;

/**
 * Expense Categories table
 * Categories for organizing expenses
 */
export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Revenue Categories table
 * Categories for organizing revenue
 */
export const revenueCategories = mysqlTable("revenueCategories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RevenueCategory = typeof revenueCategories.$inferSelect;
export type InsertRevenueCategory = typeof revenueCategories.$inferInsert;

/**
 * Transactions table
 * All financial transactions (income and expenses)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  accountId: int("accountId").notNull(),
  type: mysqlEnum("type", ["income", "expense", "transfer"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: text("description"),
  categoryId: int("categoryId"),
  relatedTransactionId: int("relatedTransactionId"), // For transfers
  status: mysqlEnum("status", ["pending", "completed", "canceled"]).default("completed"),
  transactionDate: timestamp("transactionDate").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Accounts Payable table
 * Bills and payments due
 */
export const accountsPayable = mysqlTable("accountsPayable", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  supplierId: int("supplierId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "partial", "paid", "overdue"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountsPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountsPayable = typeof accountsPayable.$inferInsert;

/**
 * Accounts Receivable table
 * Invoices and payments due from customers
 */
export const accountsReceivable = mysqlTable("accountsReceivable", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  customerId: int("customerId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "partial", "paid", "overdue"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountsReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountsReceivable = typeof accountsReceivable.$inferInsert;

// ============================================================================
// CRM MODULE TABLES
// ============================================================================

/**
 * Leads table
 * Prospect information and lead management
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "lost", "converted"]).default("new"),
  score: int("score").default(0),
  assignedTo: int("assignedTo"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Opportunities table
 * Sales opportunities and deals
 */
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  leadId: int("leadId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  stage: varchar("stage", { length: 100 }).notNull(),
  probability: int("probability").default(0),
  expectedCloseDate: timestamp("expectedCloseDate"),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["open", "won", "lost", "suspended"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

/**
 * Interactions table
 * Track all interactions with leads and customers
 */
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "note", "task"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  duration: int("duration"), // in minutes
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Sales Pipeline Stages table
 * Customizable sales funnel stages per tenant
 */
export const pipelineStages = mysqlTable("pipelineStages", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  order: int("order").notNull(),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = typeof pipelineStages.$inferInsert;

// ============================================================================
// INVENTORY MODULE TABLES
// ============================================================================

/**
 * Products table
 * Product catalog for each tenant
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  quantity: int("quantity").default(0),
  minQuantity: int("minQuantity").default(0),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  costPrice: decimal("costPrice", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  supplier: varchar("supplier", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "discontinued"]).default("active"),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Suppliers table
 * Supplier information for inventory management
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
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
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Inventory Movements table
 * Track all inventory in/out movements
 */
export const inventoryMovements = mysqlTable("inventoryMovements", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["in", "out", "adjustment", "return"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

/**
 * Stock Alerts table
 * Alerts for low stock products
 */
export const stockAlerts = mysqlTable("stockAlerts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  productId: int("productId").notNull(),
  alertType: mysqlEnum("alertType", ["low_stock", "out_of_stock", "overstock"]).notNull(),
  isResolved: boolean("isResolved").default(false),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = typeof stockAlerts.$inferInsert;

// ============================================================================
// DASHBOARD CONFIGURATION TABLES
// ============================================================================

/**
 * Dashboard Widgets table
 * Customizable dashboard widgets per tenant
 */
export const dashboardWidgets = mysqlTable("dashboardWidgets", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  widgetType: varchar("widgetType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  position: int("position").default(0),
  size: mysqlEnum("size", ["small", "medium", "large"]).default("medium"),
  config: json("config"), // Widget-specific configuration
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;

// ============================================================================
// AUDIT & LOGGING TABLES
// ============================================================================

/**
 * Audit Logs table
 * Track all important actions for compliance and debugging
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
