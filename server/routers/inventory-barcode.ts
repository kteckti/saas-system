/**
 * Inventory Barcode/SKU Management Router
 * Implements barcode and SKU management (todo.md Phase 7: "Add barcode/SKU management")
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { products, auditLogs } from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const inventoryBarcodeRouter = router({
  /**
   * Find product by barcode
   */
  findByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        const result = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.barcode, input.barcode)
            )
          )
          .limit(1);

        return result.length > 0 ? result[0] : null;
      } catch (error) {
        console.error("[Barcode] Error finding by barcode:", error);
        return null;
      }
    }),

  /**
   * Find product by SKU
   */
  findBySku: protectedProcedure
    .input(z.object({ sku: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        const result = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.sku, input.sku)
            )
          )
          .limit(1);

        return result.length > 0 ? result[0] : null;
      } catch (error) {
        console.error("[Barcode] Error finding by SKU:", error);
        return null;
      }
    }),

  /**
   * Update barcode for a product
   */
  updateBarcode: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        barcode: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        // Check if barcode is already in use by another product
        if (input.barcode) {
          const existing = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, ctx.user.tenantId),
                eq(products.barcode, input.barcode)
              )
            )
            .limit(1);

          if (existing.length > 0 && existing[0]!.id !== input.productId) {
            throw new Error(`Barcode ${input.barcode} is already in use by product "${existing[0]!.name}"`);
          }
        }

        await db
          .update(products)
          .set({
            barcode: input.barcode,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, input.productId),
              eq(products.tenantId, ctx.user.tenantId)
            )
          );

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "UPDATE_BARCODE",
          entityType: "product",
          entityId: input.productId,
          changes: { barcode: input.barcode },
        });

        return { success: true };
      } catch (error) {
        console.error("[Barcode] Error updating barcode:", error);
        throw error;
      }
    }),

  /**
   * Update SKU for a product
   */
  updateSku: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        sku: z.string().min(1, "SKU is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        // Check if SKU is already in use by another product
        const existing = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.sku, input.sku)
            )
          )
          .limit(1);

        if (existing.length > 0 && existing[0]!.id !== input.productId) {
          throw new Error(`SKU ${input.sku} is already in use by product "${existing[0]!.name}"`);
        }

        await db
          .update(products)
          .set({
            sku: input.sku,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, input.productId),
              eq(products.tenantId, ctx.user.tenantId)
            )
          );

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "UPDATE_SKU",
          entityType: "product",
          entityId: input.productId,
          changes: { sku: input.sku },
        });

        return { success: true };
      } catch (error) {
        console.error("[Barcode] Error updating SKU:", error);
        throw error;
      }
    }),

  /**
   * Generate a unique SKU for a new product
   */
  generateSku: protectedProcedure
    .input(
      z.object({
        productName: z.string(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        // Generate SKU from product name + category + random suffix
        const prefix = input.category
          ? input.category.substring(0, 3).toUpperCase()
          : "PRD";

        const nameCode = input.productName
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 4)
          .toUpperCase();

        const timestamp = Date.now().toString().slice(-4);
        const candidateSku = `${prefix}-${nameCode}-${timestamp}`;

        // Check if SKU is unique
        const existing = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, ctx.user.tenantId),
              eq(products.sku, candidateSku)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Add random suffix if conflict
          const random = Math.floor(Math.random() * 9000 + 1000);
          return { sku: `${prefix}-${nameCode}-${random}` };
        }

        return { sku: candidateSku };
      } catch (error) {
        console.error("[Barcode] Error generating SKU:", error);
        throw error;
      }
    }),

  /**
   * Search products by barcode or SKU
   */
  searchByCode: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        // Search by barcode or SKU
        const allProducts = await db
          .select()
          .from(products)
          .where(eq(products.tenantId, ctx.user.tenantId))
          .limit(100);

        const query = input.query.toLowerCase();
        const filtered = allProducts.filter(
          (p) =>
            (p.barcode && p.barcode.toLowerCase().includes(query)) ||
            p.sku.toLowerCase().includes(query)
        );

        return filtered.slice(0, input.limit);
      } catch (error) {
        console.error("[Barcode] Error searching by code:", error);
        return [];
      }
    }),

  /**
   * Get all products with barcode/SKU info
   */
  getProductCodes: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "inventory");
        if (!hasAccess) throw new Error("Module not accessible");

        const result = await db
          .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            barcode: products.barcode,
            category: products.category,
            quantity: products.quantity,
            status: products.status,
          })
          .from(products)
          .where(eq(products.tenantId, ctx.user.tenantId))
          .limit(input.limit)
          .offset(input.offset);

        return result;
      } catch (error) {
        console.error("[Barcode] Error getting product codes:", error);
        return [];
      }
    }),
});
