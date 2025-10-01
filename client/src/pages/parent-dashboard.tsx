import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChildSchema, insertChoreTemplateSchema, insertRewardSchema, insertLearningGoalSchema, type Child, type InsertChild, type ChoreTemplate, type InsertChoreTemplate, type Reward, type InsertReward, type AssignedChore, type LearningGoal, type InsertLearningGoal } from "@shared/schema";
import { Users, CheckCircle, Star, Gift, Calendar, Plus, Activity, TrendingUp, GraduationCap, Brain, BookOpen, Eye, Sparkles, Dumbbell, GripVertical, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
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
  const [approvalFilterChildId, setApprovalFilterChildId] = useState<string | null>(null);
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

  // Get all assigned chores for all children to properly check attention items
  const { data: allChildrenChores = [] } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/parent-children-chores"],
    enabled: !!user && children.length > 0,
  });

  const childForm = useForm<InsertChild>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: { name: "", age: 8, parentId: "" },
  });

  const choreForm = useForm<InsertChoreTemplate>({
    resolver: zodResolver(insertChoreTemplateSchema),
    defaultValues: { name: "", description: "", pointValue: 10, icon: "🧹", category: "household", frequency: "daily", requiresImage: false, parentId: "" },
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
      queryClient.invalidateQueries({ queryKey: ["/api/parent-children-chores"] });
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

  const assignItemMutation = useMutation({
    mutationFn: async ({ type, id, childId }: { type: string; id: string; childId: string }) => {
      if (type === 'chore_template' || type === 'exercise') {
        return apiRequest('POST', '/api/assigned-chores', {
          childId,
          choreTemplateId: id,
          assignedDate: new Date().toISOString().split('T')[0]
        });
      } else if (type === 'learning_goal') {
        return apiRequest('POST', `/api/learning/goals/${id}/assign`, { childId });
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate parent-level queries
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-chores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-chores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parent-children-chores'] });
      
      // Invalidate child-specific queries
      queryClient.invalidateQueries({ queryKey: ['/api/children', variables.childId] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-goals/child', variables.childId] });
      
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
        const parsed = JSON.parse(data);
        if (parsed.suggestionId) {
          assignSuggestionMutation.mutate({ suggestionId: parsed.suggestionId, childId: child.id });
        } else if (parsed.type && parsed.id) {
          assignItemMutation.mutate({ type: parsed.type, id: parsed.id, childId: child.id });
        }
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
                    <FormField
                      control={choreForm.control}
                      name="requiresImage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-requires-image"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Require Photo Proof 📸
                            </FormLabel>
                            <FormDescription>
                              Child must upload a photo to complete this task
                            </FormDescription>
                          </div>
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
            
            <Link href="/settings">
              <Button 
                size="default" 
                variant="outline" 
                className="flex items-center gap-2"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Attention Summary & Points System */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attention Summary */}
          <Card data-testid="card-attention-summary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Items Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {children.length === 0 && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>No children added yet - add a child to get started</span>
                </div>
              )}
              {children.map(child => {
                const childChores = allChildrenChores.filter(c => c.childId === child.id);
                const hasNoAssignments = childChores.length === 0;
                const pendingApproval = childChores.filter(c => c.completedAt && !c.approvedAt).length;
                
                if (!hasNoAssignments && pendingApproval === 0) return null;
                
                return (
                  <div key={child.id} className="text-sm bg-orange-50 p-2 rounded hover:bg-orange-100 transition-colors cursor-pointer" onClick={() => {
                    if (pendingApproval > 0) {
                      setApprovalFilterChildId(child.id);
                      setIsApprovalDialogOpen(true);
                    } else {
                      setSelectedChild(child);
                      setIsChildDetailsDialogOpen(true);
                    }
                  }} data-testid={`attention-item-${child.id}`}>
                    <span className="font-medium">{child.name}</span>
                    {hasNoAssignments && (
                      <div className="text-orange-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Has zero task assignments - Click to view profile
                      </div>
                    )}
                    {pendingApproval > 0 && (
                      <div className="text-orange-600 flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3" />
                        {pendingApproval} completed {pendingApproval === 1 ? 'task' : 'tasks'} waiting for approval - Click to review
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)}
              {children.length > 0 && children.every(child => {
                const childChores = allChildrenChores.filter(c => c.childId === child.id);
                const hasAssignments = childChores.length > 0;
                const pendingApproval = childChores.filter(c => c.completedAt && !c.approvedAt).length;
                return hasAssignments && pendingApproval === 0;
              }) && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>All caught up! Everything looks good.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points System Explanation */}
          <Card data-testid="card-points-system">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Points Value System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Points help children understand the value of their effort and track progress toward rewards.</p>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-[60px]">5-10 pts</span>
                  <span className="text-muted-foreground">Quick tasks (5-10 minutes)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-[60px]">15-25 pts</span>
                  <span className="text-muted-foreground">Standard chores (15-30 minutes)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-[60px]">30-50 pts</span>
                  <span className="text-muted-foreground">Major tasks or projects (30+ minutes)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary min-w-[60px]">10-20 pts</span>
                  <span className="text-muted-foreground">Learning activities per unit</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Tip: Set rewards at 100-500 points to encourage saving and goal-setting.</p>
            </CardContent>
          </Card>
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
                    <div 
                      key={chore.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'chore_template',
                          id: chore.id,
                          name: chore.name
                        }));
                      }}
                      className="p-2 bg-muted/50 rounded-lg border border-border cursor-move hover:shadow-md transition-shadow"
                      data-testid={`chore-template-${chore.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
                    <div 
                      key={goal.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'learning_goal',
                          id: goal.id,
                          subject: goal.subject
                        }));
                      }}
                      className="bg-muted/50 p-2 rounded-lg border border-border cursor-move hover:shadow-md transition-shadow"
                      data-testid={`learning-goal-${goal.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center justify-between flex-1">
                          <div className="text-sm font-medium truncate flex-1">{goal.subject}</div>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {goal.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 ml-6">
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
                    <div 
                      key={chore.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'exercise',
                          id: chore.id,
                          name: chore.name
                        }));
                      }}
                      className="p-2 bg-muted/50 rounded-lg border border-border cursor-move hover:shadow-md transition-shadow"
                      data-testid={`exercise-${chore.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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

      {/* Enhanced Child Details Dialog */}
      <Dialog open={isChildDetailsDialogOpen} onOpenChange={setIsChildDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedChild?.name}'s Profile
            </DialogTitle>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-6">
              {/* Basic Info & Stats */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">😊</div>
                <div className="flex-1">
                  <div className="text-xl font-bold">{selectedChild.name}</div>
                  <div className="text-sm text-muted-foreground">Age {selectedChild.age} • Level {selectedChild.level || 1}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/5 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{selectedChild.totalPoints}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedChild.experiencePoints || 0}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </div>

              {/* Current Status Summary */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Current Status
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const childChores = allChildrenChores.filter(c => c.childId === selectedChild.id);
                    const inProgress = childChores.filter(c => !c.completedAt).length;
                    const completed = childChores.filter(c => c.completedAt && !c.approvedAt).length;
                    const approved = childChores.filter(c => c.approvedAt).length;

                    return (
                      <>
                        <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded">
                          <span className="text-muted-foreground">Tasks in Progress</span>
                          <span className="font-bold text-blue-600">{inProgress}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-orange-50 p-2 rounded">
                          <span className="text-muted-foreground">Awaiting Approval</span>
                          <span className="font-bold text-orange-600">{completed}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                          <span className="text-muted-foreground">Approved Today</span>
                          <span className="font-bold text-green-600">{approved}</span>
                        </div>
                        {childChores.length === 0 && (
                          <div className="text-sm text-muted-foreground italic p-2 bg-muted/30 rounded">
                            No tasks assigned yet
                          </div>
                        )}
                        {(() => {
                          const completedPending = childChores.filter(c => c.completedAt && !c.approvedAt).length;
                          if (completedPending > 0) {
                            return (
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => {
                                  setApprovalFilterChildId(selectedChild.id);
                                  setIsApprovalDialogOpen(true);
                                }}
                                data-testid="button-review-child-approvals"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Review {completedPending} Pending {completedPending === 1 ? 'Approval' : 'Approvals'}
                              </Button>
                            );
                          }
                        })()}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Settings Section */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings & Preferences
                </h3>
                <div className="space-y-4">
                  {/* Goals */}
                  <div>
                    <Label htmlFor="child-goals" className="text-sm font-medium">Personal Goals</Label>
                    <Textarea
                      id="child-goals"
                      placeholder="What does this child want to achieve? (e.g., save for a bike, learn guitar)"
                      defaultValue={selectedChild.goals || ""}
                      className="mt-1"
                      rows={2}
                      data-testid="input-child-goals"
                      onBlur={(e) => {
                        if (e.target.value !== selectedChild.goals) {
                          apiRequest('PATCH', `/api/children/${selectedChild.id}/settings`, {
                            goals: e.target.value
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                            toast({ title: "Goals Updated", description: "Child's goals have been saved." });
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will use these goals to personalize task suggestions
                    </p>
                  </div>

                  {/* Interests */}
                  <div>
                    <Label htmlFor="child-interests" className="text-sm font-medium">Interests & Hobbies</Label>
                    <Textarea
                      id="child-interests"
                      placeholder="What does this child enjoy? (e.g., sports, art, video games, cooking)"
                      defaultValue={selectedChild.interests || ""}
                      className="mt-1"
                      rows={2}
                      data-testid="input-child-interests"
                      onBlur={(e) => {
                        if (e.target.value !== selectedChild.interests) {
                          apiRequest('PATCH', `/api/children/${selectedChild.id}/settings`, {
                            interests: e.target.value
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                            toast({ title: "Interests Updated", description: "Child's interests have been saved." });
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will create more engaging activities based on their interests
                    </p>
                  </div>

                  {/* Reminder Settings */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Task Reminders</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedChild.reminderEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        apiRequest('PATCH', `/api/children/${selectedChild.id}/settings`, {
                          reminderEnabled: !selectedChild.reminderEnabled
                        }).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/children'] });
                          toast({
                            title: selectedChild.reminderEnabled ? "Reminders Disabled" : "Reminders Enabled",
                            description: `Task reminders have been ${selectedChild.reminderEnabled ? 'turned off' : 'turned on'}.`
                          });
                        });
                      }}
                      data-testid="button-toggle-reminders"
                    >
                      {selectedChild.reminderEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
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
      <Dialog open={isApprovalDialogOpen} onOpenChange={(open) => {
        setIsApprovalDialogOpen(open);
        if (!open) setApprovalFilterChildId(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {approvalFilterChildId 
                ? `Review ${children.find(c => c.id === approvalFilterChildId)?.name}'s Completed Tasks`
                : 'Review Completed Chores'
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {recentChores
              .filter(chore => chore.completedAt && !chore.approvedAt)
              .filter(chore => !approvalFilterChildId || chore.childId === approvalFilterChildId)
              .map((chore) => (
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
