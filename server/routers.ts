import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authLocalRouter } from "./routers/auth-local";
import { rbacRouter } from "./routers/auth";
import { organizationsRouter } from "./routers/organizations";
import { financialRouter } from "./routers/financial";
import { crmRouter } from "./routers/crm";
import { inventoryRouter } from "./routers/inventory";
import { adminRouter } from "./routers/admin";
import { financialAnalyticsRouter } from "./routers/financial-analytics";
import { crmAnalyticsRouter } from "./routers/crm-analytics";
import { inventoryAnalyticsRouter } from "./routers/inventory-analytics";
import { crmAssignmentRouter } from "./routers/crm-assignment";
import { inventoryBarcodeRouter } from "./routers/inventory-barcode";
import { dashboardWidgetsRouter } from "./routers/dashboard-widgets";

export const appRouter = router({
  system: systemRouter,
  authLocal: authLocalRouter,
  auth: rbacRouter, // O frontend vai procurar as permissões aqui!
  organizations: organizationsRouter,
  financial: financialRouter,
  crm: crmRouter,
  inventory: inventoryRouter,
  admin: adminRouter,
  financialAnalytics: financialAnalyticsRouter,
  crmAnalytics: crmAnalyticsRouter,
  inventoryAnalytics: inventoryAnalyticsRouter,
  crmAssignment: crmAssignmentRouter,
  inventoryBarcode: inventoryBarcodeRouter,
  dashboardWidgets: dashboardWidgetsRouter,
});

export type AppRouter = typeof appRouter;

export {
  authLocalRouter,
  rbacRouter,
  organizationsRouter,
  financialRouter,
  crmRouter,
  inventoryRouter,
  adminRouter,
  financialAnalyticsRouter,
  crmAnalyticsRouter,
  inventoryAnalyticsRouter,
  crmAssignmentRouter,
  inventoryBarcodeRouter,
  dashboardWidgetsRouter,
};