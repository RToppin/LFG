export const dynamic = "force-dynamic";
import {
  Activity,
  Ban,
  Bell,
  Building2,
  Code2,
  Cookie,
  CreditCard,
  FileText,
  Gamepad2,
  HelpCircle,
  Languages,
  Link2,
  Lock,
  Mail,
  Palette,
  Shield,
  Trash2,
  UserCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type SettingsSection = {
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  danger?: boolean;
};

const sections: SettingsSection[] = [
  {
    title: "Profile & Personal Information",
    description: "Name, username, display name, profile photo, bio, phone number, birthday, and location",
    href: "/settings/profile",
    icon: UserCircle
  },
  {
    title: "Account",
    description: "Email address, password, account details, and account verification",
    href: "/settings/profile",
    icon: Mail
  },
  {
    title: "Login & Connected Accounts",
    description: "Manage Google, Apple, Discord, and other login methods or third-party integrations",
    href: "/settings/connections",
    icon: Link2
  },
  {
    title: "Security & Devices",
    description: "Two-factor authentication, active sessions, login history, and signed-in devices",
    icon: Shield
  },
  {
    title: "Notifications & Communications",
    description: "Email, push, in-app, marketing, and communication preferences",
    href: "/settings/notifications",
    icon: Bell
  },
  {
    title: "Privacy & Permissions",
    description: "Profile visibility, data sharing, content visibility, and default permissions",
    href: "/settings/privacy",
    icon: Lock
  },
  {
    title: "Blocked Accounts",
    description: "Review and manage blocked users or organizations",
    href: "/settings/privacy",
    icon: Ban
  },
  {
    title: "Appearance & Accessibility",
    description: "Light or dark mode, text size, contrast, reduced motion, and keyboard navigation",
    icon: Palette
  },
  {
    title: "Language & Region",
    description: "Language, time zone, currency, and date or time formats",
    href: "/settings/profile",
    icon: Languages
  },
  {
    title: "Content Preferences",
    description: "Control recommendations, personalization, and displayed content",
    href: "/settings/games",
    icon: Gamepad2
  },
  {
    title: "Billing & Subscription",
    description: "Subscription plan, payment methods, billing information, and invoices",
    icon: CreditCard
  },
  {
    title: "Activity & Data",
    description: "View account activity, searches, login history, and download your account data",
    icon: Activity
  },
  {
    title: "Cookie Preferences",
    description: "Manage analytics, advertising, personalization, and optional cookies",
    icon: Cookie
  },
  {
    title: "Team & Organization",
    description: "Manage team members, roles, invitations, and permissions",
    icon: Building2
  },
  {
    title: "Developer Settings",
    description: "Manage API keys, webhooks, integrations, and developer access",
    icon: Code2
  },
  {
    title: "Help & Support",
    description: "View FAQs, contact support, provide feedback, or report a problem",
    icon: HelpCircle
  },
  {
    title: "Terms & Policies",
    description: "View the privacy policy, terms of service, and community guidelines",
    icon: FileText
  },
  {
    title: "Account Deactivation & Deletion",
    description: "Temporarily deactivate or permanently delete the account",
    icon: Trash2,
    danger: true
  }
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [profile, accounts, blocks, preferences] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.account.findMany({ where: { userId: session.user.id } }),
    prisma.block.count({ where: { blockerId: session.user.id } }),
    prisma.notificationPreference.findUnique({ where: { userId: session.user.id } })
  ]);

  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="muted">Manage profile, account, communication, privacy, and platform preferences.</p>
      </div>

      <section className="panel grid gap-3 p-5">
        <h2 className="text-xl font-black">Account snapshot</h2>
        <div className="detail-grid">
          <span>Profile: {profile ? profile.displayName : "Not completed"}</span>
          <span>Connected accounts: {accounts.length}</span>
          <span>Blocked accounts: {blocks}</span>
          <span>In-app notifications: {preferences?.inApp ?? true ? "On" : "Off"}</span>
        </div>
      </section>

      <section className="grid-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const card = (
            <div className={`settings-section-card card ${section.danger ? "danger" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="settings-section-icon">
                  <Icon size={20} aria-hidden />
                </span>
                <span>
                  <strong>{section.title}</strong>
                  <span className="muted mt-1 block text-sm">{section.description}</span>
                </span>
              </div>
              <span className="settings-section-action">{section.href ? "Manage" : "Planned"}</span>
            </div>
          );
          return section.href ? (
            <Link href={section.href} key={section.title}>
              {card}
            </Link>
          ) : (
            <div key={section.title}>{card}</div>
          );
        })}
      </section>
    </div>
  );
}
