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
import { insertChildSchema, insertChoreTemplateSchema, insertRewardSchema, type Child, type InsertChild, type ChoreTemplate, type InsertChoreTemplate, type Reward, type InsertReward, type AssignedChore } from "@shared/schema";
import { Users, CheckCircle, Star, Gift, Calendar, Plus, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isChoreDialogOpen, setIsChoreDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  
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
    <div className="responsive-container grid h-[calc(100dvh-143px)] grid-rows-[64px_48px_minmax(0,1fr)] gap-2 p-0 overflow-hidden">
      {/* Row 1: Title + KPI Chips (64px) */}
      <div className="h-[64px] flex items-center justify-between border border-border rounded px-2">
        <h2 className="text-xs font-bold text-foreground" data-testid="text-dashboard-title">
          Parent Dashboard
        </h2>
        <div className="flex gap-1">
          <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-center min-w-[50px]">
            <div className="text-xs font-bold text-green-600 leading-none" data-testid="text-completed-today">{completedToday}</div>
            <div className="text-xs text-green-700 leading-none">Today</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-center min-w-[50px]">
            <div className="text-xs font-bold text-blue-600 leading-none" data-testid="text-total-points">{totalPoints}</div>
            <div className="text-xs text-blue-700 leading-none">Points</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1 text-center min-w-[50px]">
            <div className="text-xs font-bold text-orange-600 leading-none" data-testid="text-pending-approvals">{pendingApprovals}</div>
            <div className="text-xs text-orange-700 leading-none">Pending</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded px-2 py-1 text-center min-w-[50px]">
            <div className="text-xs font-bold text-purple-600 leading-none" data-testid="text-week-completed">{thisWeekCompleted}</div>
            <div className="text-xs text-purple-700 leading-none">Week</div>
          </div>
        </div>
      </div>

      {/* Row 2: Primary Action Buttons (48px) */}
      <div className="h-[48px] flex items-center gap-2 border border-border rounded px-2">
        <Dialog open={isChildDialogOpen} onOpenChange={setIsChildDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1" data-testid="button-add-child">
              <Users className="w-3 h-3" />
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
            <Button size="sm" variant="outline" className="flex items-center gap-1" data-testid="button-add-chore">
              <CheckCircle className="w-3 h-3" />
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
          <Button size="sm" variant="outline" className="flex items-center gap-1 bg-orange-50 border-orange-200">
            <Activity className="w-3 h-3" />
            Review Approvals ({pendingApprovals})
          </Button>
        )}
      </div>

      {/* Row 3: Three Micro-Panels (scrollable) */}
      <div className="min-h-0 grid grid-cols-3 gap-2">
        {/* Children Micro-Panel */}
        <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Children ({children.length})</div>
          <div className="space-y-1">
            {childrenLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : children.length === 0 ? (
              <div className="text-xs text-muted-foreground">No children yet</div>
            ) : (
              children.slice(0, 5).map((child) => (
                <div key={child.id} className="flex items-center justify-between text-xs h-6 bg-muted rounded px-2">
                  <div className="flex items-center gap-1">
                    <span>😊</span>
                    <span className="font-medium truncate">{child.name}</span>
                  </div>
                  <span className="text-primary font-semibold">{child.totalPoints}</span>
                </div>
              ))
            )}
            {children.length > 5 && (
              <div className="text-xs text-muted-foreground text-center">+{children.length - 5} more</div>
            )}
          </div>
        </div>

        {/* Activity Micro-Panel */}
        <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Recent Activity</div>
          <div className="space-y-1">
            {pendingApprovals > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-1">
                <div className="text-xs font-medium text-orange-800">{pendingApprovals} pending</div>
              </div>
            )}
            {recentChores.length === 0 ? (
              <div className="text-xs text-muted-foreground">No activity yet</div>
            ) : (
              recentChores.slice(0, 6).map((chore) => (
                <div key={chore.id} className="flex items-center justify-between text-xs h-6 bg-muted rounded px-2">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span>{chore.choreTemplate.icon}</span>
                    <span className="truncate">{chore.choreTemplate.name}</span>
                  </div>
                  <span className="text-muted-foreground">{chore.completedAt ? 'Done' : 'New'}</span>
                </div>
              ))
            )}
            {recentChores.length > 6 && (
              <div className="text-xs text-muted-foreground text-center">+{recentChores.length - 6} more</div>
            )}
          </div>
        </div>

        {/* Catalog Micro-Panel */}
        <div className="min-h-0 overflow-y-auto border border-border rounded p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Catalog</div>
          <div className="space-y-1">
            {/* Chores Mini-Section */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Chores ({choreTemplates.length})</div>
              {choreTemplates.length === 0 ? (
                <div className="text-xs text-muted-foreground">None yet</div>
              ) : (
                choreTemplates.slice(0, 3).map((chore) => (
                  <div key={chore.id} className="flex items-center gap-1 text-xs h-6 bg-muted rounded px-2">
                    <span>{chore.icon}</span>
                    <span className="truncate flex-1">{chore.name}</span>
                    <span className="text-xs">{chore.pointValue}pt</span>
                  </div>
                ))
              )}
              {choreTemplates.length > 3 && (
                <div className="text-xs text-muted-foreground">+{choreTemplates.length - 3} more</div>
              )}
            </div>
            
            {/* Rewards Mini-Section */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">Rewards ({rewards.length})</div>
              {rewards.length === 0 ? (
                <div className="text-xs text-muted-foreground">None yet</div>
              ) : (
                rewards.slice(0, 3).map((reward) => (
                  <div key={reward.id} className="flex items-center gap-1 text-xs h-6 bg-muted rounded px-2">
                    <span>🎁</span>
                    <span className="truncate flex-1">{reward.name}</span>
                    <span className="text-xs">{reward.pointsCost}pt</span>
                  </div>
                ))
              )}
              {rewards.length > 3 && (
                <div className="text-xs text-muted-foreground">+{rewards.length - 3} more</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
