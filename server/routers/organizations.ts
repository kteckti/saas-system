import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import {
  organizations,
  tenantModules,
  modules,
  subscriptions,
} from "../../drizzle/schema";
import { isOrganizationOwner } from "../rbac";
import { nanoid } from "nanoid";

export const organizationsRouter = router({
  /**
   * Get current organization details
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.tenantId, ctx.user.tenantId))
        .limit(1);

      if (!org.length) return null;

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, ctx.user.tenantId))
        .limit(1);

      const activeModules = await db
        .select({
          id: modules.id,
          name: modules.name,
          slug: modules.slug,
          monthlyPrice: modules.monthlyPrice,
        })
        .from(tenantModules)
        .innerJoin(modules, eq(tenantModules.moduleId, modules.id))
        .where(
          and(
            eq(tenantModules.tenantId, ctx.user.tenantId),
            eq(tenantModules.isActive, true)
          )
        );

      return {
        ...org[0],
        subscription: subscription.length > 0 ? subscription[0] : null,
        activeModules,
      };
    } catch (error) {
      console.error("[Organizations] Error getting current organization:", error);
      return null;
    }
  }),

  /**
   * Update organization settings (owner only)
   */
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        website: z.string().optional(),
        industry: z.string().optional(),
        country: z.string().optional(),
        timezone: z.string().optional(),
        theme: z.enum(["light", "dark"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner) {
          throw new Error("Only organization owner can update settings");
        }

        const updateData: Record<string, unknown> = {};

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.logo !== undefined) updateData.logo = input.logo;
        if (input.website !== undefined) updateData.website = input.website;
        if (input.industry !== undefined) updateData.industry = input.industry;
        if (input.country !== undefined) updateData.country = input.country;
        if (input.timezone !== undefined) updateData.timezone = input.timezone;
        if (input.theme !== undefined) updateData.theme = input.theme;

        await db
          .update(organizations)
          .set(updateData)
          .where(eq(organizations.tenantId, ctx.user.tenantId));

        return { success: true };
      } catch (error) {
        console.error("[Organizations] Error updating organization:", error);
        throw error;
      }
    }),

  /**
   * Get available modules for purchase
   */
  getAvailableModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const allModules = await db.select().from(modules).where(eq(modules.isActive, true));

      const activeModules = await db
        .select({ moduleId: tenantModules.moduleId })
        .from(tenantModules)
        .where(
          and(
            eq(tenantModules.tenantId, ctx.user.tenantId),
            eq(tenantModules.isActive, true)
          )
        );

      const activeModuleIds = new Set(activeModules.map((m) => m.moduleId));

      return allModules.map((m) => ({
        ...m,
        isActive: activeModuleIds.has(m.id),
      }));
    } catch (error) {
      console.error("[Organizations] Error getting available modules:", error);
      return [];
    }
  }),

  /**
   * Create a new organization (for multi-tenant signup)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        industry: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const tenantId = nanoid();

        // Create organization
        await db.insert(organizations).values({
          tenantId,
          name: input.name,
          slug: input.slug,
          industry: input.industry,
          country: input.country,
          timezone: "UTC",
          theme: "light",
        });

        // Create default subscription
        await db.insert(subscriptions).values({
          tenantId,
          status: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        });

        return { success: true, tenantId };
      } catch (error) {
        console.error("[Organizations] Error creating organization:", error);
        throw error;
      }
    }),

  /**
   * Activate a module for the current organization
   * This is called after successful Stripe payment
   */
  activateModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner or admin
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        // Check if module exists
        const module = await db
          .select()
          .from(modules)
          .where(eq(modules.id, input.moduleId))
          .limit(1);

        if (!module.length) {
          throw new Error("Module not found");
        }

        // Check if tenant module already exists
        const existingTenantModule = await db
          .select()
          .from(tenantModules)
          .where(
            and(
              eq(tenantModules.tenantId, ctx.user.tenantId),
              eq(tenantModules.moduleId, input.moduleId)
            )
          )
          .limit(1);

        if (existingTenantModule.length > 0) {
          // Update existing
          await db
            .update(tenantModules)
            .set({ isActive: true, activatedAt: new Date() })
            .where(
              and(
                eq(tenantModules.tenantId, ctx.user.tenantId),
                eq(tenantModules.moduleId, input.moduleId)
              )
            );
        } else {
          // Create new
          await db.insert(tenantModules).values({
            tenantId: ctx.user.tenantId,
            moduleId: input.moduleId,
            isActive: true,
            activatedAt: new Date(),
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[Organizations] Error activating module:", error);
        throw error;
      }
    }),

  /**
   * Deactivate a module for the current organization
   */
  deactivateModule: protectedProcedure
    .input(
      z.object({
        moduleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner) {
          throw new Error("Only organization owner can deactivate modules");
        }

        await db
          .update(tenantModules)
          .set({ isActive: false, deactivatedAt: new Date() })
          .where(
            and(
              eq(tenantModules.tenantId, ctx.user.tenantId),
              eq(tenantModules.moduleId, input.moduleId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Organizations] Error deactivating module:", error);
        throw error;
      }
    }),
});
