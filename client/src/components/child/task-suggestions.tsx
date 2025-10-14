import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, X, Clock, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { AiSuggestion } from '@shared/schema';

interface TaskSuggestionsProps {
  child: {
    id: string;
    name: string;
  };
}

export function TaskSuggestions({ child }: TaskSuggestionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch existing task suggestions
  const { data: suggestions = [], isLoading } = useQuery<AiSuggestion[]>({
    queryKey: ['/api/ai/suggestions', child.id, 'task'],
    queryFn: () => apiRequest('GET', `/api/ai/suggestions?childId=${child.id}&status=new`).then(res => res.json()),
    enabled: !!child.id,
  });

  const taskSuggestions = suggestions.filter((s: AiSuggestion) => 
    s.kind === 'task' && s.status === 'new'
  );

  // Generate new task suggestions
  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/ai/suggestions', {
        childId: child.id,
        kinds: ['task'],
        params: {
          count: 3
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      toast({
        title: "New Task Ideas Ready! 🎯",
        description: "Check out these helpful household tasks just for you!",
      });
    },
    onError: () => {
      toast({
        title: "Oops! 😅",
        description: "Couldn't generate task ideas right now. Try again in a moment!",
        variant: "destructive",
      });
    },
  });

  // Accept suggestion
  const acceptMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return apiRequest('POST', `/api/ai/suggestions/${suggestionId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chore-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children', child.id, 'available-tasks'] });
      toast({
        title: "Task Added! 🌟",
        description: "Your new task is ready to tackle!",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Add Task 😞",
        description: "Something went wrong. Please try again!",
        variant: "destructive",
      });
    },
  });

  // Dismiss suggestion  
  const dismissMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return apiRequest('POST', `/api/ai/suggestions/${suggestionId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      toast({
        title: "Task Skipped! 👍",
        description: "No worries, there are plenty of other ways to help out!",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Skip Task 😞", 
        description: "Something went wrong. Please try again!",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      cleaning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      organizing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      kitchen: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      laundry: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      outdoor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pets: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950" data-testid="task-suggestions">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-100">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Task Suggestions ✨
          </CardTitle>
          <p className="text-sm text-amber-700 dark:text-amber-300">Loading helpful household tasks...</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950 dark:to-orange-950" data-testid="task-suggestions">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-100">
          <Sparkles className="h-5 w-5 text-amber-600" />
          Task Suggestions ✨
        </CardTitle>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          AI-powered household tasks to help your family!
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {taskSuggestions.length === 0 ? (
          <div className="text-center py-6">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2"
              data-testid="generate-task-suggestions-button"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Finding Great Tasks...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Task Ideas
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {taskSuggestions.map((suggestion: AiSuggestion) => {
              const payload = suggestion.payload as any; // Type cast for jsonb payload
              return (
                <Card 
                  key={suggestion.id} 
                  className="bg-white/80 dark:bg-gray-900/80 border-amber-100 dark:border-amber-800"
                  data-testid={`task-suggestion-${suggestion.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {payload.subject || payload.title || 'Household Task'}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(payload.category || 'household')}>
                            {payload.category || 'household'}
                          </Badge>
                          <Badge className={getDifficultyColor(payload.difficulty || 'medium')}>
                            {payload.difficulty || 'medium'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {payload.estimatedTime || payload.duration || 15} min
                          </div>
                          <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                            <Trophy className="h-3 w-3" />
                            {payload.pointsReward || payload.pointValue || 20} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {payload.rationale || payload.description || 'A helpful household task for the family.'}
                    </p>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dismissMutation.mutate(suggestion.id)}
                      disabled={dismissMutation.isPending}
                      className="text-gray-600 hover:text-gray-800 border-gray-300"
                      data-testid={`dismiss-task-${suggestion.id}`}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Not Now
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(suggestion.id)}
                      disabled={acceptMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`accept-task-${suggestion.id}`}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      I'll Do This!
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="text-center pt-2">
              <Button 
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-950"
                data-testid="generate-more-tasks-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Finding More Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get More Ideas
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}