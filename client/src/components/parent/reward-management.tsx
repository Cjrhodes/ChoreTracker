import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  type Reward,
  type InsertReward,
  insertRewardSchema,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ExternalLink, Gift, DollarSign, Star, Trash2 } from "lucide-react";

export default function RewardManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const form = useForm<InsertReward>({
    resolver: zodResolver(insertRewardSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 100,
      imageUrl: "",
      itemUrl: "",
      category: "item",
      parentId: "",
    },
  });

  const createReward = useMutation({
    mutationFn: async (data: InsertReward) => {
      await apiRequest("POST", "/api/rewards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Reward Created! 🎁",
        description: "Your reward has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("DELETE", `/api/rewards/${rewardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: "Reward Deleted! 🗑️",
        description: "The reward has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertReward) => {
    createReward.mutate(data);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cash":
        return <DollarSign className="w-4 h-4" />;
      case "experience":
        return <Star className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cash":
        return "bg-green-500";
      case "experience":
        return "bg-purple-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <section className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="text-2xl">🎁</span> Reward Management
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-reward">
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
              <DialogDescription>
                Add a new reward that your children can work toward.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="New toy, video game, etc." 
                          {...field} 
                          data-testid="input-reward-name"
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the reward..." 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-reward-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-reward-points"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-reward-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="item">Item</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Link (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://amazon.com/product-link" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-reward-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field}
                          value={field.value || ""}
                          data-testid="input-reward-image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-reward"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReward.isPending}
                    className="flex-1"
                    data-testid="button-submit-reward"
                  >
                    {createReward.isPending ? "Creating..." : "Create Reward"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No rewards created yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first reward to motivate your children!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-card border border-border rounded-xl p-4"
              data-testid={`card-reward-${reward.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${getCategoryColor(reward.category)} rounded-lg flex items-center justify-center text-white`}>
                  {getCategoryIcon(reward.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground" data-testid={`text-reward-name-${reward.id}`}>
                      {reward.name}
                    </h4>
                    {reward.itemUrl && /^https?:\/\/.+/i.test(reward.itemUrl) && (
                      <a
                        href={reward.itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        data-testid={`link-reward-url-${reward.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`text-reward-cost-${reward.id}`}>
                    {reward.pointsCost} points • {reward.category}
                  </p>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-reward-description-${reward.id}`}>
                      {reward.description}
                    </p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`button-delete-reward-${reward.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Reward</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{reward.name}"? This action cannot be undone.
                        Any children currently working toward this reward will have their goals reset.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`button-cancel-delete-${reward.id}`}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteReward.mutate(reward.id)}
                        disabled={deleteReward.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid={`button-confirm-delete-${reward.id}`}
                      >
                        {deleteReward.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}