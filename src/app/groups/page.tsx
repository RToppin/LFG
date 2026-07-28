import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const links = [
    ["/groups/owned", "Groups I own"],
    ["/groups/joined", "Groups I joined"],
    ["/groups/pending", "Pending requests"],
    ["/groups/owned?status=CLOSED", "Closed groups"],
    ["/groups/owned?status=EXPIRED", "Expired posts"],
    ["/groups/owned?status=DRAFT", "Draft posts"]
  ];
  return (
    <div className="container grid gap-6 py-8">
      <h1 className="text-3xl font-black">My Groups</h1>
      <div className="grid-auto">
        {links.map(([href, label]) => (
          <Link className="card p-5 text-xl font-black hover:border-[var(--accent)]" href={href} key={href}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
