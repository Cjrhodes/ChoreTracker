import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Child, AssignedChore, ChoreTemplate } from "@shared/schema";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

export default function ChoreList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  const { data: chores = [], isLoading } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/children", child?.id, "chores"],
    enabled: !!child,
  });

  const completeChore = useMutation({
    mutationFn: async (choreId: string) => {
      await apiRequest("PATCH", `/api/assigned-chores/${choreId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", child?.id, "chores"] });
      toast({
        title: "Great job! 🎉",
        description: "Chore completed! Waiting for parent approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete chore. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!child) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="max-w-md mx-auto px-4 py-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span> Today's Quests
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-muted rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const todayChores = chores.filter(chore => {
    const choreDate = new Date(chore.assignedDate);
    const today = new Date();
    return choreDate.toDateString() === today.toDateString();
  });

  return (
    <section className="max-w-md mx-auto px-4 py-6">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-2xl">📋</span> Today's Quests
      </h3>
      
      <div className="space-y-3">
        {todayChores.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-muted-foreground">No chores for today! Great job!</p>
          </div>
        ) : (
          todayChores.map((chore) => {
            const isCompleted = !!chore.completedAt;
            const isApproved = !!chore.approvedAt;
            
            return (
              <div
                key={chore.id}
                className={`chore-card rounded-2xl p-4 relative transition-all ${
                  isApproved
                    ? "bg-green-50 border-2 border-green-200"
                    : isCompleted
                    ? "bg-yellow-50 border-2 border-yellow-200"
                    : "bg-card border border-border hover:shadow-lg"
                }`}
                data-testid={`card-chore-${chore.id}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${
                      isApproved
                        ? "bg-green-500"
                        : isCompleted
                        ? "bg-yellow-500"
                        : "bg-primary"
                    }`}
                  >
                    {isApproved ? "✓" : isCompleted ? "⏳" : chore.choreTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        isApproved ? "text-green-800" : isCompleted ? "text-yellow-800" : "text-foreground"
                      }`}
                      data-testid={`text-chore-name-${chore.id}`}
                    >
                      {chore.choreTemplate.name}
                    </h4>
                    <p
                      className={`text-sm ${
                        isApproved
                          ? "text-green-600"
                          : isCompleted
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                      }`}
                      data-testid={`text-chore-status-${chore.id}`}
                    >
                      {isApproved
                        ? `Great job! +${chore.pointsAwarded} points`
                        : isCompleted
                        ? "Waiting for approval..."
                        : `Worth ${chore.choreTemplate.pointValue} points`}
                    </p>
                  </div>
                  {isApproved ? (
                    <div className="text-2xl">🏆</div>
                  ) : isCompleted ? (
                    <div className="text-2xl">⏳</div>
                  ) : (
                    <Button
                      className="bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
                      onClick={() => completeChore.mutate(chore.id)}
                      disabled={completeChore.isPending}
                      data-testid={`button-start-chore-${chore.id}`}
                    >
                      {completeChore.isPending ? "Starting..." : "Start! 🚀"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
