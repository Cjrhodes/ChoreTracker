import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, CheckCircle, X, Clock, Trophy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { AiSuggestion, Child } from '@shared/schema';

interface ParentTaskSuggestionsProps {
  children: Child[];
}

export function ParentTaskSuggestions({ children }: ParentTaskSuggestionsProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const selectedChild = children.find(child => child.id === selectedChildId);

  // Fetch existing task suggestions for selected child
  const { data: suggestions = [], isLoading } = useQuery<AiSuggestion[]>({
    queryKey: ['/api/ai/suggestions', selectedChildId, 'task'],
    queryFn: () => apiRequest('GET', `/api/ai/suggestions?childId=${selectedChildId}&status=new`).then(res => res.json()),
    enabled: !!selectedChildId,
  });

  const taskSuggestions = suggestions.filter((s: AiSuggestion) => 
    s.kind === 'task' && s.status === 'new'
  );

  // Generate new task suggestions
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChildId) throw new Error('No child selected');
      return apiRequest('POST', '/api/ai/suggestions', {
        childId: selectedChildId,
        kinds: ['task'],
        params: {
          count: 3
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      toast({
        title: "Task Ideas Generated! 🎯",
        description: `New household tasks suggested for ${selectedChild?.name}!`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
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
      if (selectedChildId) {
        queryClient.invalidateQueries({ queryKey: ['/api/children', selectedChildId, 'available-tasks'] });
      }
      toast({
        title: "Task Added to Templates! 🌟",
        description: "The new task is now available for your child to choose from.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Add Task",
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
        title: "Task Suggestion Dismissed",
        description: "The suggestion has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Dismiss Task",
        description: "Something went wrong. Please try again!",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async () => {
    if (!selectedChildId) {
      toast({
        title: "Select a Child",
        description: "Please choose which child to generate tasks for.",
        variant: "destructive",
      });
      return;
    }
    
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

  if (children.length === 0) {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" data-testid="parent-task-suggestions">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900">
            <Sparkles className="h-5 w-5 text-amber-600" />
            AI Task Suggestions
          </CardTitle>
          <p className="text-sm text-amber-700">Add children first to generate task ideas</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" data-testid="parent-task-suggestions">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-900">
          <Sparkles className="h-5 w-5 text-amber-600" />
          AI Task Generator
        </CardTitle>
        <p className="text-sm text-amber-700">
          Generate helpful household tasks for your children
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Child Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-900">Select Child:</label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger data-testid="select-child-for-tasks">
              <SelectValue placeholder="Choose a child..." />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {child.name} (Age {child.age})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Area */}
        {!selectedChildId ? (
          <div className="text-center py-6 text-amber-700">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Choose a child to start generating task ideas</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-6 text-amber-700">
            <p className="text-sm">Loading existing suggestions...</p>
          </div>
        ) : taskSuggestions.length === 0 ? (
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
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Task Ideas for {selectedChild?.name}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {taskSuggestions.map((suggestion: AiSuggestion) => {
              const payload = suggestion.payload as any;
              return (
                <Card 
                  key={suggestion.id} 
                  className="bg-white/80 border-amber-100"
                  data-testid={`task-suggestion-${suggestion.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {payload.subject || payload.title || 'Household Task'}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(payload.category || 'household')}>
                            {payload.category || 'household'}
                          </Badge>
                          <Badge className={getDifficultyColor(payload.difficulty || 'medium')}>
                            {payload.difficulty || 'medium'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {payload.estimatedTime || payload.duration || 15} min
                          </div>
                          <div className="flex items-center gap-1 text-sm text-amber-600">
                            <Trophy className="h-3 w-3" />
                            {payload.pointsReward || payload.pointValue || 20} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
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
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(suggestion.id)}
                        disabled={acceptMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`accept-task-${suggestion.id}`}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Add to Tasks
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
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                data-testid="generate-more-tasks-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating More...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate More Ideas
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