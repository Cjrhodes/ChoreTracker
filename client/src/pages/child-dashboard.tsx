import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Star, Trophy, Target, Clock, Gift, BookOpen, Brain, Play, Award, MessageCircle, Send } from "lucide-react";
import type { Child, AssignedChore, ChoreTemplate, EarnedBadge, Reward, GoalSelection, LearningGoal, LearningActivity, QuizAttempt } from "@shared/schema";
import { UniversalChatWidget } from "@/components/ui/universal-chat-widget";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };
type GoalWithReward = GoalSelection & { reward: Reward };

interface ChatMessage {
  role: 'agent' | 'child';
  content: string;
  timestamp: string;
  type?: 'reminder' | 'encouragement' | 'goal_coaching' | 'general_chat';
}

export default function ChildDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  const { data: activeQuiz } = useQuery<any>({
    queryKey: ["/api/quizzes", "active", child?.id],
    enabled: !!child,
  });

  const { data: dailyProgress = [] } = useQuery<any[]>({
    queryKey: ["/api/children", child?.id, "daily-progress"],
    enabled: !!child,
  });

  const { data: availableTasks = [] } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/children", child?.id, "available-tasks"],
    enabled: !!child,
  });

  // WebSocket connection effect
  useEffect(() => {
    if (!child?.id) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with child ID
      ws.send(JSON.stringify({
        type: 'auth',
        childId: child.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'agent_message') {
          const newMessage: ChatMessage = {
            role: 'agent',
            content: message.content,
            timestamp: message.timestamp,
            type: message.messageType
          };
          
          setChatMessages(prev => [...prev, newMessage]);
          
          // Auto-open chat for important messages like reminders
          if (message.messageType === 'reminder') {
            setIsChatOpen(true);
            toast({
              title: "Message from your ChoreChamp Agent! 🤖",
              description: message.content.substring(0, 50) + "...",
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [child?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send message to AI agent
  const sendMessage = () => {
    if (!currentMessage.trim() || !wsRef.current || !child?.id) return;

    const userMessage: ChatMessage = {
      role: 'child',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Send to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      childId: child.id,
      message: currentMessage
    }));

    setCurrentMessage('');
  };

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
    mutationFn: async ({ quizId, selectedAnswer }: { quizId: string; selectedAnswer: string }): Promise<{ isCorrect: boolean; pointsEarned: number }> => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/submit`, {
        childId: child?.id,
        selectedAnswer,
      });
      return await response.json();
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

  const selfAssignTask = useMutation({
    mutationFn: async (choreTemplateId: string) => {
      await apiRequest("POST", `/api/children/${child?.id}/self-assign`, {
        choreTemplateId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", child?.id, "chores"] });
      toast({
        title: "Task assigned! 🎯",
        description: "You can now complete this task to earn points!",
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

  // Level progress calculation
  const currentLevel = child.level || 1;
  const currentXP = child.experiencePoints || 0;
  
  // Level thresholds: Level N requires 100 * (N-1)^2 XP
  const getLevelThreshold = (level: number) => 100 * Math.pow(level - 1, 2);
  const currentLevelStart = getLevelThreshold(currentLevel);
  const nextLevelStart = getLevelThreshold(currentLevel + 1);
  const levelProgressXP = currentXP - currentLevelStart;
  const levelProgressNeeded = nextLevelStart - currentLevelStart;
  const levelProgressPercent = (levelProgressXP / levelProgressNeeded) * 100;
  const xpToNextLevel = nextLevelStart - currentXP;

  // Daily streak and category progress calculations
  const today = new Date().toISOString().split('T')[0];
  const todayProgress = dailyProgress.find(p => p.date === today);
  
  // Calculate current streak (consecutive days with completed tasks)
  const getCurrentStreak = () => {
    if (!dailyProgress.length) return 0;
    const sortedProgress = [...dailyProgress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    for (const progress of sortedProgress) {
      if (progress.completedChores > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = getCurrentStreak();
  
  // Today's category completion status
  const todayCategoryProgress = {
    household: todayProgress?.categoriesCompleted?.household || 0,
    exercise: todayProgress?.categoriesCompleted?.exercise || 0,
    educational: todayProgress?.categoriesCompleted?.educational || 0,
    outdoor: todayProgress?.categoriesCompleted?.outdoor || 0,
  };
  
  const completedCategoriesToday = Object.values(todayCategoryProgress).filter(count => count > 0).length;

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
          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1 text-center min-w-[45px]">
            <div className="text-xs font-bold text-purple-600 leading-none" data-testid="text-level">Lvl {child.level || 1}</div>
            <div className="text-xs text-purple-700 leading-none">{child.experiencePoints || 0} XP</div>
          </div>
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

      {/* Row 2: Level Progress (32px) */}
      <div className="h-[32px] flex items-center justify-between px-2 border border-border rounded overflow-hidden relative bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-1 flex-1 truncate">
          <span className="text-sm">⭐</span>
          <span className="text-xs font-medium">Level {currentLevel}</span>
          {xpToNextLevel > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">({xpToNextLevel} XP to Level {currentLevel + 1})</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(levelProgressPercent)}%</span>
        <div className="absolute inset-x-0 bottom-1 bg-muted rounded-full h-1 mx-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-yellow-500 h-full rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, levelProgressPercent))}%` }}
          ></div>
        </div>
      </div>

      {/* Row 3: Activities Hub (scrollable) */}
      <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
        {/* Active Quiz Section */}
        {activeQuiz && activeQuiz.content && (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-800">Learning Quiz!</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                +{activeQuiz.content.pointsReward || 10} pts
              </span>
            </div>
            <div className="text-sm mb-3 text-gray-700">{activeQuiz.content.question}</div>
            <div className="space-y-2">
              {activeQuiz.content.options?.map((option: string, index: number) => (
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
              )) || (
                <div className="text-xs text-muted-foreground">Loading quiz options...</div>
              )}
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
                  <div className="text-xs text-blue-700 mb-2">
                    {(activity.content as any)?.synopsis?.content || "Learning content available"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-6 px-2 border-blue-300">
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </Button>
                    {(activity.resourceLinks as any) && (
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


        {/* Available Tasks Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Choose New Tasks ({availableTasks.length})</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableTasks.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-1 opacity-50" />
                No tasks available to assign
              </div>
            ) : (
              availableTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{task.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                    </div>
                    <div className="text-xs text-blue-600 whitespace-nowrap">+{task.pointValue}pt</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => selfAssignTask.mutate(task.id)}
                    disabled={selfAssignTask.isPending}
                    data-testid={`button-assign-${task.id}`}
                    className="text-xs px-2 py-1 h-6 ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800"
                  >
                    Pick This!
                  </Button>
                </div>
              ))
            )}
            {availableTasks.length > 4 && (
              <div className="text-center text-xs text-muted-foreground">
                +{availableTasks.length - 4} more tasks available
              </div>
            )}
          </div>
        </div>

        {/* My Chores Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">
              My Tasks ({pendingChores.length} to complete)
            </span>
          </div>
          <div className="space-y-1">
            {choresLoading ? (
              <div className="text-xs text-muted-foreground">Loading tasks...</div>
            ) : pendingChores.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                <Target className="w-8 h-8 mx-auto mb-1 opacity-50" />
                Pick some tasks above! 📋
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

      {/* Row 4: Activity Streaks & Categories (120px) */}
      <div className="h-[120px] grid grid-cols-2 gap-2">
        {/* Daily Streak Display */}
        <div className="h-full border border-border rounded p-2 overflow-hidden bg-gradient-to-br from-orange-50 to-red-50">
          <div className="text-xs font-medium text-muted-foreground mb-1">Daily Streak</div>
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-orange-600" data-testid="text-streak-count">
              {currentStreak}
              <span className="text-lg">🔥</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {currentStreak === 0 ? "Start your streak!" : 
               currentStreak === 1 ? "Day 1 - Keep going!" :
               currentStreak < 7 ? `${currentStreak} days strong!` :
               "Amazing streak! 🎉"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-center">
              <span className="text-orange-600 font-medium">Today:</span>
              <span className="text-muted-foreground ml-1">
                {completedToday} chore{completedToday !== 1 ? 's' : ''} completed
              </span>
            </div>
          </div>
        </div>

        {/* Category Progress Display */}
        <div className="h-full border border-border rounded p-2 overflow-hidden bg-gradient-to-br from-green-50 to-blue-50">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Categories Today ({completedCategoriesToday}/4)
          </div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {[
              { key: 'household', icon: '🧹', label: 'House' },
              { key: 'exercise', icon: '🏃‍♂️', label: 'Exercise' },
              { key: 'educational', icon: '📚', label: 'Learn' },
              { key: 'outdoor', icon: '🌳', label: 'Outdoor' }
            ].map((category) => {
              const completed = todayCategoryProgress[category.key as keyof typeof todayCategoryProgress] > 0;
              return (
                <div
                  key={category.key}
                  className={`rounded p-1 text-center h-6 flex items-center justify-center ${
                    completed ? "bg-green-100 border border-green-300" : "bg-gray-50 border border-gray-200"
                  }`}
                  data-testid={`category-${category.key}`}
                >
                  <span className={`text-xs ${!completed ? "opacity-30" : ""}`}>
                    {category.icon}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">
              {completedCategoriesToday === 0 ? "Complete different task types!" :
               completedCategoriesToday === 1 ? "Great start! Try other categories" :
               completedCategoriesToday === 2 ? "Bonus points unlocked! 🎉" :
               completedCategoriesToday === 3 ? "Super bonus! One more! 🌟" :
               "MAXIMUM BONUS! All categories! 🏆"}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg z-50"
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-6 h-6" />
        {!isConnected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
      </Button>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                🤖
              </div>
              <div>
                <div className="text-sm font-bold">ChoreChamp Agent</div>
                <div className="text-xs text-muted-foreground">
                  {isConnected ? "Online and ready to chat!" : "Connecting..."}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-4xl mb-2">👋</div>
                <p>Start chatting with your ChoreChamp Agent!</p>
                <p className="text-xs mt-1">Ask about your tasks, goals, or just say hi!</p>
              </div>
            )}
            
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'child'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 opacity-70 ${
                      message.role === 'child' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!isConnected}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={sendMessage}
                disabled={!currentMessage.trim() || !isConnected}
                className="bg-blue-500 hover:bg-blue-600"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!isConnected && (
              <div className="text-xs text-red-500 mt-1">
                Reconnecting to chat...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Always-available UniversalChatWidget in bottom-right corner */}
      {child && (
        <UniversalChatWidget 
          partyType="child"
          partyId={child.id} 
          userName={child.name}
        />
      )}
    </div>
  );
}
