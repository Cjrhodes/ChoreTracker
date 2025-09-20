import ParentHeader from "@/components/parent/parent-header";
import ChildOverview from "@/components/parent/child-overview";
import ChoreManagement from "@/components/parent/chore-management";
import RewardManagement from "@/components/parent/reward-management";
import RecentActivity from "@/components/parent/recent-activity";

export default function ParentDashboard() {
  return (
    <div className="responsive-container responsive-section">
      <ParentHeader />
      <div className="desktop-dashboard">
        <div className="desktop-main-content space-y-8">
          <ChildOverview />
          <ChoreManagement />
          <RewardManagement />
        </div>
        <div className="desktop-sidebar">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
