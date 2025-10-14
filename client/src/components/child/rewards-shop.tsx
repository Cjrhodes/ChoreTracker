import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink } from "lucide-react";
import type { Child, Reward, GoalSelection } from "@shared/schema";

type GoalWithReward = GoalSelection & { reward: Reward };

export default function RewardsShop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const { data: currentGoal } = useQuery<GoalWithReward>({
    queryKey: ["/api/children", child?.id, "goal"],
    enabled: !!child,
  });

  const selectGoal = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("POST", "/api/goal-selections", {
        childId: child?.id,
        rewardId,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", child?.id, "goal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Goal Selected! 🎯",
        description: "Start completing chores to work toward your reward!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to select goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!child) {
    return null;
  }

  if (rewardsLoading) {
    return (
      <section className="w-full pb-20">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 md:text-2xl lg:text-3xl">
          <span className="text-2xl md:text-3xl lg:text-4xl">🎁</span> Rewards Shop
        </h3>
        <div className="responsive-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border mobile-card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl md:w-14 md:h-14"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2 md:h-5"></div>
                  <div className="h-3 bg-muted rounded w-1/2 md:h-4"></div>
                </div>
                <div className="h-8 w-20 bg-muted rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const calculateProgress = (goal: GoalWithReward) => {
    return Math.min((child.totalPoints / goal.reward.pointsCost) * 100, 100);
  };

  return (
    <section className="w-full pb-20">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 md:text-2xl lg:text-3xl">
        <span className="text-2xl md:text-3xl lg:text-4xl">🎁</span> Rewards Shop
      </h3>
      
      <div className="responsive-grid">
        {rewards.length === 0 ? (
          <div className="text-center py-8 md:py-12 col-span-full">
            <div className="text-4xl mb-4 md:text-5xl">🎁</div>
            <p className="text-muted-foreground md:text-lg">Ask your parent to add some rewards!</p>
          </div>
        ) : (
          rewards.map((reward) => {
            const isCurrentGoal = currentGoal?.rewardId === reward.id;
            const progress = isCurrentGoal && currentGoal ? calculateProgress(currentGoal) : 0;
            const canAfford = child.totalPoints >= reward.pointsCost;
            
            return (
              <div
                key={reward.id}
                className={`mobile-card relative overflow-hidden transition-all ${
                  isCurrentGoal
                    ? "bg-gradient-to-r from-accent to-pink-500 text-white"
                    : "bg-card border border-border"
                }`}
                data-testid={`card-reward-${reward.id}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      isCurrentGoal ? "bg-white/20" : reward.category === "cash" ? "bg-green-500 text-white" : "bg-muted"
                    }`}
                  >
                    {reward.category === "cash" ? "💰" : reward.imageUrl ? "🎁" : "🎯"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-bold ${isCurrentGoal ? "text-white" : "text-foreground"}`}
                        data-testid={`text-reward-name-${reward.id}`}
                      >
                        {reward.name}
                      </h4>
                      {reward.itemUrl && /^https?:\/\/.+/i.test(reward.itemUrl) && (
                        <a
                          href={reward.itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            isCurrentGoal ? "text-white/90 hover:text-white" : "text-blue-500 hover:text-blue-700"
                          } transition-colors`}
                          data-testid={`link-reward-url-${reward.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        isCurrentGoal ? "text-white/90" : "text-muted-foreground"
                      }`}
                      data-testid={`text-reward-cost-${reward.id}`}
                    >
                      {reward.pointsCost} points {canAfford ? "✅" : "needed"}
                    </p>
                    {reward.description && (
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentGoal ? "text-white/80" : "text-muted-foreground"
                        }`}
                        data-testid={`text-reward-description-${reward.id}`}
                      >
                        {reward.description}
                      </p>
                    )}
                    {isCurrentGoal && (
                      <div className="bg-white/20 rounded-full p-1 mt-2">
                        <div className="bg-white/40 rounded-full h-2">
                          <div
                            className="bg-white rounded-full h-2 transition-all progress-animation"
                            style={{ width: `${progress}%` }}
                            data-testid={`progress-reward-${reward.id}`}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {isCurrentGoal ? (
                    <div className="absolute top-2 right-2 bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
                      MY GOAL! ⭐
                    </div>
                  ) : (
                    <Button
                      className="bg-secondary text-secondary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                      onClick={() => selectGoal.mutate(reward.id)}
                      disabled={selectGoal.isPending}
                      data-testid={`button-select-goal-${reward.id}`}
                    >
                      {selectGoal.isPending ? "Selecting..." : "Choose Goal 🎯"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
