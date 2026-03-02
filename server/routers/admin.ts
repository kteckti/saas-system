import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  organizations,
  subscriptions,
  invoices,
  auditLogs,
} from "../../drizzle/schema";
import { isOrganizationOwner } from "../rbac";

export const adminRouter = router({
  /**
   * Get all organization users (admin/owner only)
   */
  getOrganizationUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      // Check if user is owner or admin
      const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
      if (!isOwner && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return await db
        .select()
        .from(users)
        .where(eq(users.tenantId, ctx.user.tenantId))
        .orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("[Admin] Error getting organization users:", error);
      return [];
    }
  }),

  /**
   * Update user role (owner only)
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["owner", "admin", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner) {
          throw new Error("Only organization owner can update user roles");
        }

        // Verify target user belongs to same organization
        const targetUser = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.id, input.userId),
              eq(users.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!targetUser.length) {
          throw new Error("User not found in organization");
        }

        // Update user role
        await db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "UPDATE_USER_ROLE",
          entityType: "user",
          entityId: input.userId,
          changes: { role: input.role },
        });

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating user role:", error);
        throw error;
      }
    }),

  /**
   * Update user status (owner/admin only)
   */
  updateUserStatus: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["active", "inactive", "suspended"]),
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

        // Verify target user belongs to same organization
        const targetUser = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.id, input.userId),
              eq(users.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!targetUser.length) {
          throw new Error("User not found in organization");
        }

        // Update user status
        await db
          .update(users)
          .set({ status: input.status })
          .where(eq(users.id, input.userId));

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "UPDATE_USER_STATUS",
          entityType: "user",
          entityId: input.userId,
          changes: { status: input.status },
        });

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating user status:", error);
        throw error;
      }
    }),

  /**
   * Get subscription details
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      // Check if user is owner or admin
      const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
      if (!isOwner && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.tenantId, ctx.user.tenantId))
        .limit(1);

      return subscription.length > 0 ? subscription[0] : null;
    } catch (error) {
      console.error("[Admin] Error getting subscription:", error);
      return null;
    }
  }),

  /**
   * Update subscription status (owner only)
   */
  updateSubscriptionStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "past_due", "canceled", "unpaid", "trial"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner) {
          throw new Error("Only organization owner can update subscription");
        }

        await db
          .update(subscriptions)
          .set({ status: input.status })
          .where(eq(subscriptions.tenantId, ctx.user.tenantId));

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "UPDATE_SUBSCRIPTION_STATUS",
          entityType: "subscription",
          changes: { status: input.status },
        });

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error updating subscription status:", error);
        throw error;
      }
    }),

  /**
   * Get billing history
   */
  getBillingHistory: protectedProcedure
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
        // Check if user is owner or admin
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        return await db
          .select()
          .from(invoices)
          .where(eq(invoices.tenantId, ctx.user.tenantId))
          .orderBy(desc(invoices.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[Admin] Error getting billing history:", error);
        return [];
      }
    }),

  /**
   * Get audit logs
   */
  getAuditLogs: protectedProcedure
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
        // Check if user is owner or admin
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        return await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.tenantId, ctx.user.tenantId))
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[Admin] Error getting audit logs:", error);
        return [];
      }
    }),

  /**
   * Extend trial period (owner only)
   */
  extendTrialPeriod: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Check if user is owner
        const isOwner = await isOrganizationOwner(ctx.user.id, ctx.user.tenantId);
        if (!isOwner) {
          throw new Error("Only organization owner can extend trial period");
        }

        const subscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.tenantId, ctx.user.tenantId))
          .limit(1);

        if (!subscription.length) {
          throw new Error("Subscription not found");
        }

        const newTrialEndsAt = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000);

        await db
          .update(subscriptions)
          .set({ trialEndsAt: newTrialEndsAt })
          .where(eq(subscriptions.tenantId, ctx.user.tenantId));

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "EXTEND_TRIAL_PERIOD",
          entityType: "subscription",
          changes: { days: input.days, newTrialEndsAt },
        });

        return { success: true };
      } catch (error) {
        console.error("[Admin] Error extending trial period:", error);
        throw error;
      }
    }),
});
