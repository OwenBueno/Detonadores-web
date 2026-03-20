import { DashboardPageClient } from "@/src/features/dashboard";
import { RequireGuestSession } from "@/src/shared/components/RequireGuestSession";

export default function DashboardPage() {
  return (
    <RequireGuestSession>
      <DashboardPageClient />
    </RequireGuestSession>
  );
}
