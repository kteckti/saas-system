import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  products,
  inventoryMovements,
  stockAlerts,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const inventoryAnalyticsRouter = router({
  /**
   * Get inventory reports
   */
  getInventoryReport: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        let query = db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.status, "active")
            )
          );

        if (input.category) {
          query = query.where(eq(products.category, input.category));
        }

        const allProducts = await query;

        // Calculate metrics
        const totalProducts = allProducts.length;
        const totalInventoryValue = allProducts.reduce((sum, p) => {
          return sum + parseFloat(p.unitPrice as any) * (p.quantity ?? 0);
        }, 0);

        const lowStockProducts = allProducts.filter(
          (p) => (p.quantity ?? 0) <= (p.minQuantity || 0)
        );

        const outOfStockProducts = allProducts.filter((p) => (p.quantity ?? 0) === 0);

        const avgInventoryValue =
          totalProducts > 0 ? totalInventoryValue / totalProducts : 0;

        // Get category breakdown
        const categoryBreakdown: Record<string, { count: number; value: number }> = {};

        allProducts.forEach((p) => {
          const cat = p.category || "Uncategorized";
          if (!categoryBreakdown[cat]) {
            categoryBreakdown[cat] = { count: 0, value: 0 };
          }
          categoryBreakdown[cat].count += 1;
          categoryBreakdown[cat].value += parseFloat(p.unitPrice as any) * (p.quantity ?? 0);
        });

        return {
          summary: {
            totalProducts,
            totalInventoryValue,
            avgInventoryValue,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
          },
          categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
            category,
            ...data,
          })),
          lowStockProducts: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            quantity: p.quantity,
            minQuantity: p.minQuantity,
            unitPrice: p.unitPrice,
          })),
        };
      } catch (error) {
        console.error("[Inventory Analytics] Error getting inventory report:", error);
        return null;
      }
    }),

  /**
   * Get inventory movement analytics
   */
  getMovementAnalytics: protectedProcedure
    .input(
      z.object({
        productId: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        let query = db
          .select()
          .from(inventoryMovements)
          .where(eq(inventoryMovements.tenantId, ctx.user.tenantId));

        if (input.productId) {
          query = query.where(eq(inventoryMovements.productId, input.productId));
        }

        const movements = await query
          .orderBy(desc(inventoryMovements.createdAt))
          .limit(input.limit);

        // Analyze movement patterns
        const movementTypes: Record<string, number> = {
          in: 0,
          out: 0,
          adjustment: 0,
          return: 0,
        };

        const movementReasons: Record<string, number> = {};

        movements.forEach((m) => {
          movementTypes[m.type]++;
          if (m.reason) {
            movementReasons[m.reason] = (movementReasons[m.reason] || 0) + 1;
          }
        });

        const totalMovements = movements.length;
        const totalQuantityIn = movements
          .filter((m) => m.type === "in")
          .reduce((sum, m) => sum + m.quantity, 0);
        const totalQuantityOut = movements
          .filter((m) => m.type === "out")
          .reduce((sum, m) => sum + m.quantity, 0);

        return {
          summary: {
            totalMovements,
            totalQuantityIn,
            totalQuantityOut,
            netMovement: totalQuantityIn - totalQuantityOut,
          },
          movementTypes,
          movementReasons: Object.entries(movementReasons).map(([reason, count]) => ({
            reason,
            count,
          })),
          recentMovements: movements.slice(0, 20),
        };
      } catch (error) {
        console.error("[Inventory Analytics] Error getting movement analytics:", error);
        return null;
      }
    }),

  /**
   * Get stock alerts summary
   */
  getStockAlertsSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "inventory"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      const alerts = await db
        .select()
        .from(stockAlerts)
        .where(eq(stockAlerts.tenantId, ctx.user.tenantId));

      const activeAlerts = alerts.filter((a) => !a.isResolved);
      const resolvedAlerts = alerts.filter((a) => a.isResolved);

      const alertsByType: Record<string, number> = {
        low_stock: 0,
        out_of_stock: 0,
        overstock: 0,
      };

      activeAlerts.forEach((a) => {
        alertsByType[a.alertType]++;
      });

      return {
        totalAlerts: alerts.length,
        activeAlerts: activeAlerts.length,
        resolvedAlerts: resolvedAlerts.length,
        alertsByType,
        recentAlerts: activeAlerts.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ).slice(0, 10),
      };
    } catch (error) {
      console.error("[Inventory Analytics] Error getting stock alerts summary:", error);
      return null;
    }
  }),

  /**
   * Get inventory turnover metrics
   */
  getInventoryTurnover: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

        const products = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.status, "active")
            )
          );

        const turnoverData = await Promise.all(
          products.map(async (product) => {
            const movements = await db
              .select()
              .from(inventoryMovements)
              .where(
                and(
                  eq(inventoryMovements.productId, product.id),
                  eq(inventoryMovements.tenantId, ctx.user.tenantId)
                )
              );

            const recentMovements = movements.filter((m) => m.createdAt > startDate);

            const outMovements = recentMovements
              .filter((m) => m.type === "out")
              .reduce((sum, m) => sum + m.quantity, 0);

            const avgInventory = product.quantity ?? 0;
            const turnoverRatio = avgInventory > 0 ? outMovements / avgInventory : 0;

            return {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: product.quantity,
              outMovements,
              turnoverRatio: parseFloat(turnoverRatio.toFixed(2)),
            };
          })
        );

        return turnoverData.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
      } catch (error) {
        console.error("[Inventory Analytics] Error getting inventory turnover:", error);
        return [];
      }
    }),
});
