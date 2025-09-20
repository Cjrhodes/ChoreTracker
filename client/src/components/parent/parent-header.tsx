import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import type { Child } from "@shared/schema";

export default function ParentHeader() {
  const { user } = useAuth();
  
  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  // Calculate stats
  const totalPoints = children.reduce((sum, child) => sum + child.totalPoints, 0);
  const completedToday = 3; // This would come from a real query

  return (
    <section className="bg-card border-b border-border">
      <div className="responsive-container responsive-section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
              Parent Dashboard
            </h2>
            <p className="text-muted-foreground">Manage chores and track progress</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            data-testid="button-settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-today">
              {completedToday}
            </div>
            <div className="text-sm text-green-700">Completed Today</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600" data-testid="text-total-points">
              {totalPoints}
            </div>
            <div className="text-sm text-blue-700">Total Points</div>
          </div>
        </div>
      </div>
    </section>
  );
}
