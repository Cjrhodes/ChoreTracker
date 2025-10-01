import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Image as ImageIcon, Trophy, Clock, CheckCheck, Plus } from "lucide-react";
import type { Child, AssignedChore, ChoreTemplate } from "@shared/schema";
import { UniversalChatWidget } from "@/components/ui/universal-chat-widget";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ChoreWithTemplate = AssignedChore & { choreTemplate: ChoreTemplate };

export default function ChildDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedTaskForImage, setSelectedTaskForImage] = useState<ChoreWithTemplate | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/children', child?.id, 'available-tasks'] });
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
      setUploadedImage(null);
      setImageDialogOpen(false);
      setSelectedTaskForImage(null);
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (e: React.DragEvent, item: any, type: 'available' | 'in-progress') => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      item, 
      sourceType: type 
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetType: 'available' | 'in-progress' | 'completed') => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { item, sourceType } = JSON.parse(data);

      // Available -> In Progress (self-assign)
      if (sourceType === 'available' && targetType === 'in-progress') {
        selfAssignMutation.mutate(item.id);
      }
      
      // In Progress -> Completed
      if (sourceType === 'in-progress' && targetType === 'completed') {
        const chore = item as ChoreWithTemplate;
        
        // Check if image is required
        if (chore.requiresImage) {
          setSelectedTaskForImage(chore);
          setImageDialogOpen(true);
        } else {
          completeChoreMutation.mutate({ choreId: chore.id });
        }
      }

      // In Progress -> Available (unassign/remove)
      if (sourceType === 'in-progress' && targetType === 'available') {
        toast({
          title: "Can't Move Back",
          description: "Tasks in progress can't be moved back to available",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  if (!child) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-72px)]">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{child.name}'s Tasks</h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">{child.totalPoints} pts</span>
              <span className="text-muted-foreground">• Level {child.level}</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">Drag tasks to move them between columns</p>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-3 gap-4 h-[calc(100%-100px)]">
          {/* Available Tasks Column */}
          <div 
            className="flex flex-col bg-card rounded-lg border-2 border-border"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'available')}
          >
            <div className="p-4 border-b border-border bg-muted/50">
              <h2 className="font-bold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Available Tasks ({availableTasks.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {availableTasks.map((task) => (
                <Card 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, 'available')}
                  className="cursor-move hover:shadow-lg transition-shadow"
                  data-testid={`task-available-${task.id}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className="text-xl">{task.icon}</span>
                      <span>{task.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{task.pointValue} pts</span>
                      {task.requiresImage && (
                        <span title="Photo required">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {availableTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No available tasks
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div 
            className="flex flex-col bg-card rounded-lg border-2 border-border"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'in-progress')}
          >
            <div className="p-4 border-b border-border bg-blue-50 dark:bg-blue-950">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress ({inProgressChores.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {inProgressChores.map((chore) => (
                <Card 
                  key={chore.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chore, 'in-progress')}
                  className="cursor-move hover:shadow-lg transition-shadow"
                  data-testid={`task-in-progress-${chore.id}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className="text-xl">{chore.choreTemplate.icon}</span>
                      <span>{chore.choreTemplate.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {chore.choreTemplate.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {chore.choreTemplate.pointValue} pts
                      </span>
                      {chore.requiresImage && (
                        <span title="Photo required">
                          <ImageIcon className="h-4 w-4 text-orange-500" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {inProgressChores.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Drag tasks here to start
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div 
            className="flex flex-col bg-card rounded-lg border-2 border-border"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'completed')}
          >
            <div className="p-4 border-b border-border bg-green-50 dark:bg-green-950">
              <h2 className="font-bold flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                Completed ({completedChores.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {completedChores.map((chore) => (
                <Card 
                  key={chore.id}
                  className="opacity-75"
                  data-testid={`task-completed-${chore.id}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className="text-xl">{chore.choreTemplate.icon}</span>
                      <span>{chore.choreTemplate.name}</span>
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {chore.completionImageUrl && (
                      <img
                        src={chore.completionImageUrl}
                        alt="Completed task"
                        className="w-full h-24 object-cover rounded mb-2"
                        data-testid={`img-completed-task-${chore.id}`}
                      />
                    )}
                    <p className="text-xs text-muted-foreground mb-2">
                      {chore.choreTemplate.description}
                    </p>
                    <div className="text-xs">
                      <span className={chore.approvedAt ? "text-green-600 font-semibold" : "text-yellow-600"}>
                        {chore.approvedAt ? `✓ Approved: +${chore.pointsAwarded} pts` : "⏳ Pending"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {completedChores.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Drag tasks here to complete
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={(open) => {
        setImageDialogOpen(open);
        if (!open) {
          setUploadedImage(null);
          setSelectedTaskForImage(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photo to Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This task requires a photo. Please upload an image to complete it.
            </p>
            <div>
              <Label htmlFor="task-image">Upload Photo</Label>
              <Input
                id="task-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                data-testid="input-task-image-dialog"
              />
            </div>
            {uploadedImage && (
              <div>
                <Label>Preview</Label>
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded mt-2"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setImageDialogOpen(false);
                  setUploadedImage(null);
                  setSelectedTaskForImage(null);
                }}
                data-testid="button-cancel-image"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTaskForImage && uploadedImage) {
                    completeChoreMutation.mutate({
                      choreId: selectedTaskForImage.id,
                      imageUrl: uploadedImage
                    });
                  }
                }}
                disabled={!uploadedImage || completeChoreMutation.isPending}
                data-testid="button-submit-image"
              >
                {completeChoreMutation.isPending ? "Completing..." : "Complete Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Universal Chat Widget */}
      {child && (
        <UniversalChatWidget partyType="child" partyId={child.id} userName={child.name} />
      )}
    </div>
  );
}
