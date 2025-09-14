import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Child, EarnedBadge } from "@shared/schema";

export default function AchievementDisplay() {
  const { user } = useAuth();
  
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  const { data: badges = [], isLoading } = useQuery<EarnedBadge[]>({
    queryKey: ["/api/children", child?.id, "badges"],
    enabled: !!child,
  });

  if (!child) {
    return null;
  }

  // Create badge slots - show earned badges and empty slots
  const maxBadges = 6;
  const badgeSlots = Array.from({ length: maxBadges }, (_, index) => {
    const earnedBadge = badges[index];
    return earnedBadge ? {
      earned: true,
      icon: earnedBadge.badgeIcon,
      name: earnedBadge.badgeName,
    } : {
      earned: false,
      icon: "🎯",
      name: "Coming Soon",
    };
  });

  if (isLoading) {
    return (
      <section className="max-w-md mx-auto px-4 py-6">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">🏅</span> Your Badges
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center animate-pulse">
              <div className="w-8 h-8 bg-muted rounded mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-6">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-2xl">🏅</span> Your Badges
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {badgeSlots.map((badge, index) => (
          <div
            key={index}
            className={`rounded-2xl p-4 text-center transition-all ${
              badge.earned
                ? "bg-card border border-border badge-glow"
                : "bg-gray-100 border border-gray-200"
            }`}
            data-testid={`badge-slot-${index}`}
          >
            <div
              className={`text-3xl mb-2 ${!badge.earned ? "opacity-30" : ""}`}
              data-testid={`badge-icon-${index}`}
            >
              {badge.icon}
            </div>
            <div
              className={`text-xs font-medium ${
                badge.earned ? "text-foreground" : "text-gray-400"
              }`}
              data-testid={`badge-name-${index}`}
            >
              {badge.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
