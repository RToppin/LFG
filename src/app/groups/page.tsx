export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PendingLink } from "@/components/PendingLink";

const sections = [
  {
    href: "/groups/owned",
    label: "Groups I own",
    blurb: "Manage your active listings, refresh posts, close groups, and review owner-side group activity."
  },
  {
    href: "/groups/joined",
    label: "Groups I joined",
    blurb: "Jump back into groups where you are already a member."
  },
  {
    href: "/groups/pending",
    label: "Pending requests",
    blurb: "Track requests you sent and review requests waiting on your owned groups."
  },
  {
    href: "/groups/owned?status=CLOSED",
    label: "Closed groups",
    blurb: "Review groups that have been intentionally closed."
  },
  {
    href: "/groups/owned?status=EXPIRED",
    label: "Expired posts",
    blurb: "Find posts that fell out of the live feed and need a refresh or replacement."
  },
  {
    href: "/groups/owned?status=DRAFT",
    label: "Draft posts",
    blurb: "Continue listings that were saved before publishing."
  }
];

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="container grid gap-6 py-8">
      <div>
        <h1 className="text-3xl font-black">My Groups</h1>
      </div>
      <div className="grid gap-3">
        {sections.map((section) => (
          <details className="expand-row" key={section.href}>
            <summary className="expand-summary">
              <span>
                <span className="block text-lg font-black">{section.label}</span>
              </span>
              <span className="expand-toggle" aria-hidden>
                <span className="expand-plus">+</span>
                <span className="expand-minus">-</span>
              </span>
            </summary>
            <div className="expand-body flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm text-[var(--muted)]">{section.blurb}</p>
              <PendingLink className="btn" href={section.href} pendingLabel="Opening section...">
                Open section
              </PendingLink>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
