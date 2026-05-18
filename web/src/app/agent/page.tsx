import { redirect } from "next/navigation";

// Legacy route — `/agent?id=...` now redirects to `/agents?id=...` where the
// profile renders as a drawer inside the agents list.
export default async function AgentRedirect({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  if (params.id) {
    redirect(`/agents?id=${encodeURIComponent(params.id)}`);
  }
  redirect("/agents");
}
