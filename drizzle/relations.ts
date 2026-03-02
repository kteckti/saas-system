import { relations } from "drizzle-orm";
import {
  organizations,
  users,
  modules,
  tenantModules,
  subscriptions,
  financialAccounts,
  transactions,
  leads,
  opportunities,
  interactions,
  products,
  inventoryMovements,
  stockAlerts,
  dashboardWidgets,
  auditLogs,
} from "./schema";

// Organizations relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tenantModules: many(tenantModules),
  subscriptions: many(subscriptions),
}));

// Users relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.tenantId],
    references: [organizations.tenantId],
  }),
  dashboardWidgets: many(dashboardWidgets),
  auditLogs: many(auditLogs),
}));

// Modules relations
export const modulesRelations = relations(modules, ({ many }) => ({
  tenantModules: many(tenantModules),
}));

// Tenant Modules relations
export const tenantModulesRelations = relations(tenantModules, ({ one }) => ({
  module: one(modules, {
    fields: [tenantModules.moduleId],
    references: [modules.id],
  }),
}));

// Leads relations
export const leadsRelations = relations(leads, ({ many }) => ({
  opportunities: many(opportunities),
  interactions: many(interactions),
}));

// Opportunities relations
export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  lead: one(leads, {
    fields: [opportunities.leadId],
    references: [leads.id],
  }),
}));

// Interactions relations
export const interactionsRelations = relations(interactions, ({ one }) => ({
  lead: one(leads, {
    fields: [interactions.leadId],
    references: [leads.id],
  }),
}));

// Inventory Movements relations
export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
}));

// Stock Alerts relations
export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  product: one(products, {
    fields: [stockAlerts.productId],
    references: [products.id],
  }),
}));

// Transactions relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [transactions.accountId],
    references: [financialAccounts.id],
  }),
}));

// Dashboard Widgets relations
export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  user: one(users, {
    fields: [dashboardWidgets.userId],
    references: [users.id],
  }),
}));

// Audit Logs relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
