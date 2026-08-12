import { redirect } from "next/navigation";

export default function JoinedGroupsPage() {
  redirect("/groups?tab=joined");
}
