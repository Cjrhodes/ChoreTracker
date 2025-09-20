import ChildHeader from "@/components/child/child-header";
import ChoreList from "@/components/child/chore-list";
import AchievementDisplay from "@/components/child/achievement-display";
import RewardsShop from "@/components/child/rewards-shop";

export default function ChildDashboard() {
  return (
    <div className="responsive-container responsive-section">
      <ChildHeader />
      <div className="desktop-dashboard">
        <div className="desktop-main-content space-y-8">
          <ChoreList />
          <RewardsShop />
        </div>
        <div className="desktop-sidebar">
          <AchievementDisplay />
        </div>
      </div>
    </div>
  );
}
