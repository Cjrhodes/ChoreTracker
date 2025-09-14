import { Button } from "@/components/ui/button";

interface InterfaceToggleProps {
  activeInterface: "child" | "parent";
  onToggle: (interfaceType: "child" | "parent") => void;
}

export default function InterfaceToggle({ activeInterface, onToggle }: InterfaceToggleProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary" data-testid="text-app-title">
            ChoreChamps
          </h1>
          <div className="flex bg-muted rounded-full p-1">
            <Button
              variant="ghost"
              size="sm"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeInterface === "child"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onToggle("child")}
              data-testid="button-child-mode"
            >
              👶 Kid Mode
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeInterface === "parent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onToggle("parent")}
              data-testid="button-parent-mode"
            >
              👨‍👩‍👧‍👦 Parent
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
