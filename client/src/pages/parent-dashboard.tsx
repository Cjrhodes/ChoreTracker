import ParentHeader from "@/components/parent/parent-header";
import ChildOverview from "@/components/parent/child-overview";
import ChoreManagement from "@/components/parent/chore-management";
import RewardManagement from "@/components/parent/reward-management";
import RecentActivity from "@/components/parent/recent-activity";

export default function ParentDashboard() {
  return (
    <div className="block">
      <ParentHeader />
      <ChildOverview />
      <ChoreManagement />
      <RewardManagement />
      <RecentActivity />
    </div>
  );
}
