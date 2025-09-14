import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChoreTemplateSchema, type ChoreTemplate, type InsertChoreTemplate, type Child } from "@shared/schema";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";

export default function ChoreManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: templates = [], isLoading } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/chore-templates"],
    enabled: !!user,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const form = useForm<InsertChoreTemplate>({
    resolver: zodResolver(insertChoreTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      pointValue: 50,
      icon: "🧹",
      frequency: "daily",
      parentId: "",
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: InsertChoreTemplate) => {
      await apiRequest("POST", "/api/chore-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chore-templates"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Chore Template Created! 🎉",
        description: "Your chore template has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create chore template. Please try again.",
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
    },
    onSuccess: () => {
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

  const onSubmit = (data: InsertChoreTemplate) => {
    createTemplate.mutate(data);
  };

  const handleAssignChore = (templateId: string) => {
    if (children.length === 0) {
      toast({
        title: "No Children",
        description: "Please add a child first before assigning chores.",
        variant: "destructive",
      });
      return;
    }
    
    // For simplicity, assign to first child - in a real app you'd show a selection dialog
    assignChore.mutate({ templateId, childId: children[0].id });
  };

  if (isLoading) {
    return (
      <section className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Manage Chores</h3>
          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Manage Chores</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-secondary text-secondary-foreground"
              data-testid="button-add-chore"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Chore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chore Template</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chore Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Clean Bathroom" 
                          {...field} 
                          data-testid="input-chore-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed instructions..." 
                          {...field}
                          value={field.value || ""} 
                          data-testid="input-chore-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Point Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-chore-points"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (emoji)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="🧹" 
                          {...field} 
                          data-testid="input-chore-icon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chore-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createTemplate.isPending}
                  data-testid="button-save-chore"
                >
                  {createTemplate.isPending ? "Creating..." : "Create Chore Template"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🧹</div>
            <p className="text-muted-foreground mb-4">No chore templates yet</p>
            <p className="text-sm text-muted-foreground">Create your first chore template to get started!</p>
          </div>
        ) : (
          templates.map((template) => (
            <div 
              key={template.id} 
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              data-testid={`card-template-${template.id}`}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg">
                {template.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground" data-testid={`text-template-name-${template.id}`}>
                  {template.name}
                </h4>
                <p className="text-sm text-muted-foreground" data-testid={`text-template-details-${template.id}`}>
                  Worth {template.pointValue} points • {template.frequency}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  data-testid={`button-edit-template-${template.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="bg-primary text-primary-foreground"
                  onClick={() => handleAssignChore(template.id)}
                  disabled={assignChore.isPending || children.length === 0}
                  data-testid={`button-assign-template-${template.id}`}
                >
                  {assignChore.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
