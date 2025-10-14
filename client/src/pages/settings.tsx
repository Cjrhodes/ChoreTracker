import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Settings as SettingsIcon, ArrowLeft, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Child } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const { data: children = [], isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  const { data: selectedChild, isLoading: loadingChild } = useQuery<Child>({
    queryKey: ['/api/children', selectedChildId],
    enabled: !!selectedChildId,
  });

  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMethod, setReminderMethod] = useState("notification");

  // Update local state when child data loads
  useEffect(() => {
    if (selectedChild) {
      setGoals(selectedChild.goals || "");
      setInterests(selectedChild.interests || "");
      setReminderEnabled(selectedChild.reminderEnabled ?? true);
      setReminderMethod(selectedChild.reminderMethod || "notification");
    }
  }, [selectedChild]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { goals: string; interests: string; reminderEnabled: boolean; reminderMethod: string }) => {
      return apiRequest('PATCH', `/api/children/${selectedChildId}/settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', selectedChildId] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({
        title: "Settings Saved! ✅",
        description: "The child's settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Couldn't save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
      return childId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setSelectedChildId("");
      toast({
        title: "Child Removed! 👋",
        description: "The child has been removed successfully.",
      });
      // Navigate to dashboard if no children left
      if (children.length === 1) {
        setLocation("/");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove child. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedChildId) {
      toast({
        title: "No Child Selected",
        description: "Please select a child to update their settings.",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      goals,
      interests,
      reminderEnabled,
      reminderMethod,
    });
  };

  // Update form when child changes
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    const child = children.find(c => c.id === childId);
    if (child) {
      setGoals(child.goals || "");
      setInterests(child.interests || "");
      setReminderEnabled(child.reminderEnabled ?? true);
      setReminderMethod(child.reminderMethod || "notification");
    }
  };

  if (loadingChildren) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="responsive-container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
            <CardDescription>Choose a child to manage their settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedChildId} onValueChange={handleChildChange}>
              <SelectTrigger data-testid="select-child">
                <SelectValue placeholder="Select a child..." />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id} data-testid={`option-child-${child.id}`}>
                    {child.name} (Age {child.age})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedChildId && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Help the AI create personalized tasks based on {selectedChild?.name}'s goals and interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="goals" className="text-base font-semibold mb-2 block">
                    Goals & Aspirations
                  </Label>
                  <Textarea
                    id="goals"
                    data-testid="input-goals"
                    placeholder="e.g., Learn to play guitar, improve math skills, become more organized..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    What does {selectedChild?.name} want to achieve or learn?
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="interests" className="text-base font-semibold mb-2 block">
                    Interests & Hobbies
                  </Label>
                  <Textarea
                    id="interests"
                    data-testid="input-interests"
                    placeholder="e.g., Soccer, video games, drawing, science experiments, cooking..."
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    What does {selectedChild?.name} enjoy doing in their free time?
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Task Reminders</CardTitle>
                <CardDescription>
                  Configure how {selectedChild?.name} receives reminders about incomplete tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="reminder-enabled" className="text-base font-semibold">
                      Enable Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic reminders for incomplete tasks
                    </p>
                  </div>
                  <Switch
                    id="reminder-enabled"
                    data-testid="switch-reminders"
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                </div>

                {reminderEnabled && (
                  <>
                    <Separator />
                    <div>
                      <Label htmlFor="reminder-method" className="text-base font-semibold mb-2 block">
                        Reminder Method
                      </Label>
                      <Select value={reminderMethod} onValueChange={setReminderMethod}>
                        <SelectTrigger id="reminder-method" data-testid="select-reminder-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notification" data-testid="option-notification">
                            📱 In-App Notification
                          </SelectItem>
                          <SelectItem value="email" data-testid="option-email">
                            📧 Email
                          </SelectItem>
                          <SelectItem value="both" data-testid="option-both">
                            🔔 Both Notification & Email
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        Choose how you'd like to receive reminders
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="lg"
                    data-testid="button-delete-child-settings"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Child
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Child?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{selectedChild?.name}" and all their data including chores, points, and achievements. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedChild && deleteChildMutation.mutate(selectedChild.id)}
                      disabled={deleteChildMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete-child"
                    >
                      {deleteChildMutation.isPending ? "Removing..." : "Remove Child"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending || loadingChild}
                data-testid="button-save-settings"
                size="lg"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
