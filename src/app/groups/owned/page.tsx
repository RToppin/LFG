import { redirect } from "next/navigation";

export default async function OwnedGroupsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const tab =
    params.status === "CLOSED"
      ? "closed"
      : params.status === "EXPIRED"
        ? "expired"
        : params.status === "DRAFT"
          ? "draft"
          : "owned";
  redirect(`/groups?tab=${tab}`);
}
