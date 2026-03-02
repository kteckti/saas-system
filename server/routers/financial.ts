import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  financialAccounts,
  transactions,
  expenseCategories,
  revenueCategories,
  accountsPayable,
  accountsReceivable,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const financialRouter = router({
  /**
   * Get all financial accounts for the tenant
   */
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      // Check module access
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.tenantId, ctx.user.tenantId));
    } catch (error) {
      console.error("[Financial] Error getting accounts:", error);
      return [];
    }
  }),

  /**
   * Create a new financial account
   */
  createAccount: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["bank", "credit_card", "cash", "investment"]),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "financial"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(financialAccounts).values({
          tenantId: ctx.user.tenantId,
          ...input,
          balance: "0",
        });

        return { success: true };
      } catch (error) {
        console.error("[Financial] Error creating account:", error);
        throw error;
      }
    }),

  /**
   * Get expense categories
   */
  getExpenseCategories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.tenantId, ctx.user.tenantId),
            eq(expenseCategories.isActive, true)
          )
        );
    } catch (error) {
      console.error("[Financial] Error getting expense categories:", error);
      return [];
    }
  }),

  /**
   * Get revenue categories
   */
  getRevenueCategories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(revenueCategories)
        .where(
          and(
            eq(revenueCategories.tenantId, ctx.user.tenantId),
            eq(revenueCategories.isActive, true)
          )
        );
    } catch (error) {
      console.error("[Financial] Error getting revenue categories:", error);
      return [];
    }
  }),

  /**
   * Get recent transactions
   */
  getTransactions: protectedProcedure
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
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "financial"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        return await db
          .select()
          .from(transactions)
          .where(eq(transactions.tenantId, ctx.user.tenantId))
          .orderBy(desc(transactions.transactionDate))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[Financial] Error getting transactions:", error);
        return [];
      }
    }),

  /**
   * Create a new transaction
   */
  createTransaction: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        type: z.enum(["income", "expense", "transfer"]),
        amount: z.string(),
        description: z.string(),
        categoryId: z.number().optional(),
        transactionDate: z.date().default(() => new Date()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "financial"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(transactions).values({
          tenantId: ctx.user.tenantId,
          ...input,
          createdBy: ctx.user.id,
          status: "completed",
        });

        return { success: true };
      } catch (error) {
        console.error("[Financial] Error creating transaction:", error);
        throw error;
      }
    }),

  /**
   * Get accounts payable
   */
  getAccountsPayable: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(accountsPayable)
        .where(eq(accountsPayable.tenantId, ctx.user.tenantId))
        .orderBy(desc(accountsPayable.dueDate));
    } catch (error) {
      console.error("[Financial] Error getting accounts payable:", error);
      return [];
    }
  }),

  /**
   * Get accounts receivable
   */
  getAccountsReceivable: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(accountsReceivable)
        .where(eq(accountsReceivable.tenantId, ctx.user.tenantId))
        .orderBy(desc(accountsReceivable.dueDate));
    } catch (error) {
      console.error("[Financial] Error getting accounts receivable:", error);
      return [];
    }
  }),

  /**
   * Get financial summary/dashboard data
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const hasAccess = await canAccessModule(
        ctx.user.id,
        ctx.user.tenantId,
        "financial"
      );
      if (!hasAccess) throw new Error("Module not accessible");

      // Get total balance
      const accounts = await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.tenantId, ctx.user.tenantId));

      const totalBalance = accounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance as any),
        0
      );

      // Get recent transactions
      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.tenantId, ctx.user.tenantId))
        .orderBy(desc(transactions.transactionDate))
        .limit(10);

      // Get pending payables
      const pendingPayables = await db
        .select()
        .from(accountsPayable)
        .where(
          and(
            eq(accountsPayable.tenantId, ctx.user.tenantId),
            eq(accountsPayable.status, "pending")
          )
        );

      // Get pending receivables
      const pendingReceivables = await db
        .select()
        .from(accountsReceivable)
        .where(
          and(
            eq(accountsReceivable.tenantId, ctx.user.tenantId),
            eq(accountsReceivable.status, "pending")
          )
        );

      return {
        totalBalance,
        accountCount: accounts.length,
        recentTransactions,
        pendingPayables: pendingPayables.length,
        pendingReceivables: pendingReceivables.length,
      };
    } catch (error) {
      console.error("[Financial] Error getting summary:", error);
      return null;
    }
  }),
});
