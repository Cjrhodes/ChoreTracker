import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Child } from "@shared/schema";

export default function ChildHeader() {
  const { user } = useAuth();
  
  // For demo purposes, get the first child - in a real app you'd have child selection
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  if (!child) {
    return (
      <section className="gradient-bg text-white">
        <div className="responsive-container responsive-section">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
              😊
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome! 👋</h2>
            <p className="text-white/90">Ask your parent to add you first!</p>
          </div>
        </div>
      </section>
    );
  }

  // Calculate progress to current goal (mock calculation for now)
  const progressPercent = 65;
  const pointsToGoal = 350;

  return (
    <section className="gradient-bg text-white">
      <div className="responsive-container responsive-section">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
            😊
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-child-name">
            Hey {child.name}! 👋
          </h2>
          <p className="text-white/90">Ready to earn some points today?</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold mb-2" data-testid="text-total-points">
            {child.totalPoints}
          </div>
          <div className="text-white/90 mb-4">Total Points Earned! ⭐</div>
          
          <div className="bg-white/10 rounded-full p-1 mb-3">
            <div className="bg-white/30 rounded-full h-3 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-secondary to-accent h-full rounded-full progress-animation" 
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-reward"
              ></div>
            </div>
          </div>
          <div className="text-sm text-white/80" data-testid="text-points-to-goal">
            {pointsToGoal} more points until Nintendo Switch! 🎮
          </div>
        </div>
      </div>
    </section>
  );
}
