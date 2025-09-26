import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Star, Trophy, Target, Clock, Gift } from "lucide-react";
import type { Child, AssignedChore, ChoreTemplate, EarnedBadge, Reward, GoalSelection } from "@shared/schema";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };
type GoalWithReward = GoalSelection & { reward: Reward };

export default function ChildDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  const { data: chores = [], isLoading: choresLoading } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/children", child?.id, "chores"],
    enabled: !!child,
  });

  const { data: badges = [] } = useQuery<EarnedBadge[]>({
    queryKey: ["/api/children", child?.id, "badges"],
    enabled: !!child,
  });

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const { data: currentGoal } = useQuery<GoalWithReward>({
    queryKey: ["/api/children", child?.id, "goal"],
    enabled: !!child,
  });

  const completeChore = useMutation({
    mutationFn: async (choreId: string) => {
      await apiRequest("PATCH", `/api/assigned-chores/${choreId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", child?.id, "chores"] });
      toast({
        title: "Great job! 🎉",
        description: "Chore completed! Waiting for parent approval.",
      });
    },
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
      toast({
        title: "Goal Selected! 🎯",
        description: "Start completing chores to work toward your reward!",
      });
    },
  });

  if (!child) {
    return (
      <div className="responsive-container responsive-section">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
            😊
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome! 👋</h2>
          <p className="text-muted-foreground">Ask your parent to add you first!</p>
        </div>
      </div>
    );
  }

  const todayChores = chores.filter(chore => {
    const today = new Date().toISOString().split('T')[0];
    return chore.assignedDate.startsWith(today);
  });

  const completedToday = todayChores.filter(chore => chore.completedAt).length;
  const pendingChores = todayChores.filter(chore => !chore.completedAt && !chore.approvedAt);
  const thisWeekCompleted = chores.filter(chore => {
    if (!chore.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(chore.completedAt) > weekAgo;
  }).length;

  const progressPercent = currentGoal ? Math.min((child.totalPoints / currentGoal.reward.pointsCost) * 100, 100) : 0;
  const pointsToGoal = currentGoal ? Math.max(currentGoal.reward.pointsCost - child.totalPoints, 0) : 0;

  return (
    <div className="responsive-container grid h-[calc(100dvh-143px)] grid-rows-[64px_32px_minmax(0,1fr)_120px] gap-2 p-0 overflow-hidden">
      {/* Row 1: Compact Header (64px) */}
      <div className="h-[64px] flex items-center justify-between border border-border rounded px-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">
            😊
          </div>
          <h2 className="text-xs font-bold truncate" data-testid="text-child-name">
            Hey {child.name}! 👋
          </h2>
        </div>
        <div className="flex gap-1">
          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-center min-w-[45px]">
            <div className="text-xs font-bold text-blue-600 leading-none" data-testid="text-total-points">{child.totalPoints}</div>
            <div className="text-xs text-blue-700 leading-none">Points</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-center min-w-[45px]">
            <div className="text-xs font-bold text-green-600 leading-none" data-testid="text-completed-today">{completedToday}</div>
            <div className="text-xs text-green-700 leading-none">Today</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-center min-w-[45px]">
            <div className="text-xs font-bold text-yellow-600 leading-none" data-testid="text-badges-earned">{badges.length}</div>
            <div className="text-xs text-yellow-700 leading-none">Badges</div>
          </div>
        </div>
      </div>

      {/* Row 2: Goal Progress (32px) */}
      <div className="h-[32px] flex items-center justify-between px-2 border border-border rounded overflow-hidden relative">
        {currentGoal ? (
          <>
            <div className="flex items-center gap-1 flex-1 truncate">
              <span className="text-sm">🎁</span>
              <span className="text-xs font-medium truncate">{currentGoal.reward.name}</span>
              {pointsToGoal > 0 && <span className="text-xs text-muted-foreground whitespace-nowrap">({pointsToGoal} to go)</span>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(progressPercent)}%</span>
            <div className="absolute inset-x-0 bottom-1 bg-muted rounded-full h-1 mx-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No goal selected</span>
        )}
      </div>

      {/* Row 3: Today's Quests (scrollable) */}
      <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Today's Quests ({pendingChores.length} left)
        </div>
        <div className="space-y-1">
          {choresLoading ? (
            <div className="text-xs text-muted-foreground">Loading tasks...</div>
          ) : pendingChores.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground">
              🎉 All done! Great job today!
            </div>
          ) : (
            pendingChores.slice(0, 3).map((chore) => (
              <div key={chore.id} className="flex items-center justify-between h-8 bg-muted rounded px-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">{chore.choreTemplate.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{chore.choreTemplate.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">+{chore.choreTemplate.pointValue}pt</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => completeChore.mutate(chore.id)}
                  disabled={completeChore.isPending}
                  data-testid={`button-complete-${chore.id}`}
                  className="text-xs px-2 py-1 h-6 ml-2"
                >
                  Complete
                </Button>
              </div>
            ))
          )}
          {pendingChores.length > 3 && (
            <div className="text-center text-xs text-muted-foreground">
              +{pendingChores.length - 3} more tasks
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Rewards & Badges (120px) */}
      <div className="h-[120px] grid grid-cols-2 gap-2">
        {/* Goal Selection / Quick Rewards */}
        <div className="h-full border border-border rounded p-2 overflow-hidden">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {currentGoal ? "Current Goal" : "Select Goal"}
          </div>
          {!currentGoal ? (
            <div className="space-y-1">
              {rewards.slice(0, 2).map((reward) => (
                <Button
                  key={reward.id}
                  variant="outline"
                  size="sm"
                  onClick={() => selectGoal.mutate(reward.id)}
                  disabled={selectGoal.isPending}
                  className="w-full justify-start text-xs h-6 px-2"
                  aria-ref="e222"
                >
                  <span className="mr-1">🎁</span>
                  <span className="truncate flex-1">{reward.name}</span>
                  <span className="text-xs">({reward.pointsCost}pt)</span>
                </Button>
              ))}
              {rewards.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">+{rewards.length - 2} more</div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              Working towards: {currentGoal.reward.name}
            </div>
          )}
        </div>

        {/* Badges Summary */}
        <div className="h-full border border-border rounded p-2 overflow-hidden">
          <div className="text-xs font-medium text-muted-foreground mb-1">Badges ({badges.length}/6)</div>
          <div className="grid grid-cols-3 gap-1 mb-1">
            {Array.from({ length: 6 }, (_, index) => {
              const badge = badges[index];
              return (
                <div
                  key={index}
                  className={`rounded p-1 text-center h-6 flex items-center justify-center ${
                    badge ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-200"
                  }`}
                  data-testid={`badge-slot-${index}`}
                >
                  <div className={`text-xs ${!badge ? "opacity-30" : ""}`}>
                    {badge ? badge.badgeIcon : "🎯"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-sm">
              {thisWeekCompleted >= 10 ? "🏆" : thisWeekCompleted >= 5 ? "🌟" : "💪"}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              {thisWeekCompleted >= 10 ? "Amazing!" : thisWeekCompleted >= 5 ? "Great!" : "Keep going!"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
