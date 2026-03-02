/**
 * Local Authentication Router
 * Handles email/password login as an alternative to OAuth
 * The admin user (kteckti@gmail.com) uses this authentication method
 */
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb, getUserByEmail } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import bcrypt from "bcryptjs";

export const authLocalRouter = router({
  /**
   * Login with email and password
   * Returns a session token stored as a cookie
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find user by email
      const user = await getUserByEmail(input.email);

      if (!user) {
        throw new Error("Email ou senha incorretos");
      }

      if (!user.passwordHash) {
        throw new Error("Este usuário não possui senha local configurada. Use o login OAuth.");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Email ou senha incorretos");
      }

      // Check if user is active
      if (user.status !== "active") {
        throw new Error("Conta suspensa ou inativa. Entre em contato com o administrador.");
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session token
      // Use 'local' as appId for local auth users (no OAuth app configured)
      const sessionToken = await sdk.signSession(
        {
          openId: user.openId,
          appId: process.env.VITE_APP_ID || "local",
          name: user.name || user.email || "Admin",
        },
        { expiresInMs: ONE_YEAR_MS }
      );

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
      };
    }),

  /**
   * Change password for authenticated user
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user.length || !user[0]!.passwordHash) {
        throw new Error("Usuário não possui senha local configurada");
      }

      const isValid = await bcrypt.compare(input.currentPassword, user[0]!.passwordHash);
      if (!isValid) {
        throw new Error("Senha atual incorreta");
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Set password for a user (admin only - for initial setup)
   */
  setPassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only owner can set passwords for other users
      if (ctx.user.role !== "owner" && ctx.user.id !== input.userId) {
        throw new Error("Sem permissão para alterar senha de outro usuário");
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
