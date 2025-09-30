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
import { useState } from "react";
import { UniversalChatWidget } from "@/components/ui/universal-chat-widget";
import { AutoSuggestions } from "@/components/parent/auto-suggestions";

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
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isChildDetailsDialogOpen, setIsChildDetailsDialogOpen] = useState(false);
  
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

  const assignSuggestionMutation = useMutation({
    mutationFn: async ({ suggestionId, childId }: { suggestionId: string; childId: string }) => {
      return apiRequest('POST', `/api/ai/suggestions/${suggestionId}/assign`, { childId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chore-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/goals'] });
      toast({
        title: "Task Assigned! ✅",
        description: "The task has been assigned to the family member.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Couldn't assign the task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent, child: Child) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const { suggestionId } = JSON.parse(data);
        assignSuggestionMutation.mutate({ suggestionId, childId: child.id });
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const pendingApprovals = recentChores.filter(chore => chore.completedAt && !chore.approvedAt).length;

  // Use first child for suggestions, or empty string
  const suggestionChildId = children[0]?.id || '';

  return (
    <div className="responsive-container h-[calc(100dvh-143px)] p-3 overflow-hidden">
      <div className="h-full flex flex-col gap-3">
        {/* Top Action Bar */}
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

        {/* 4-Column Layout */}
        <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
          {/* Column 1: Family Members */}
          <Card className="flex flex-col overflow-hidden" data-testid="panel-family">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Family Members
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => setIsChildDialogOpen(true)}
                  data-testid="button-add-child-quick"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {childrenLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : children.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No children yet</p>
                  </div>
                ) : (
                  children.map((child) => (
                    <div 
                      key={child.id} 
                      className="p-2 bg-muted/50 rounded-lg border-2 border-border hover:border-primary cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedChild(child);
                        setIsChildDetailsDialogOpen(true);
                      }}
                      onDrop={(e) => handleDrop(e, child)}
                      onDragOver={handleDragOver}
                      data-testid={`child-card-${child.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">😊</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{child.name}</div>
                          <div className="text-xs text-muted-foreground">Age {child.age}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Level {child.level || 1}</span>
                        <span className="font-semibold text-primary">{child.totalPoints} pts</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Chores & Tasks */}
          <Card className="flex flex-col overflow-hidden" data-testid="panel-chores">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-4 h-4" />
                  Chores & Tasks
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => setIsChoreDialogOpen(true)}
                  data-testid="button-add-chore-quick"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {choreTemplates.filter(t => t.category !== 'exercise').length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No chore templates yet</p>
                  </div>
                ) : (
                  choreTemplates.filter(t => t.category !== 'exercise').map(chore => (
                    <div key={chore.id} className="p-2 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{chore.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{chore.name}</div>
                          <div className="text-xs text-muted-foreground">{chore.pointValue} pts</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Suggestions
                </div>
                {suggestionChildId ? (
                  <AutoSuggestions childId={suggestionChildId} kind="task" children={children} />
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    Add a child first
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Learning */}
          <Card className="flex flex-col overflow-hidden" data-testid="panel-learning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-4 h-4" />
                  Learning
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => setIsLearningGoalDialogOpen(true)}
                  data-testid="button-add-learning-quick"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {learningGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No learning goals yet</p>
                  </div>
                ) : (
                  learningGoals.map((goal) => (
                    <div key={goal.id} className="bg-muted/50 p-2 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium truncate flex-1">{goal.subject}</div>
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {goal.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {goal.targetUnits} activities • {goal.pointsPerUnit} pts
                      </div>
                      {(() => {
                        const goalActivities = learningActivities.filter(activity => activity.goalId === goal.id);
                        const hasContent = goalActivities.length > 0;
                        
                        return (
                          <div className="space-y-1">
                            {hasContent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  setIsContentViewDialogOpen(true);
                                }}
                                className="w-full h-7 text-xs"
                                data-testid="button-view-content"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View ({goalActivities.length})
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => generateContent.mutate(goal.id)}
                              disabled={generateContent.isPending}
                              className="w-full h-7 text-xs"
                              data-testid="button-generate-content"
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              {generateContent.isPending ? "Generating..." : hasContent ? "Generate More" : "Generate"}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Suggestions
                </div>
                {suggestionChildId ? (
                  <AutoSuggestions childId={suggestionChildId} kind="learning_goal" children={children} />
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    Add a child first
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column 4: Exercise */}
          <Card className="flex flex-col overflow-hidden" data-testid="panel-exercise">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="w-4 h-4" />
                  Exercise
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => setIsChoreDialogOpen(true)}
                  data-testid="button-add-exercise-quick"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                {choreTemplates.filter(t => t.category === 'exercise').length === 0 ? (
                  <div className="text-center py-8">
                    <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No exercise tasks yet</p>
                  </div>
                ) : (
                  choreTemplates.filter(t => t.category === 'exercise').map(chore => (
                    <div key={chore.id} className="p-2 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{chore.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{chore.name}</div>
                          <div className="text-xs text-muted-foreground">{chore.pointValue} pts</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Suggestions
                </div>
                {suggestionChildId ? (
                  <AutoSuggestions childId={suggestionChildId} kind="exercise" children={children} />
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    Add a child first
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learning Goal Dialog */}
      <Dialog open={isLearningGoalDialogOpen} onOpenChange={setIsLearningGoalDialogOpen}>
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

      {/* Child Details Dialog */}
      <Dialog open={isChildDetailsDialogOpen} onOpenChange={setIsChildDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Child Details</DialogTitle>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">😊</div>
                <div>
                  <div className="text-lg font-semibold">{selectedChild.name}</div>
                  <div className="text-sm text-muted-foreground">Age {selectedChild.age}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="text-xl font-bold text-primary">{selectedChild.level || 1}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Total Points</div>
                  <div className="text-xl font-bold text-primary">{selectedChild.totalPoints}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className="text-xl font-bold text-primary">{selectedChild.experiencePoints || 0} XP</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Badges</div>
                  <div className="text-xl font-bold text-primary">0</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Content View Dialog */}
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

      {/* Approval Dialog */}
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
