import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";
import { isTestAuthEnabled } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string | null;
      onboarded: boolean;
    } & DefaultSession["user"];
  }
}

const providers = [];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
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
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      }
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
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
    async session({ session, user }) {
      const [profile, dbUser] = await Promise.all([
        prisma.profile.findUnique({
          where: { userId: user.id },
          select: { username: true }
        }),
        prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
      ]);
      session.user.id = user.id;
      session.user.role = dbUser?.role ?? "USER";
      session.user.username = profile?.username;
      session.user.onboarded = Boolean(profile);
      return session;
    }
  }
});
