import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { organizationsRouter } from "./routers/organizations";
import { financialRouter } from "./routers/financial";
import { crmRouter } from "./routers/crm";
import { inventoryRouter } from "./routers/inventory";
import { adminRouter } from "./routers/admin";
import { financialAnalyticsRouter } from "./routers/financial-analytics";
import { crmAnalyticsRouter } from "./routers/crm-analytics";
import { inventoryAnalyticsRouter } from "./routers/inventory-analytics";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  organizations: organizationsRouter,
  financial: financialRouter,
  crm: crmRouter,
  inventory: inventoryRouter,
  admin: adminRouter,
  financialAnalytics: financialAnalyticsRouter,
  crmAnalytics: crmAnalyticsRouter,
  inventoryAnalytics: inventoryAnalyticsRouter,
});

export type AppRouter = typeof appRouter;

// Export routers for potential direct usage
export { authRouter, organizationsRouter, financialRouter, crmRouter, inventoryRouter, adminRouter, financialAnalyticsRouter, crmAnalyticsRouter, inventoryAnalyticsRouter };
