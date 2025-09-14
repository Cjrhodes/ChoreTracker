import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertChildSchema, type Child, type InsertChild } from "@shared/schema";
import { useState } from "react";

export default function ChildOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
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

  const onSubmit = (data: InsertChild) => {
    createChild.mutate(data);
  };

  if (isLoading) {
    return (
      <section className="max-w-md mx-auto px-4 py-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Children Overview</h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
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
    <section className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Children Overview</h3>
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
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👶</div>
          <p className="text-muted-foreground mb-4">No children added yet</p>
          <p className="text-sm text-muted-foreground">Add your first child to get started!</p>
        </div>
      ) : (
        children.map((child) => {
          const progressPercent = 60; // Mock calculation
          
          return (
            <div 
              key={child.id} 
              className="bg-card border border-border rounded-xl p-4 mb-4"
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
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  data-testid={`button-view-details-${child.id}`}
                >
                  View Details
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-primary text-primary-foreground"
                  data-testid={`button-assign-chore-${child.id}`}
                >
                  Assign Chore
                </Button>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
