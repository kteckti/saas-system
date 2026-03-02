import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc, lt } from "drizzle-orm";
import {
  products,
  suppliers,
  inventoryMovements,
  stockAlerts,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const inventoryRouter = router({
  /**
   * Get all products for the tenant
   */
  getProducts: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
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

        const whereConditions = input.category
          ? and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.category, input.category),
              eq(products.status, "active")
            )
          : and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.status, "active")
            );

        return await db
          .select()
          .from(products)
          .where(whereConditions)
          .orderBy(desc(products.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[Inventory] Error getting products:", error);
        return [];
      }
    }),

  /**
   * Create a new product
   */
  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        sku: z.string(),
        barcode: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        unitPrice: z.string(),
        costPrice: z.string().optional(),
        minQuantity: z.number().default(0),
        supplier: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(products).values({
          tenantId: ctx.user.tenantId,
          ...input,
          quantity: 0,
          currency: "USD",
          status: "active",
        });

        return { success: true };
      } catch (error) {
        console.error("[Inventory] Error creating product:", error);
        throw error;
      }
    }),

  /**
   * Get all suppliers
   */
  getSuppliers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "inventory"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.tenantId, ctx.user.tenantId),
            eq(suppliers.status, "active")
          )
        );
    } catch (error) {
      console.error("[Inventory] Error getting suppliers:", error);
      return [];
    }
  }),

  /**
   * Create a new supplier
   */
  createSupplier: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        contactPerson: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(suppliers).values({
          tenantId: ctx.user.tenantId,
          ...input,
          status: "active",
        });

        return { success: true };
      } catch (error) {
        console.error("[Inventory] Error creating supplier:", error);
        throw error;
      }
    }),

  /**
   * Record inventory movement
   */
  recordMovement: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        type: z.enum(["in", "out", "adjustment", "return"]),
        quantity: z.number(),
        reason: z.string().optional(),
        reference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "inventory"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        // Record movement
        await db.insert(inventoryMovements).values({
          tenantId: ctx.user.tenantId,
          ...input,
          createdBy: ctx.user.id,
        });

        // Update product quantity
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .limit(1);

        if (product.length > 0) {
          const currentQty = product[0]?.quantity || 0;
          let newQty = currentQty;

          if (input.type === "in") {
            newQty = currentQty + input.quantity;
          } else if (input.type === "out" || input.type === "return") {
            newQty = currentQty - input.quantity;
          }

          await db
            .update(products)
            .set({ quantity: newQty })
            .where(eq(products.id, input.productId));

          // Check for low stock alert
          if (
            newQty > 0 &&
            newQty <= (product[0]?.minQuantity || 0)
          ) {
            await db.insert(stockAlerts).values({
              tenantId: ctx.user.tenantId,
              productId: input.productId,
              alertType: "low_stock",
              isResolved: false,
            });
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[Inventory] Error recording movement:", error);
        throw error;
      }
    }),

  /**
   * Get inventory movements
   */
  getMovements: protectedProcedure
    .input(
      z.object({
        productId: z.number().optional(),
        limit: z.number().default(50),
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

        const whereConditions = input.productId
          ? and(
              eq(inventoryMovements.tenantId, ctx.user.tenantId),
              eq(inventoryMovements.productId, input.productId)
            )
          : eq(inventoryMovements.tenantId, ctx.user.tenantId);

        return await db
          .select()
          .from(inventoryMovements)
          .where(whereConditions)
          .orderBy(desc(inventoryMovements.createdAt))
          .limit(input.limit);
      } catch (error) {
        console.error("[Inventory] Error getting movements:", error);
        return [];
      }
    }),

  /**
   * Get low stock alerts
   */
  getLowStockAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "inventory"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(stockAlerts)
        .where(
          and(
            eq(stockAlerts.tenantId, ctx.user.tenantId),
            eq(stockAlerts.isResolved, false)
          )
        )
        .orderBy(desc(stockAlerts.createdAt));
    } catch (error) {
      console.error("[Inventory] Error getting alerts:", error);
      return [];
    }
  }),

  /**
   * Get inventory summary
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "inventory"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      const allProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.tenantId, ctx.user.tenantId),
            eq(products.status, "active")
          )
        );

      const lowStockProducts = allProducts.filter(
        (p) => (p.quantity ?? 0) <= (p.minQuantity || 0)
      );

      const totalInventoryValue = allProducts.reduce((sum, p) => {
        return sum + parseFloat(p.unitPrice as any) * (p.quantity ?? 0);
      }, 0);

      const alerts = await db
        .select()
        .from(stockAlerts)
        .where(
          and(
            eq(stockAlerts.tenantId, ctx.user.tenantId),
            eq(stockAlerts.isResolved, false)
          )
        );

      return {
        totalProducts: allProducts.length,
        lowStockCount: lowStockProducts.length,
        totalInventoryValue,
        activeAlerts: alerts.length,
      };
    } catch (error) {
      console.error("[Inventory] Error getting summary:", error);
      return null;
    }
  }),
});
