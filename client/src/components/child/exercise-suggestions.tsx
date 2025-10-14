import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, X, Clock, Trophy, Zap, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { AiSuggestion } from '@shared/schema';

interface ExerciseSuggestionsProps {
  child: {
    id: string;
    name: string;
  };
}

export function ExerciseSuggestions({ child }: ExerciseSuggestionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch existing exercise suggestions
  const { data: suggestions = [], isLoading } = useQuery<AiSuggestion[]>({
    queryKey: ['/api/ai/suggestions', child.id, 'exercise'],
    queryFn: () => apiRequest('GET', `/api/ai/suggestions?childId=${child.id}&status=new`).then(res => res.json()),
    enabled: !!child.id,
  });

  const exerciseSuggestions = suggestions.filter((s: AiSuggestion) => 
    s.kind === 'exercise' && s.status === 'new'
  );

  // Generate new exercise suggestions
  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/ai/suggestions', {
        childId: child.id,
        kinds: ['exercise'],
        params: {
          count: 3
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] });
      toast({
        title: "New Workouts Ready! 💪",
        description: "Check out these fun fitness activities designed just for you!",
      });
    },
    onError: () => {
      toast({
        title: "Oops! 😅",
        description: "Couldn't generate exercise ideas right now. Try again in a moment!",
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
      queryClient.invalidateQueries({ queryKey: ['/api/learning-activities', 'child', child.id] });
      toast({
        title: "Exercise Added! 🏃‍♀️",
        description: "Your new workout is ready to get you moving!",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Add Exercise 😞",
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
        title: "Exercise Skipped! 👍",
        description: "No worries, there are plenty of other ways to stay active!",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't Skip Exercise 😞", 
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

  const getIntensityColor = (intensity: string) => {
    switch (intensity?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      cardio: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      strength: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      flexibility: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      balance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      dance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      outdoor: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    };
    return colors[type?.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950" data-testid="exercise-suggestions">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900 dark:text-green-100">
            <Zap className="h-5 w-5 text-green-600" />
            Exercise Suggestions 💪
          </CardTitle>
          <p className="text-sm text-green-700 dark:text-green-300">Loading awesome fitness activities...</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-teal-50 dark:border-green-800 dark:from-green-950 dark:to-teal-950" data-testid="exercise-suggestions">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900 dark:text-green-100">
          <Zap className="h-5 w-5 text-green-600" />
          Exercise Suggestions 💪
        </CardTitle>
        <p className="text-sm text-green-700 dark:text-green-300">
          AI-powered fitness activities to keep you healthy and strong!
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {exerciseSuggestions.length === 0 ? (
          <div className="text-center py-6">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2"
              data-testid="generate-exercise-suggestions-button"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Finding Fun Workouts...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Get Exercise Ideas
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {exerciseSuggestions.map((suggestion: AiSuggestion) => {
              const payload = suggestion.payload as any; // Type cast for jsonb payload
              return (
                <Card 
                  key={suggestion.id} 
                  className="bg-white/80 dark:bg-gray-900/80 border-green-100 dark:border-green-800"
                  data-testid={`exercise-suggestion-${suggestion.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {payload.title || payload.subject || 'Fitness Activity'}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(payload.type || payload.category || 'cardio')}>
                            {payload.type || payload.category || 'cardio'}
                          </Badge>
                          <Badge className={getIntensityColor(payload.intensity || payload.difficulty || 'moderate')}>
                            {payload.intensity || payload.difficulty || 'moderate'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {payload.duration || payload.estimatedTime || 15} min
                          </div>
                          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <Trophy className="h-3 w-3" />
                            {payload.pointsReward || payload.pointValue || 25} pts
                          </div>
                          <div className="flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400">
                            <Heart className="h-3 w-3" />
                            Health Boost
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {payload.description || payload.rationale || 'A fun and healthy exercise to keep you active and strong!'}
                    </p>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissMutation.mutate(suggestion.id)}
                        disabled={dismissMutation.isPending}
                        className="text-gray-600 hover:text-gray-800 border-gray-300"
                        data-testid={`dismiss-exercise-${suggestion.id}`}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Not Today
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(suggestion.id)}
                        disabled={acceptMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`accept-exercise-${suggestion.id}`}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Let's Get Moving!
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
                className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-950"
                data-testid="generate-more-exercises-button"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Finding More Workouts...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
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