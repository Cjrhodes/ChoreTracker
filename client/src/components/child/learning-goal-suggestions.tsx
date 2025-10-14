import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Brain, Star, CheckCircle, X, Sparkles, Target } from 'lucide-react'
import type { Child } from '@shared/schema'

interface AISuggestion {
  id: string
  kind: string
  payload: {
    subject: string
    rationale: string
    suggestedTargetUnits: number
    pointsPerUnit: number
  }
  status: string
  createdAt: string
}

interface LearningGoalSuggestionsProps {
  child: Child
}

export function LearningGoalSuggestions({ child }: LearningGoalSuggestionsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch existing learning goal suggestions
  const { data: suggestions = [], isLoading } = useQuery<AISuggestion[]>({
    queryKey: ['/api/ai/suggestions', child.id, 'learning_goal'],
    queryFn: () => apiRequest('GET', `/api/ai/suggestions?childId=${child.id}&status=new`).then(res => res.json()),
    enabled: !!child.id
  })

  // Filter to only learning goal suggestions
  const learningGoalSuggestions = suggestions.filter(s => s.kind === 'learning_goal')

  // Generate new suggestions
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/suggestions', {
        childId: child.id,
        kinds: ['learning_goal'],
        params: {
          interests: [], // Could be expanded to include child interests
          difficulty: 'medium'
        }
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] })
      toast({
        title: "New Learning Goals Generated! 🎯",
        description: "Check out these awesome learning adventures designed just for you!"
      })
    },
    onError: () => {
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't generate new suggestions right now. Try again later!",
        variant: "destructive"
      })
    }
  })

  // Accept suggestion
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return apiRequest('POST', `/api/ai/suggestions/${suggestionId}/accept`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['/api/learning-goals'] })
      toast({
        title: "Learning Goal Added! 🌟",
        description: "Your new learning adventure is ready to start!"
      })
    },
    onError: () => {
      toast({
        title: "Couldn't add learning goal",
        description: "Something went wrong. Please try again!",
        variant: "destructive"
      })
    }
  })

  // Dismiss suggestion
  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return apiRequest('POST', `/api/ai/suggestions/${suggestionId}/dismiss`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/suggestions'] })
      toast({
        title: "Suggestion dismissed",
        description: "No worries! We'll suggest something else next time."
      })
    },
    onError: () => {
      toast({
        title: "Couldn't dismiss suggestion",
        description: "Please try again!",
        variant: "destructive"
      })
    }
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateSuggestionsMutation.mutateAsync()
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Learning Goal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading suggestions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full" data-testid="learning-goal-suggestions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Learning Goal Suggestions
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered learning adventures tailored for you!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {learningGoalSuggestions.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No learning goal suggestions yet. Let's create some awesome learning adventures for you!
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || generateSuggestionsMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="generate-learning-goals-button"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Amazing Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Learning Goals
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {learningGoalSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border border-purple-200 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20"
                  data-testid={`learning-goal-suggestion-${suggestion.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{suggestion.payload.subject}</h4>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.payload.suggestedTargetUnits} activities
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600">
                        {suggestion.payload.pointsPerUnit} pts each
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.payload.rationale}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptSuggestionMutation.mutate(suggestion.id)}
                      disabled={acceptSuggestionMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      data-testid={`accept-learning-goal-${suggestion.id}`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Let's Do It!
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissSuggestionMutation.mutate(suggestion.id)}
                      disabled={dismissSuggestionMutation.isPending}
                      data-testid={`dismiss-learning-goal-${suggestion.id}`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Not Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating || generateSuggestionsMutation.isPending}
                className="w-full"
                data-testid="generate-more-learning-goals-button"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating More Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate More Ideas
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}