import ChildHeader from "@/components/child/child-header";
import ChoreList from "@/components/child/chore-list";
import AchievementDisplay from "@/components/child/achievement-display";
import RewardsShop from "@/components/child/rewards-shop";

export default function ChildDashboard() {
  return (
    <div className="block">
      <ChildHeader />
      <ChoreList />
      <AchievementDisplay />
      <RewardsShop />
    </div>
  );
}
