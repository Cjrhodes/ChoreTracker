import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, CheckCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScheduledTask, ChoreTemplate } from "@shared/schema";
import { format } from "date-fns";

interface CalendarViewProps {
  childId: string;
}

export function CalendarView({ childId }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const { toast } = useToast();

  const { data: scheduledTasks = [] } = useQuery<ScheduledTask[]>({
    queryKey: ["/api/scheduled-tasks", childId],
    enabled: !!childId,
  });

  const { data: availableTasks = [] } = useQuery<ChoreTemplate[]>({
    queryKey: ["/api/children", childId, "available-tasks"],
    enabled: !!childId,
  });

  const scheduleTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; scheduledDate: string; scheduledTime: string }) => {
      const task = availableTasks.find(t => t.id === data.taskId);
      return apiRequest('POST', '/api/scheduled-tasks', {
        childId,
        taskType: 'chore',
        taskId: data.taskId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        title: task?.name || 'Task',
        description: task?.description || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-tasks', childId] });
      setIsScheduleDialogOpen(false);
      setSelectedTask(null);
      toast({
        title: "Task Scheduled! 📅",
        description: "Your task has been added to the calendar.",
      });
    },
  });

  const tasksForSelectedDate = selectedDate
    ? scheduledTasks.filter(
        task => task.scheduledDate === format(selectedDate, 'yyyy-MM-dd')
      )
    : [];

  const datesWithTasks = new Set(
    scheduledTasks.map(task => task.scheduledDate)
  );

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Task Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasTask: (date) => datesWithTasks.has(format(date, 'yyyy-MM-dd'))
            }}
            modifiersClassNames={{
              hasTask: "bg-primary/20 font-bold"
            }}
            className="rounded-md border"
          />
          <Button
            onClick={() => setIsScheduleDialogOpen(true)}
            className="w-full mt-4"
            data-testid="button-schedule-task"
          >
            Schedule a Task
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {tasksForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No tasks scheduled for this day
            </p>
          ) : (
            tasksForSelectedDate.map(task => (
              <div
                key={task.id}
                className={`p-3 rounded-lg border ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-card'
                }`}
                data-testid={`scheduled-task-${task.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {task.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {task.title}
                    </div>
                    {task.scheduledTime && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {task.scheduledTime}
                      </div>
                    )}
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableTasks.length === 0 ? (
              <div className="text-center py-8" data-testid="no-tasks-message">
                <p className="text-muted-foreground mb-2">No tasks available to schedule</p>
                <p className="text-sm text-muted-foreground">Ask your parent to create some tasks for you!</p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="task">Select Task</Label>
                  <Select value={selectedTask || ""} onValueChange={setSelectedTask}>
                    <SelectTrigger id="task" data-testid="select-task">
                      <SelectValue placeholder="Choose a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.icon} {task.name} ({task.pointValue} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    data-testid="input-time"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (selectedTask && selectedDate) {
                      scheduleTaskMutation.mutate({
                        taskId: selectedTask,
                        scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
                        scheduledTime: selectedTime,
                      });
                    }
                  }}
                  disabled={!selectedTask || scheduleTaskMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-schedule"
                >
                  {scheduleTaskMutation.isPending ? "Scheduling..." : "Schedule Task"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
