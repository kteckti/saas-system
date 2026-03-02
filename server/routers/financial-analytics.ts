import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  transactions,
  financialAccounts,
  expenseCategories,
  revenueCategories,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const financialAnalyticsRouter = router({
  /**
   * Get cash flow data for a date range
   */
  getCashFlow: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "financial"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        const transactionsInRange = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.tenantId, ctx.user.tenantId),
              gte(transactions.transactionDate, input.startDate),
              lte(transactions.transactionDate, input.endDate)
            )
          )
          .orderBy(transactions.transactionDate);

        // Calculate daily cash flow
        const dailyCashFlow: Record<string, { income: number; expense: number }> = {};

        transactionsInRange.forEach((tx) => {
          const dateKey = tx.transactionDate.toISOString().split("T")[0] ?? "";
          if (!dailyCashFlow[dateKey]) {
            dailyCashFlow[dateKey] = { income: 0, expense: 0 };
          }

          const amount = parseFloat(tx.amount as any);
          if (tx.type === "income") {
            dailyCashFlow[dateKey]!.income += amount;
          } else if (tx.type === "expense") {
            dailyCashFlow[dateKey]!.expense += amount;
          }
        });

        // Convert to array format for charts
        const cashFlowData = Object.entries(dailyCashFlow).map(([date, data]) => ({
          date,
          income: data.income,
          expense: data.expense,
          net: data.income - data.expense,
        }));

        // Calculate totals
        const totalIncome = cashFlowData.reduce((sum, item) => sum + item.income, 0);
        const totalExpense = cashFlowData.reduce((sum, item) => sum + item.expense, 0);
        const netCashFlow = totalIncome - totalExpense;

        return {
          data: cashFlowData,
          summary: {
            totalIncome,
            totalExpense,
            netCashFlow,
            transactionCount: transactionsInRange.length,
          },
        };
      } catch (error) {
        console.error("[Financial Analytics] Error getting cash flow:", error);
        return null;
      }
    }),

  /**
   * Get expense breakdown by category
   */
  getExpenseBreakdown: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        // Build where conditions
        const conditions = [
          eq(transactions.tenantId, ctx.user.tenantId),
          eq(transactions.type, "expense"),
          ...(input.startDate && input.endDate
            ? [
                gte(transactions.transactionDate, input.startDate),
                lte(transactions.transactionDate, input.endDate),
              ]
            : []),
        ];

        const expenses = await db
          .select()
          .from(transactions)
          .where(and(...conditions));

        // Group by category
        const breakdown: Record<string, number> = {};

        for (const expense of expenses) {
          const categoryId = expense.categoryId;
          if (!categoryId) continue;

          const category = await db
            .select()
            .from(expenseCategories)
            .where(eq(expenseCategories.id, categoryId))
            .limit(1);

          const categoryName = category.length > 0 ? category[0]!.name : "Sem categoria";
          const amount = parseFloat(expense.amount as any);

          if (!breakdown[categoryName]) {
            breakdown[categoryName] = 0;
          }
          breakdown[categoryName]! += amount;
        }

        return Object.entries(breakdown).map(([category, amount]) => ({
          category,
          amount,
        }));
      } catch (error) {
        console.error("[Financial Analytics] Error getting expense breakdown:", error);
        return [];
      }
    }),

  /**
   * Get revenue breakdown by category
   */
  getRevenueBreakdown: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

        // Build where conditions
        const conditions = [
          eq(transactions.tenantId, ctx.user.tenantId),
          eq(transactions.type, "income"),
          ...(input.startDate && input.endDate
            ? [
                gte(transactions.transactionDate, input.startDate),
                lte(transactions.transactionDate, input.endDate),
              ]
            : []),
        ];

        const revenues = await db
          .select()
          .from(transactions)
          .where(and(...conditions));

        // Group by category
        const breakdown: Record<string, number> = {};

        for (const revenue of revenues) {
          const categoryId = revenue.categoryId;
          if (!categoryId) continue;

          const category = await db
            .select()
            .from(revenueCategories)
            .where(eq(revenueCategories.id, categoryId))
            .limit(1);

          const categoryName = category.length > 0 ? category[0]!.name : "Sem categoria";
          const amount = parseFloat(revenue.amount as any);

          if (!breakdown[categoryName]) {
            breakdown[categoryName] = 0;
          }
          breakdown[categoryName]! += amount;
        }

        return Object.entries(breakdown).map(([category, amount]) => ({
          category,
          amount,
        }));
      } catch (error) {
        console.error("[Financial Analytics] Error getting revenue breakdown:", error);
        return [];
      }
    }),

  /**
   * Get financial summary report
   */
  getFinancialReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(
          ctx.user.id,
          ctx.user.tenantId,
          "financial"
        );
        if (!hasAccess) throw new Error("Module not accessible");

        // Get all transactions in range
        const transactionsInRange = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.tenantId, ctx.user.tenantId),
              gte(transactions.transactionDate, input.startDate),
              lte(transactions.transactionDate, input.endDate)
            )
          );

        // Get current account balances
        const accounts = await db
          .select()
          .from(financialAccounts)
          .where(eq(financialAccounts.tenantId, ctx.user.tenantId));

        const totalBalance = accounts.reduce(
          (sum, acc) => sum + parseFloat(acc.balance as any),
          0
        );

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;

        transactionsInRange.forEach((tx) => {
          const amount = parseFloat(tx.amount as any);
          if (tx.type === "income") {
            totalIncome += amount;
          } else if (tx.type === "expense") {
            totalExpense += amount;
          }
        });

        const netProfit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        return {
          period: {
            startDate: input.startDate,
            endDate: input.endDate,
          },
          summary: {
            totalIncome,
            totalExpense,
            netProfit,
            profitMargin: profitMargin.toFixed(2),
            totalBalance,
            accountCount: accounts.length,
            transactionCount: transactionsInRange.length,
          },
        };
      } catch (error) {
        console.error("[Financial Analytics] Error getting financial report:", error);
        return null;
      }
    }),
});
