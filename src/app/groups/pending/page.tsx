import { redirect } from "next/navigation";

export default function PendingGroupsPage() {
  redirect("/groups?tab=pending");
}
