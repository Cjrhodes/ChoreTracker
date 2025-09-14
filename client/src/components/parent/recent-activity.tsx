import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, Star } from "lucide-react";
import type { User } from "@shared/schema";

interface ActivityItem {
  type: string;
  childName: string;
  choreName: string;
  points: number;
  completedAt: string;
  approvedAt: string | null;
  choreId: string;
}

export default function RecentActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: activity = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/stats", (user as User)?.id],
    enabled: !!user,
  });

  const approveChore = useMutation({
    mutationFn: async ({ choreId, points }: { choreId: string; points: number }) => {
      await apiRequest("PATCH", `/api/assigned-chores/${choreId}/approve`, {
        pointsAwarded: points,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats", (user as User)?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Chore Approved! 🎉",
        description: "Points have been awarded to your child.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve chore. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <section className="max-w-md mx-auto px-4 py-6 pb-20">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <section className="max-w-md mx-auto px-4 py-6 pb-20">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {activity.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activity.map((item, index) => {
            const isApproved = !!item.approvedAt;
            
            return (
              <div 
                key={`${item.choreId}-${index}`} 
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                data-testid={`card-activity-${index}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isApproved ? "bg-green-100" : "bg-yellow-100"
                }`}>
                  {isApproved ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground" data-testid={`text-activity-${index}`}>
                    <span className="font-medium">{item.childName}</span> completed{" "}
                    <span className="font-medium">{item.choreName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-activity-time-${index}`}>
                    {formatTimeAgo(item.completedAt)} • +{item.points} points
                  </p>
                </div>
                {!isApproved && (
                  <Button
                    size="sm"
                    className="text-primary hover:opacity-70 transition-opacity"
                    variant="ghost"
                    onClick={() => approveChore.mutate({ choreId: item.choreId, points: item.points })}
                    disabled={approveChore.isPending}
                    data-testid={`button-approve-${index}`}
                  >
                    {approveChore.isPending ? "..." : "Approve"}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
