/**
 * CRM Lead Assignment Router
 * Implements lead assignment to users (todo.md Phase 6: "Implement lead assignment to users")
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { leads, users, auditLogs } from "../../drizzle/schema";
import { canAccessModule, isAdminOrOwner } from "../rbac";

export const crmAssignmentRouter = router({
  /**
   * Assign a lead to a user
   */
  assignLead: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        userId: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        // Only admin/owner can assign leads
        const isAdmin = await isAdminOrOwner(ctx.user.id, ctx.user.tenantId);
        if (!isAdmin) {
          throw new Error("Only admin or owner can assign leads");
        }

        // Verify lead belongs to tenant
        const lead = await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.id, input.leadId),
              eq(leads.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!lead.length) {
          throw new Error("Lead not found");
        }

        // If assigning to a user, verify user belongs to tenant
        if (input.userId !== null) {
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
        }

        // Update lead assignment
        await db
          .update(leads)
          .set({
            assignedTo: input.userId,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.leadId));

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "ASSIGN_LEAD",
          entityType: "lead",
          entityId: input.leadId,
          changes: { assignedTo: input.userId },
        });

        return { success: true };
      } catch (error) {
        console.error("[CRM Assignment] Error assigning lead:", error);
        throw error;
      }
    }),

  /**
   * Get leads assigned to a specific user
   */
  getLeadsByAssignee: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const targetUserId = input.userId ?? ctx.user.id;

        return await db
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.tenantId, ctx.user.tenantId),
              eq(leads.assignedTo, targetUserId)
            )
          )
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[CRM Assignment] Error getting assigned leads:", error);
        return [];
      }
    }),

  /**
   * Get unassigned leads
   */
  getUnassignedLeads: protectedProcedure
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
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const isAdmin = await isAdminOrOwner(ctx.user.id, ctx.user.tenantId);
        if (!isAdmin) {
          throw new Error("Only admin or owner can view unassigned leads");
        }

        // Get leads where assignedTo is null
        const allLeads = await db
          .select()
          .from(leads)
          .where(eq(leads.tenantId, ctx.user.tenantId))
          .limit(input.limit)
          .offset(input.offset);

        return allLeads.filter((lead) => lead.assignedTo === null);
      } catch (error) {
        console.error("[CRM Assignment] Error getting unassigned leads:", error);
        return [];
      }
    }),

  /**
   * Bulk assign leads to a user
   */
  bulkAssignLeads: protectedProcedure
    .input(
      z.object({
        leadIds: z.array(z.number()),
        userId: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const isAdmin = await isAdminOrOwner(ctx.user.id, ctx.user.tenantId);
        if (!isAdmin) {
          throw new Error("Only admin or owner can bulk assign leads");
        }

        // Update each lead
        for (const leadId of input.leadIds) {
          await db
            .update(leads)
            .set({
              assignedTo: input.userId,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(leads.id, leadId),
                eq(leads.tenantId, ctx.user.tenantId)
              )
            );
        }

        // Log audit
        await db.insert(auditLogs).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          action: "BULK_ASSIGN_LEADS",
          entityType: "lead",
          changes: { leadIds: input.leadIds, assignedTo: input.userId },
        });

        return { success: true, count: input.leadIds.length };
      } catch (error) {
        console.error("[CRM Assignment] Error bulk assigning leads:", error);
        throw error;
      }
    }),
});
