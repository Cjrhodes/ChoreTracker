import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
              🏆
            </div>
            
            <h1 className="text-3xl font-bold mb-3" style={{ color: '#CCDC38' }}>
              Welcome to Chore Buster!
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Turn household chores into fun adventures! Kids earn points and badges while parents stay organized.
            </p>
            
            <div className="space-y-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                Get Started
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Perfect for families with children aged 8-15
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
