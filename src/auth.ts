import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";
import { isTestAuthEnabled } from "@/lib/env";

type AuthSessionUser = DefaultSession["user"] & {
  id: string;
  role: string;
  status: string;
  username?: string | null;
  onboarded: boolean;
};

type AppSession = Omit<Session, "user"> & { user: AuthSessionUser };

declare module "next-auth" {
  interface Session {
    user: AuthSessionUser;
  }
}

const providers = [];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { scope: "identify email" } }
    })
  );
}

if (isTestAuthEnabled()) {
  providers.push(
    Credentials({
      name: "Development login",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Display name", type: "text" }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        if (!email.endsWith("@example.com")) return null;
        const name = String(credentials?.name ?? email.split("@")[0]).trim();
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: {
            email,
            name,
            role: email.startsWith("admin") ? "ADMIN" : email.startsWith("mod") ? "MODERATOR" : "USER",
            preferences: { create: {} }
          }
        });
        if (user.status !== "ACTIVE") return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      }
    })
  );
}

async function getSessionShape(userId: string) {
  const [profile, dbUser] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { username: true }
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true } })
  ]);
  return {
    role: dbUser?.role ?? "USER",
    status: dbUser?.status ?? "ACTIVE",
    username: profile?.username ?? null,
    onboarded: Boolean(profile)
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  session: { strategy: isTestAuthEnabled() ? "jwt" : "database" },
  pages: { signIn: "/login" },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {}
      });
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { status: true } });
        if (dbUser?.status && dbUser.status !== "ACTIVE") return false;
      }
      if (account?.provider === "discord" && user.id) {
        await prisma.profile.updateMany({
          where: { userId: user.id },
          data: {
            discordConnected: true,
            discordUserId: account.providerAccountId,
            discordUsername: (profile as { username?: string } | undefined)?.username,
            discordDisplayName: (profile as { global_name?: string } | undefined)?.global_name,
            discordAvatar: user.image ?? undefined
          }
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? (typeof token.id === "string" ? token.id : undefined);
      if (!userId) return token;
      const shape = await getSessionShape(userId);
      token.id = userId;
      token.role = shape.role;
      token.status = shape.status;
      token.username = shape.username;
      token.onboarded = shape.onboarded;
      return token;
    },
    async session({ session, token, user }) {
      const userId = (typeof token?.id === "string" ? token.id : undefined) ?? user?.id;
      if (!userId) return session;
      const shape = await getSessionShape(userId);
      const role = typeof token?.role === "string" ? token.role : shape.role;
      session.user.id = userId;
      session.user.role = role;
      session.user.status = typeof token?.status === "string" ? token.status : shape.status;
      session.user.username = typeof token?.username === "string" ? token.username : shape.username;
      session.user.onboarded = typeof token?.onboarded === "boolean" ? token.onboarded : shape.onboarded;
      return session;
    }
  }
});
