import { redirect } from "next/navigation";

// Legacy route — kept as a redirect so old toast links / bookmarks still land
// somewhere useful. The wizard lives inside /agents now.
export default function ConnectRedirect() {
  redirect("/agents?new=1");
}
