import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { getDesk } from "@/lib/desk/api";
import { deskSearch } from "@/lib/desk/search";

export const Route = createFileRoute("/_desk")({
  validateSearch: deskSearch,
  loader: () => getDesk(),
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});
