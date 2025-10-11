import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChildSchema, type Child, type InsertChild, type ChoreTemplate, type AssignedChore, type User } from "@shared/schema";
import { Trash2 } from "lucide-react";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };
import { useState } from "react";

export default function ChildOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const { data: choreTemplates = [] } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/chore-templates"],
    enabled: !!user,
  });

  const { data: selectedChildChores = [] } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/children", selectedChild?.id, "chores"],
    enabled: !!selectedChild,
  });

  const form = useForm<InsertChild>({
    resolver: zodResolver(insertChildSchema),
    defaultValues: {
      name: "",
      age: 8,
      parentId: "",
    },
  });

  const createChild = useMutation({
    mutationFn: async (data: InsertChild) => {
      await apiRequest("POST", "/api/children", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Child Added! 🎉",
        description: "Your child has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add child. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignChore = useMutation({
    mutationFn: async ({ templateId, childId }: { templateId: string; childId: string }) => {
      await apiRequest("POST", "/api/assigned-chores", {
        childId,
        choreTemplateId: templateId,
        assignedDate: new Date().toISOString().split('T')[0],
      });
      return childId;
    },
    onSuccess: (childId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "chores"] });
      setIsAssignDialogOpen(false);
      toast({
        title: "Chore Assigned! 📋",
        description: "The chore has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign chore. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteChild = useMutation({
    mutationFn: async (childId: string) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
      return childId;
    },
    onSuccess: (childId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", (user as User)?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "chores"] });
      setIsDetailsDialogOpen(false);
      setSelectedChild(null);
      toast({
        title: "Child Removed! 👋",
        description: "The child has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove child. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAssignedChore = useMutation({
    mutationFn: async (choreId: string) => {
      await apiRequest("DELETE", `/api/assigned-chores/${choreId}`);
      return { choreId, childId: selectedChild?.id };
    },
    onSuccess: (data) => {
      if (data.childId) {
        queryClient.invalidateQueries({ queryKey: ["/api/children", data.childId, "chores"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/stats", (user as User)?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Chore Removed! 🗑️",
        description: "The assigned chore has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove chore. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertChild) => {
    createChild.mutate(data);
  };

  if (isLoading) {
    return (
      <section className="w-full">
        <h3 className="text-lg font-semibold text-foreground mb-4 md:text-xl lg:text-2xl">Children Overview</h3>
        <div className="responsive-grid">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border mobile-card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-full md:w-12 md:h-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-4 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg font-semibold text-foreground md:text-xl lg:text-2xl scroll-margin-header">Children Overview</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground"
              data-testid="button-add-child"
            >
              + Add Child
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter child's name" 
                          {...field} 
                          data-testid="input-child-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="3" 
                          max="18" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-child-age"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createChild.isPending}
                  data-testid="button-save-child"
                >
                  {createChild.isPending ? "Adding..." : "Add Child"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {children.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="text-4xl mb-4 md:text-5xl">👶</div>
          <p className="text-muted-foreground mb-4 md:text-lg">No children added yet</p>
          <p className="text-sm text-muted-foreground md:text-base">Add your first child to get started!</p>
        </div>
      ) : (
        <div className="responsive-grid">
          {children.map((child) => {
            const progressPercent = 60; // Mock calculation
            
            return (
              <div 
                key={child.id} 
                className="bg-card border border-border mobile-card"
                data-testid={`card-child-${child.id}`}
              >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground" data-testid={`text-child-name-${child.id}`}>
                    {child.name} ({child.age})
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-child-status-${child.id}`}>
                    3 of 5 chores completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary" data-testid={`text-child-points-${child.id}`}>
                    {child.totalPoints} pts
                  </div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
              </div>
              
              <div className="bg-muted rounded-full p-1 mb-3">
                <div 
                  className="bg-primary rounded-full h-2 transition-all" 
                  style={{ width: `${progressPercent}%` }}
                  data-testid={`progress-child-${child.id}`}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  variant="outline" 
                  className="w-full text-[10px] px-1 py-1 h-8 min-w-0 overflow-hidden"
                  onClick={() => {
                    setSelectedChild(child);
                    setIsDetailsDialogOpen(true);
                  }}
                  data-testid={`button-view-details-${child.id}`}
                >
                  <span className="truncate">Details</span>
                </Button>
                <Button 
                  className="w-full bg-primary text-primary-foreground text-[10px] px-1 py-1 h-8 min-w-0 overflow-hidden"
                  onClick={() => {
                    setSelectedChild(child);
                    setIsAssignDialogOpen(true);
                  }}
                  data-testid={`button-assign-chore-${child.id}`}
                >
                  <span className="truncate">Assign</span>
                </Button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Assign Chore Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Chore to {selectedChild?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {choreTemplates.length === 0 ? (
              <p className="text-muted-foreground">No chore templates available. Create some first!</p>
            ) : (
              choreTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">Worth {template.pointValue} points</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => selectedChild && assignChore.mutate({ templateId: template.id, childId: selectedChild.id })}
                    disabled={assignChore.isPending}
                    data-testid={`button-assign-template-${template.id}`}
                  >
                    {assignChore.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedChild?.name}'s Details</DialogTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-child-${selectedChild?.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Child?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{selectedChild?.name}" and all their data including chores, points, and achievements. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedChild && deleteChild.mutate(selectedChild.id)}
                      disabled={deleteChild.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-delete-child"
                    >
                      {deleteChild.isPending ? "Removing..." : "Remove Child"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Age:</span>
                  <span>{selectedChild?.age} years old</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-bold text-primary">{selectedChild?.totalPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Chores:</span>
                  <span>{selectedChildChores.filter(c => !c.completedAt).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed This Week:</span>
                  <span>{selectedChildChores.filter(c => c.completedAt).length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Current Chores</h4>
              {selectedChildChores.length === 0 ? (
                <p className="text-muted-foreground text-sm">No chores assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedChildChores.slice(0, 3).map((chore) => (
                    <div key={chore.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{chore.choreTemplate.icon}</span>
                        <span>{chore.choreTemplate.name}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          chore.completedAt 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {chore.completedAt ? 'Done' : 'Pending'}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive h-6 w-6"
                              disabled={deleteAssignedChore.isPending}
                              data-testid={`button-delete-assigned-chore-${chore.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Assigned Chore?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{chore.choreTemplate.name}" from {selectedChild?.name}'s assigned chores. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAssignedChore.mutate(chore.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Chore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {selectedChildChores.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{selectedChildChores.length - 3} more chores
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
