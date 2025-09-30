import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChildSchema, insertChoreTemplateSchema, insertRewardSchema, insertLearningGoalSchema, type Child, type InsertChild, type ChoreTemplate, type InsertChoreTemplate, type Reward, type InsertReward, type AssignedChore, type LearningGoal, type InsertLearningGoal } from "@shared/schema";
import { Users, CheckCircle, Star, Gift, Calendar, Plus, Activity, TrendingUp, GraduationCap, Brain, BookOpen, Eye, Sparkles, Dumbbell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ParentTaskSuggestions } from "@/components/parent/task-suggestions";
import { UniversalChatWidget } from "@/components/ui/universal-chat-widget";
import { LearningGoalSuggestions } from "@/components/child/learning-goal-suggestions";
import { ExerciseSuggestions } from "@/components/child/exercise-suggestions";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isChoreDialogOpen, setIsChoreDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isLearningGoalDialogOpen, setIsLearningGoalDialogOpen] = useState(false);
  const [isContentViewDialogOpen, setIsContentViewDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [selectedChildForSuggestions, setSelectedChildForSuggestions] = useState<string | null>(null);
  
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const { data: choreTemplates = [] } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/chore-templates"],
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/learning/goals"],
    enabled: !!user,
  });

  const { data: learningActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/learning-activities", "parent", learningGoals.map(g => g.id)],
    queryFn: async () => {
      if (learningGoals.length === 0) return [];
      
      const allActivities = [];
      for (const goal of learningGoals) {
        try {
          const response = await fetch(`/api/learning/activities?goalId=${goal.id}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const activities = await response.json();
            allActivities.push(...activities);
          }
        } catch (error) {
          console.error(`Error fetching activities for goal ${goal.id}:`, error);
        }
      }
      return allActivities;
    },
    enabled: !!user && learningGoals.length > 0,
  });

  const { data: recentChores = [] } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/recent-chores"],
    enabled: !!user && children.length > 0,
  });

  const childForm = useForm<InsertChild>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: { name: "", age: 8, parentId: "" },
  });

  const choreForm = useForm<InsertChoreTemplate>({
    resolver: zodResolver(insertChoreTemplateSchema),
    defaultValues: { name: "", description: "", pointValue: 10, icon: "🧹", category: "household", frequency: "daily", parentId: "" },
  });

  const rewardForm = useForm<InsertReward>({
    resolver: zodResolver(insertRewardSchema),
    defaultValues: { name: "", description: "", pointsCost: 100, category: "item", parentId: "" },
  });

  const learningGoalForm = useForm<InsertLearningGoal>({
    resolver: zodResolver(insertLearningGoalSchema),
    defaultValues: { childId: "", subject: "", difficulty: "medium", targetUnits: 5, pointsPerUnit: 10, parentId: "" },
  });

  const createChild = useMutation({
    mutationFn: async (data: InsertChild) => {
      await apiRequest("POST", "/api/children", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsChildDialogOpen(false);
      childForm.reset();
      toast({ title: "Child Added! 🎉", description: "Your child has been added successfully." });
    },
  });

  const createChoreTemplate = useMutation({
    mutationFn: async (data: InsertChoreTemplate) => {
      await apiRequest("POST", "/api/chore-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chore-templates"] });
      setIsChoreDialogOpen(false);
      choreForm.reset();
      toast({ title: "Chore Created! ✅", description: "New chore template has been created." });
    },
  });

  const createReward = useMutation({
    mutationFn: async (data: InsertReward) => {
      await apiRequest("POST", "/api/rewards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setIsRewardDialogOpen(false);
      rewardForm.reset();
      toast({ title: "Reward Created! 🎁", description: "New reward has been added." });
    },
  });

  const createLearningGoal = useMutation({
    mutationFn: async (data: InsertLearningGoal) => {
      await apiRequest("POST", "/api/learning/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning/goals"] });
      setIsLearningGoalDialogOpen(false);
      learningGoalForm.reset();
      toast({ title: "Learning Goal Created! 🎯", description: "AI will help create educational content." });
    },
  });

  const generateContent = useMutation({
    mutationFn: async (goalId: string) => {
      await apiRequest("POST", `/api/learning-goals/${goalId}/generate-content`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({ title: "Learning adventure ready! 🚀", description: "Educational content has been generated." });
    },
    onError: () => {
      toast({ 
        title: "Content Generation Failed", 
        description: "Please try again later.",
        variant: "destructive"
      });
    },
  });

  const approveChore = useMutation({
    mutationFn: async ({ choreId, pointsAwarded }: { choreId: string; pointsAwarded: number }) => {
      await apiRequest("PATCH", `/api/assigned-chores/${choreId}/approve`, { pointsAwarded });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsApprovalDialogOpen(false);
      toast({ title: "Chore Approved! ✅", description: "Points have been awarded to the child." });
    },
  });

  const totalPoints = children.reduce((sum, child) => sum + child.totalPoints, 0);
  const completedToday = recentChores.filter(chore => {
    if (!chore.completedAt) return false;
    const today = new Date().toISOString().split('T')[0];
    return new Date(chore.completedAt).toISOString().startsWith(today);
  }).length;
  const pendingApprovals = recentChores.filter(chore => chore.completedAt && !chore.approvedAt).length;
  const thisWeekCompleted = recentChores.filter(chore => {
    if (!chore.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(chore.completedAt) > weekAgo;
  }).length;

  const targetChild = children.find(c => c.id === selectedChildForSuggestions) || children[0];

  return (
    <div className="responsive-container h-[calc(100dvh-143px)] p-0 overflow-hidden">
      <Tabs defaultValue="dashboard" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 p-0">
          <TabsTrigger 
            value="dashboard" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            data-testid="tab-dashboard"
          >
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1 mt-0 overflow-hidden">
          <div className="h-full grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Family Stats</h3>
                <div className="flex gap-3">
                  <div className="bg-white/80 border border-green-200 rounded-lg px-3 py-2 text-center flex-1">
                    <div className="text-lg font-bold text-green-600" data-testid="text-completed-today">{completedToday}</div>
                    <div className="text-xs text-green-700">Today</div>
                  </div>
                  <div className="bg-white/80 border border-blue-200 rounded-lg px-3 py-2 text-center flex-1">
                    <div className="text-lg font-bold text-blue-600" data-testid="text-total-points">{totalPoints}</div>
                    <div className="text-xs text-blue-700">Points</div>
                  </div>
                  <div className="bg-white/80 border border-orange-200 rounded-lg px-3 py-2 text-center flex-1">
                    <div className="text-lg font-bold text-orange-600" data-testid="text-pending-approvals">{pendingApprovals}</div>
                    <div className="text-xs text-orange-700">Pending</div>
                  </div>
                  <div className="bg-white/80 border border-purple-200 rounded-lg px-3 py-2 text-center flex-1">
                    <div className="text-lg font-bold text-purple-600" data-testid="text-week-completed">{thisWeekCompleted}</div>
                    <div className="text-xs text-purple-700">Week</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Family Overview</h3>
                  <span className="text-xs text-muted-foreground">{children.length} kids</span>
                </div>
                <div className="space-y-2 max-h-[100px] overflow-y-auto">
                  {childrenLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : children.length === 0 ? (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No children yet</p>
                    </div>
                  ) : (
                    children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">😊</div>
                          <div>
                            <div className="text-sm font-medium">{child.name}</div>
                            <div className="text-xs text-muted-foreground">Level {child.level || 1} • {child.totalPoints} pts</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-primary">{child.experiencePoints || 0} XP</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Dialog open={isChildDialogOpen} onOpenChange={setIsChildDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="default" className="flex items-center gap-2" data-testid="button-add-child">
                      <Users className="w-4 h-4" />
                      Add Child
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Child</DialogTitle>
                    </DialogHeader>
                    <Form {...childForm}>
                      <form onSubmit={childForm.handleSubmit((data) => createChild.mutate(data))} className="space-y-4">
                        <FormField
                          control={childForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-child-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={childForm.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-child-age" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createChild.isPending} data-testid="button-save-child">
                          {createChild.isPending ? "Adding..." : "Add Child"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isChoreDialogOpen} onOpenChange={setIsChoreDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="default" variant="outline" className="flex items-center gap-2" data-testid="button-add-chore">
                      <CheckCircle className="w-4 h-4" />
                      Add Chore
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Chore Template</DialogTitle>
                    </DialogHeader>
                    <Form {...choreForm}>
                      <form onSubmit={choreForm.handleSubmit((data) => createChoreTemplate.mutate(data))} className="space-y-4">
                        <FormField
                          control={choreForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-chore-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={choreForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-chore-category">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="household">🧹 Household</SelectItem>
                                  <SelectItem value="exercise">🏃‍♂️ Exercise</SelectItem>
                                  <SelectItem value="educational">📚 Educational</SelectItem>
                                  <SelectItem value="outdoor">🌳 Outdoor</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={choreForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  value={field.value || ""} 
                                  placeholder="Describe the task..." 
                                  data-testid="input-chore-description" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={choreForm.control}
                          name="pointValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points Value</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-chore-points" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={choreForm.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-chore-icon">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="🧹">🧹 Cleaning</SelectItem>
                                  <SelectItem value="🏃‍♂️">🏃‍♂️ Running</SelectItem>
                                  <SelectItem value="🏋️‍♀️">🏋️‍♀️ Strength</SelectItem>
                                  <SelectItem value="🚴‍♂️">🚴‍♂️ Cycling</SelectItem>
                                  <SelectItem value="🏊‍♀️">🏊‍♀️ Swimming</SelectItem>
                                  <SelectItem value="📚">📚 Reading</SelectItem>
                                  <SelectItem value="✏️">✏️ Writing</SelectItem>
                                  <SelectItem value="🧮">🧮 Math</SelectItem>
                                  <SelectItem value="🌳">🌳 Outdoor</SelectItem>
                                  <SelectItem value="🎯">🎯 Goal</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createChoreTemplate.isPending} data-testid="button-save-chore">
                          {createChoreTemplate.isPending ? "Creating..." : "Create Chore"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="default" variant="outline" className="flex items-center gap-2" data-testid="button-add-reward">
                      <Gift className="w-4 h-4" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Reward</DialogTitle>
                    </DialogHeader>
                    <Form {...rewardForm}>
                      <form onSubmit={rewardForm.handleSubmit((data) => createReward.mutate(data))} className="space-y-4">
                        <FormField
                          control={rewardForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reward Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-reward-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={rewardForm.control}
                          name="pointsCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points Cost</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-reward-points" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={createReward.isPending} data-testid="button-save-reward">
                          {createReward.isPending ? "Creating..." : "Create Reward"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                {pendingApprovals > 0 && (
                  <Button 
                    size="default" 
                    variant="outline" 
                    className="flex items-center gap-2 bg-orange-50 border-orange-200"
                    onClick={() => setIsApprovalDialogOpen(true)}
                    data-testid="button-review-approvals"
                  >
                    <Activity className="w-4 h-4" />
                    Review Approvals ({pendingApprovals})
                  </Button>
                )}
              </div>
            </div>

            <div className="min-h-0 grid grid-cols-[200px_1fr] gap-3">
              <Tabs defaultValue="chores" orientation="vertical" className="h-full">
                <TabsList className="flex flex-col h-auto w-full gap-1">
                  <TabsTrigger value="chores" className="w-full justify-start" data-testid="tab-chores">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Chores & Tasks
                  </TabsTrigger>
                  <TabsTrigger value="learning" className="w-full justify-start" data-testid="tab-learning">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Learning Activities
                  </TabsTrigger>
                  <TabsTrigger value="exercise" className="w-full justify-start" data-testid="tab-exercise">
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Exercise Tasks
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chores" className="h-full mt-0 ml-3 flex flex-col gap-3">
                  <div className="bg-white border border-border rounded-lg p-4 flex-1 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Chore Templates</h3>
                    {choreTemplates.filter(t => t.category !== 'exercise').length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No chore templates yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {choreTemplates.filter(t => t.category !== 'exercise').map(chore => (
                          <div key={chore.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{chore.icon}</span>
                                <div>
                                  <div className="font-medium">{chore.name}</div>
                                  <div className="text-xs text-muted-foreground">{chore.pointValue} pts</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                    <ParentTaskSuggestions children={children} />
                  </div>
                </TabsContent>

                <TabsContent value="learning" className="h-full mt-0 ml-3 flex flex-col gap-3">
                  <div className="bg-white border border-border rounded-lg p-4 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Learning Goals
                      </h3>
                      <Dialog open={isLearningGoalDialogOpen} onOpenChange={setIsLearningGoalDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center gap-1" data-testid="button-add-learning-goal">
                            <Plus className="w-3 h-3" />
                            Add Goal
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Learning Goal</DialogTitle>
                          </DialogHeader>
                          <Form {...learningGoalForm}>
                            <form onSubmit={learningGoalForm.handleSubmit((data) => createLearningGoal.mutate(data))} className="space-y-4">
                              <FormField
                                control={learningGoalForm.control}
                                name="childId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Child</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-child">
                                          <SelectValue placeholder="Select a child" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {children.map((child) => (
                                          <SelectItem key={child.id} value={child.id}>
                                            {child.name} (Age {child.age})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={learningGoalForm.control}
                                name="subject"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., Ocean Animals, Space, History" data-testid="input-subject" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={learningGoalForm.control}
                                name="difficulty"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Difficulty Level</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-difficulty">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={createLearningGoal.isPending} data-testid="button-save-learning-goal">
                                {createLearningGoal.isPending ? "Creating..." : "Create Learning Goal"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-3">
                      {learningGoals.length === 0 ? (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No learning goals yet</p>
                        </div>
                      ) : (
                        learningGoals.map((goal) => (
                          <div key={goal.id} className="bg-muted/50 p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{goal.subject}</div>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {goal.difficulty}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              Target: {goal.targetUnits} activities • {goal.pointsPerUnit} pts each
                            </div>
                            {(() => {
                              const goalActivities = learningActivities.filter(activity => activity.goalId === goal.id);
                              const hasContent = goalActivities.length > 0;
                              
                              return (
                                <div className="space-y-2">
                                  {hasContent && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedGoal(goal);
                                        setIsContentViewDialogOpen(true);
                                      }}
                                      className="w-full"
                                      data-testid="button-view-content"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Generated Content ({goalActivities.length})
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => generateContent.mutate(goal.id)}
                                    disabled={generateContent.isPending}
                                    className="w-full"
                                    data-testid="button-generate-content"
                                  >
                                    <Brain className="w-4 h-4 mr-2" />
                                    {generateContent.isPending ? "Generating..." : hasContent ? "Generate More Content" : "Generate Content"}
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
                    {children.length > 0 && targetChild ? (
                      <LearningGoalSuggestions child={targetChild} />
                    ) : (
                      <div className="text-center py-6" data-testid="learning-goal-suggestions">
                        <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Add children to generate learning goal suggestions</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="exercise" className="h-full mt-0 ml-3 flex flex-col gap-3">
                  <div className="bg-white border border-border rounded-lg p-4 flex-1 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Exercise Tasks</h3>
                    {choreTemplates.filter(t => t.category === 'exercise').length === 0 ? (
                      <div className="text-center py-8">
                        <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No exercise tasks yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {choreTemplates.filter(t => t.category === 'exercise').map(chore => (
                          <div key={chore.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{chore.icon}</span>
                                <div>
                                  <div className="font-medium">{chore.name}</div>
                                  <div className="text-xs text-muted-foreground">{chore.pointValue} pts</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-3">
                    {children.length > 0 && targetChild ? (
                      <ExerciseSuggestions child={targetChild} />
                    ) : (
                      <div className="text-center py-6" data-testid="exercise-suggestions">
                        <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Add children to generate exercise suggestions</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isContentViewDialogOpen} onOpenChange={setIsContentViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generated Content: {selectedGoal?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              {(() => {
                const goalActivities = learningActivities.filter(activity => activity.goalId === selectedGoal.id);
                
                return goalActivities.length > 0 ? (
                  goalActivities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{activity.title}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {activity.type}
                        </span>
                      </div>
                      
                      {activity.type === 'synopsis' && activity.content?.synopsis && (
                        <div className="space-y-3">
                          <div className="prose prose-sm max-w-none">
                            <h4 className="text-md font-medium text-gray-900">Learning Synopsis</h4>
                            <p className="text-gray-700">{activity.content.synopsis.content}</p>
                            
                            {activity.content.synopsis.keyPoints && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Key Learning Points:</h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {activity.content.synopsis.keyPoints.map((point: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-700">{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activity.type === 'video' && activity.content && (
                        <div>
                          <a 
                            href={activity.content.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Watch Video
                          </a>
                        </div>
                      )}

                      {activity.type === 'worksheet' && activity.content?.questions && (
                        <div className="space-y-2">
                          {activity.content.questions.map((q: any, i: number) => (
                            <div key={i} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No content generated yet</p>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Completed Chores</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {recentChores.filter(chore => chore.completedAt && !chore.approvedAt).map((chore) => (
              <div key={chore.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{chore.choreTemplate.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Completed {new Date(chore.completedAt!).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{chore.choreTemplate.pointValue} pts</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => approveChore.mutate({ choreId: chore.id, pointsAwarded: chore.choreTemplate.pointValue })}
                  disabled={approveChore.isPending}
                  className="w-full"
                >
                  {approveChore.isPending ? "Approving..." : "Approve & Award Points"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <UniversalChatWidget 
        partyType="parent" 
        partyId={user?.id || ''} 
        userName={user?.firstName || 'Parent'} 
      />
    </div>
  );
}
