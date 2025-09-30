import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import InterfaceToggle from "@/components/interface-toggle";
import ChildDashboard from "@/pages/child-dashboard-new";
import ParentDashboard from "@/pages/parent-dashboard";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [activeInterface, setActiveInterface] = useState<"child" | "parent">("child");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <InterfaceToggle
        activeInterface={activeInterface}
        onToggle={setActiveInterface}
      />
      
      <main className="sticky-header-space">
        {activeInterface === "child" ? (
          <ChildDashboard key="child-dashboard" />
        ) : (
          <ParentDashboard key="parent-dashboard" />
        )}
      </main>
    </div>
  );
}
