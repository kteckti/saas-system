import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { users, organizations, tenantModules, modules } from "../../drizzle/schema";
import { canAccessModule, getTenantModules, isOrganizationOwner } from "../rbac";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  /**
   * Get current user's organization and active modules
   */
  getCurrentOrganization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.tenantId, ctx.user.tenantId))
        .limit(1);

      if (!org.length) return null;

      const activeModules = await getTenantModules(ctx.user.tenantId);

      return {
        ...org[0],
        modules: activeModules,
      };
    } catch (error) {
      console.error("[Auth] Error getting organization:", error);
      return null;
    }
  }),

  /**
   * Get all users in the current organization
   * Only accessible by owner or admin
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

      const orgUsers = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, ctx.user.tenantId));

      return orgUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      }));
    } catch (error) {
      console.error("[Auth] Error getting organization users:", error);
      return [];
    }
  }),

  /**
   * Update user role (owner/admin only)
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

        return { success: true };
      } catch (error) {
        console.error("[Auth] Error updating user role:", error);
        throw error;
      }
    }),

  /**
   * Check if user can access a specific module
   */
  canAccessModule: protectedProcedure
    .input(
      z.object({
        moduleSlug: z.enum(["dashboard", "financial", "crm", "inventory"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        input.moduleSlug
      );
      return { hasAccess };
    }),

  /**
   * Get active modules for current tenant
   */
  getActiveModules: protectedProcedure.query(async ({ ctx }) => {
    return await getTenantModules(ctx.user.tenantId);
  }),

  /**
   * Verify multi-tenant isolation
   */
  verifyTenantAccess: protectedProcedure
    .input(
      z.object({
        tenantId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = ctx.user.tenantId === input.tenantId;
      return { hasAccess };
    }),
});
