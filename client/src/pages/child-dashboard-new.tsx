import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Image as ImageIcon, Trophy, Clock, CheckCheck } from "lucide-react";
import type { Child, AssignedChore, ChoreTemplate } from "@shared/schema";
import { UniversalChatWidget } from "@/components/ui/universal-chat-widget";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

type ViewSection = 'available' | 'in-progress' | 'completed';

export default function ChildDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ViewSection>('available');
  const [selectedTaskImage, setSelectedTaskImage] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: !!user,
  });

  const child = children?.[0];
  
  const { data: chores = [] } = useQuery<ChoreWithTemplate[]>({
    queryKey: ["/api/children", child?.id, "chores"],
    enabled: !!child,
  });

  const { data: availableTasks = [] } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/children", child?.id, "available-tasks"],
    enabled: !!child,
  });

  // Filter chores by status
  const inProgressChores = chores.filter(c => !c.completedAt && !c.approvedAt);
  const completedChores = chores.filter(c => c.completedAt);

  // Self-assign task mutation
  const selfAssignMutation = useMutation({
    mutationFn: async (choreTemplateId: string) => {
      return apiRequest('POST', `/api/children/${child?.id}/self-assign`, {
        choreTemplateId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', child?.id, 'chores'] });
      toast({
        title: "Task Added! 🎯",
        description: "Get started and earn those points!",
      });
    },
  });

  // Complete chore with image mutation
  const completeChoreMutation = useMutation({
    mutationFn: async ({ choreId, imageUrl }: { choreId: string; imageUrl?: string }) => {
      return apiRequest('PATCH', `/api/assigned-chores/${choreId}/complete`, {
        completionImageUrl: imageUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', child?.id, 'chores'] });
      setSelectedTaskImage(null);
      setSelectedTaskId(null);
      toast({
        title: "Task Completed! 🎉",
        description: "Great job! Waiting for parent approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedTaskImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteTask = (choreId: string, requiresImage: boolean) => {
    if (requiresImage && !selectedTaskImage) {
      toast({
        title: "Image Required 📸",
        description: "Please upload a photo to complete this task",
        variant: "destructive",
      });
      return;
    }

    completeChoreMutation.mutate({ choreId, imageUrl: selectedTaskImage || undefined });
  };

  if (!child) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-72px)]">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">{child.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-semibold">{child.totalPoints} pts</span>
            <span className="text-sm text-muted-foreground">• Level {child.level}</span>
          </div>
        </div>

        <nav className="flex-1 p-2">
          <Button
            variant={activeSection === 'available' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveSection('available')}
            data-testid="button-nav-available"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Available ({availableTasks.length})
          </Button>
          
          <Button
            variant={activeSection === 'in-progress' ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => setActiveSection('in-progress')}
            data-testid="button-nav-in-progress"
          >
            <Clock className="mr-2 h-4 w-4" />
            In Progress ({inProgressChores.length})
          </Button>
          
          <Button
            variant={activeSection === 'completed' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveSection('completed')}
            data-testid="button-nav-completed"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Completed ({completedChores.length})
          </Button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'available' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Tasks</h2>
            <p className="text-muted-foreground mb-6">Choose tasks to work on and earn points!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTasks.map((task) => (
                <Card key={task.id} data-testid={`task-available-${task.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{task.icon}</span>
                      <span className="text-base">{task.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{task.pointValue} pts</span>
                      {task.requiresImage && (
                        <span title="Photo required">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => selfAssignMutation.mutate(task.id)}
                      disabled={selfAssignMutation.isPending}
                      data-testid={`button-start-task-${task.id}`}
                    >
                      Start Task
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {availableTasks.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No available tasks right now. Check back later!
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'in-progress' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">In Progress</h2>
            <p className="text-muted-foreground mb-6">Complete these tasks to earn points!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressChores.map((chore) => (
                <Card key={chore.id} data-testid={`task-in-progress-${chore.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{chore.choreTemplate.icon}</span>
                      <span className="text-base">{chore.choreTemplate.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {chore.choreTemplate.description}
                    </p>
                    
                    {chore.requiresImage && (
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <Label className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4" />
                          Photo Required for Completion
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleImageUpload(e);
                            setSelectedTaskId(chore.id);
                          }}
                          data-testid={`input-task-image-${chore.id}`}
                        />
                        {selectedTaskId === chore.id && selectedTaskImage && (
                          <img
                            src={selectedTaskImage}
                            alt="Task completion"
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {chore.choreTemplate.pointValue} pts
                      </span>
                      <Button
                        onClick={() => handleCompleteTask(chore.id, chore.requiresImage)}
                        disabled={completeChoreMutation.isPending}
                        data-testid={`button-complete-task-${chore.id}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {inProgressChores.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No tasks in progress. Start a task from Available!
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'completed' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Tasks</h2>
            <p className="text-muted-foreground mb-6">Great work! These are your completed tasks.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedChores.map((chore) => (
                <Card key={chore.id} className="opacity-75" data-testid={`task-completed-${chore.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{chore.choreTemplate.icon}</span>
                      <span className="text-base">{chore.choreTemplate.name}</span>
                      <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chore.completionImageUrl && (
                      <img
                        src={chore.completionImageUrl}
                        alt="Completed task"
                        className="w-full h-32 object-cover rounded mb-3"
                        data-testid={`img-completed-task-${chore.id}`}
                      />
                    )}
                    <p className="text-sm text-muted-foreground mb-2">
                      {chore.choreTemplate.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className={chore.approvedAt ? "text-green-600 font-semibold" : "text-yellow-600"}>
                        {chore.approvedAt ? `✓ Approved: +${chore.pointsAwarded} pts` : "⏳ Pending Approval"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {completedChores.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No completed tasks yet. Get started!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Universal Chat Widget */}
      {child && (
        <UniversalChatWidget partyType="child" partyId={child.id} userName={child.name} />
      )}
    </div>
  );
}
