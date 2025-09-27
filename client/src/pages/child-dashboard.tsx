import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Star, Trophy, Target, Clock, Gift, BookOpen, Brain, Play, Award } from "lucide-react";
import type { Child, AssignedChore, ChoreTemplate, EarnedBadge, Reward, GoalSelection, LearningGoal, LearningActivity, Quiz, QuizAttempt } from "@shared/schema";

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

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/learning-goals", "child", child?.id],
    enabled: !!child,
  });

  const { data: learningActivities = [] } = useQuery<LearningActivity[]>({
    queryKey: ["/api/learning-activities", "child", child?.id],
    enabled: !!child,
  });

  const { data: activeQuiz } = useQuery<Quiz>({
    queryKey: ["/api/quizzes", "active", child?.id],
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

  const generateContent = useMutation({
    mutationFn: async (goalId: string) => {
      await apiRequest("POST", `/api/learning-goals/${goalId}/generate-content`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning-activities", "child", child?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", "active", child?.id] });
      toast({
        title: "Learning adventure ready! 📚",
        description: "New learning activities have been created for you!",
      });
    },
  });

  const submitQuizAnswer = useMutation({
    mutationFn: async ({ quizId, selectedAnswer }: { quizId: string; selectedAnswer: string }) => {
      return await apiRequest("POST", `/api/quizzes/${quizId}/submit`, {
        childId: child?.id,
        selectedAnswer,
      });
    },
    onSuccess: (data: { isCorrect: boolean; pointsEarned: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", child?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", "active", child?.id] });
      if (data.isCorrect) {
        toast({
          title: "Correct! 🎉",
          description: `Great job! You earned ${data.pointsEarned} points!`,
        });
      } else {
        toast({
          title: "Keep trying! 💪",
          description: "That's not quite right, but don't give up!",
        });
      }
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

      {/* Row 3: Activities Hub (scrollable) */}
      <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
        {/* Active Quiz Section */}
        {activeQuiz && (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-800">Learning Quiz!</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">+{activeQuiz.pointsReward} pts</span>
            </div>
            <div className="text-sm mb-3 text-gray-700">{activeQuiz.question}</div>
            <div className="space-y-2">
              {activeQuiz.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => submitQuizAnswer.mutate({ quizId: activeQuiz.id, selectedAnswer: option })}
                  disabled={submitQuizAnswer.isPending}
                  className="w-full justify-start text-xs h-8 px-3 border-purple-200 hover:bg-purple-50"
                  data-testid={`button-quiz-option-${index}`}
                >
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Learning Activities Section */}
        {learningActivities.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Learning Adventures</span>
            </div>
            <div className="space-y-2">
              {learningActivities.slice(0, 2).map((activity) => (
                <div key={activity.id} className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs font-medium text-blue-900 mb-1">{activity.title}</div>
                  <div className="text-xs text-blue-700 mb-2">{activity.synopsis}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-6 px-2 border-blue-300">
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                    {activity.learningLink && (
                      <Button size="sm" variant="outline" className="text-xs h-6 px-2 border-blue-300">
                        Learn More
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Goals Section */}
        {learningGoals.length > 0 && !activeQuiz && learningActivities.length === 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">Ready to Learn?</span>
            </div>
            <div className="space-y-2">
              {learningGoals.slice(0, 2).map((goal) => (
                <div key={goal.id} className="p-2 bg-green-50 border border-green-200 rounded">
                  <div className="text-xs font-medium text-green-900 mb-1">{goal.subject}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">Ready for new activities!</span>
                    <Button
                      size="sm"
                      onClick={() => generateContent.mutate(goal.id)}
                      disabled={generateContent.isPending}
                      className="text-xs h-6 px-2 bg-green-100 hover:bg-green-200 text-green-800"
                      data-testid={`button-generate-${goal.id}`}
                    >
                      <Award className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chores Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">
              Today's Chores ({pendingChores.length} left)
            </span>
          </div>
          <div className="space-y-1">
            {choresLoading ? (
              <div className="text-xs text-muted-foreground">Loading tasks...</div>
            ) : pendingChores.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                🎉 All chores done! Amazing work!
              </div>
            ) : (
              pendingChores.slice(0, 3).map((chore) => (
                <div key={chore.id} className="flex items-center justify-between h-8 bg-orange-50 border border-orange-200 rounded px-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{chore.choreTemplate.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{chore.choreTemplate.name}</div>
                    </div>
                    <div className="text-xs text-orange-600 whitespace-nowrap">+{chore.choreTemplate.pointValue}pt</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => completeChore.mutate(chore.id)}
                    disabled={completeChore.isPending}
                    data-testid={`button-complete-${chore.id}`}
                    className="text-xs px-2 py-1 h-6 ml-2 bg-orange-100 hover:bg-orange-200 text-orange-800"
                  >
                    Complete
                  </Button>
                </div>
              ))
            )}
            {pendingChores.length > 3 && (
              <div className="text-center text-xs text-muted-foreground">
                +{pendingChores.length - 3} more chores
              </div>
            )}
          </div>
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
