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
import { Users, CheckCircle, Star, Gift, Calendar, Plus, Activity, TrendingUp, GraduationCap, Brain, BookOpen } from "lucide-react";
import { useState } from "react";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isChoreDialogOpen, setIsChoreDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isLearningGoalDialogOpen, setIsLearningGoalDialogOpen] = useState(false);
  
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

  // Get recent activity from all children
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
    defaultValues: { name: "", description: "", pointValue: 10, icon: "🧹", frequency: "daily", parentId: "" },
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

  // Calculate summary statistics
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

  return (
    <div className="responsive-container grid h-[calc(100dvh-143px)] grid-rows-[80px_100px_minmax(0,1fr)] gap-3 p-0 overflow-hidden">
      {/* Row 1: Enhanced KPI Header (80px) */}
      <div className="h-[80px] bg-gradient-to-r from-blue-50 to-purple-50 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between h-full">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground" data-testid="text-dashboard-title">
              Parent Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">Manage chores & learning goals</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/80 border border-green-200 rounded-lg px-4 py-2 text-center min-w-[70px] shadow-sm">
              <div className="text-lg font-bold text-green-600" data-testid="text-completed-today">{completedToday}</div>
              <div className="text-xs text-green-700">Today</div>
            </div>
            <div className="bg-white/80 border border-blue-200 rounded-lg px-4 py-2 text-center min-w-[70px] shadow-sm">
              <div className="text-lg font-bold text-blue-600" data-testid="text-total-points">{totalPoints}</div>
              <div className="text-xs text-blue-700">Points</div>
            </div>
            <div className="bg-white/80 border border-orange-200 rounded-lg px-4 py-2 text-center min-w-[70px] shadow-sm">
              <div className="text-lg font-bold text-orange-600" data-testid="text-pending-approvals">{pendingApprovals}</div>
              <div className="text-xs text-orange-700">Pending</div>
            </div>
            <div className="bg-white/80 border border-purple-200 rounded-lg px-4 py-2 text-center min-w-[70px] shadow-sm">
              <div className="text-lg font-bold text-purple-600" data-testid="text-week-completed">{thisWeekCompleted}</div>
              <div className="text-xs text-purple-700">Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Enhanced Action Buttons (100px) */}
      <div className="h-[100px] bg-white border border-border rounded-lg p-4">
        <div className="flex flex-col h-full">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
          <div className="flex items-center gap-3 flex-1">
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
                      <FormLabel>Chore Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-chore-name" />
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
                <Button type="submit" disabled={createChoreTemplate.isPending} data-testid="button-save-chore">
                  {createChoreTemplate.isPending ? "Creating..." : "Create Chore"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex items-center gap-1" data-testid="button-add-reward">
              <Gift className="w-3 h-3" />
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
              <Button size="default" variant="outline" className="flex items-center gap-2 bg-orange-50 border-orange-200">
                <Activity className="w-4 h-4" />
                Review Approvals ({pendingApprovals})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Large Rectangular Panels for Learning Content */}
      <div className="min-h-0 grid grid-cols-2 gap-4">
        {/* Family Management Panel - Larger Rectangle */}
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Family Overview</h3>
            <span className="text-sm text-muted-foreground">{children.length} children</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {childrenLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : children.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No children yet</p>
              </div>
            ) : (
              children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">😊</div>
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-muted-foreground">{child.age} years old</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{child.totalPoints} pts</div>
                    <div className="text-xs text-muted-foreground">Total earned</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Goals Panel - Larger Rectangle */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Learning Goals
            </h3>
            <span className="text-sm text-muted-foreground">{learningGoals.length} active</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {learningGoals.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No learning goals yet</p>
                <Dialog open={isLearningGoalDialogOpen} onOpenChange={setIsLearningGoalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2" data-testid="button-add-learning-goal">
                      <BookOpen className="w-4 h-4" />
                      Create Learning Goal
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
                                <Input {...field} placeholder="e.g., Math, Science, History" data-testid="input-subject" />
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
            ) : (
              learningGoals.map((goal) => (
                <div key={goal.id} className="bg-white/80 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{goal.subject}</div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {goal.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Target: {goal.targetUnits} activities • {goal.pointsPerUnit} pts each
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateContent.mutate(goal.id)}
                    disabled={generateContent.isPending}
                    className="w-full"
                    data-testid="button-generate-content"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {generateContent.isPending ? "Generating..." : "Generate Content"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
