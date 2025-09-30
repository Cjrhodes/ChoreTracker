import Anthropic from '@anthropic-ai/sdk';

/*
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514" as it is the latest model.
*/

// <important_do_not_delete>
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
// </important_do_not_delete>

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface SynopsisContent {
  title: string;
  content: string;
  keyPoints: string[];
  difficulty: string;
}

export interface LearningLinks {
  title: string;
  url: string;
  description: string;
}

export interface ChatMessage {
  role: 'agent' | 'child';
  content: string;
  timestamp: Date;
}

export interface AgentResponse {
  message: string;
  type: 'reminder' | 'encouragement' | 'goal_coaching' | 'general_chat' | 'family_status';
  actionSuggestion?: string;
}

export interface QuizContent {
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
}

class AIContentService {
  
  // Helper function to clean AI response and extract JSON
  private cleanJsonResponse(text: string): string {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    
    // Remove opening fence (```json or ```)
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    
    // Remove closing fence
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    
    return cleaned.trim();
  }
  
  async generateSynopsis(subject: string, age: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<SynopsisContent> {
    const ageGroup = this.getAgeGroup(age);
    const prompt = `You are an educational content creator. Create an age-appropriate synopsis about "${subject}" for ${ageGroup} (age ${age}).

Difficulty level: ${difficulty}
Requirements:
- Use vocabulary appropriate for age ${age}
- Make it engaging and fun to read
- Include 3-5 key learning points
- Keep content length appropriate for attention span
- Be factually accurate and educational

Return your response as JSON with this exact structure:
{
  "title": "An engaging title about the subject",
  "content": "The main educational content (2-4 paragraphs for age appropriateness)",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "difficulty": "${difficulty}"
}`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        system: "You are an expert educational content creator specializing in age-appropriate learning materials. Always respond with valid JSON only."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedText = this.cleanJsonResponse(content.text);
        console.log('AI Synopsis Response (cleaned):', cleanedText.substring(0, 200) + '...');
        try {
          return JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('JSON Parse Error for synopsis:', parseError);
          console.error('Raw AI Response:', content.text);
          console.error('Cleaned Response:', cleanedText);
          throw new Error('AI response is not valid JSON');
        }
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating synopsis:', error);
      throw new Error('Failed to generate educational synopsis');
    }
  }

  async generateQuiz(subject: string, age: number, difficulty: 'easy' | 'medium' | 'hard', questionCount: number = 5): Promise<QuizContent> {
    const ageGroup = this.getAgeGroup(age);
    const prompt = `You are an educational quiz creator. Create a ${questionCount}-question multiple choice quiz about "${subject}" for ${ageGroup} (age ${age}).

Difficulty level: ${difficulty}
Requirements:
- Questions appropriate for age ${age} comprehension level
- 4 multiple choice options (A, B, C, D) per question
- Only one correct answer per question
- Include brief explanations for correct answers
- Make questions engaging and educational
- Avoid tricky or confusing wording
- Cover different aspects of the subject

Return your response as JSON with this exact structure:
{
  "title": "Quiz title about the subject",
  "questions": [
    {
      "question": "The question text",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ],
  "passingScore": 60
}`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        system: "You are an expert educational assessment creator. Always respond with valid JSON only. Ensure correctIndex is a number (0-3) indicating the correct choice."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedText = this.cleanJsonResponse(content.text);
        console.log('AI Quiz Response (cleaned):', cleanedText.substring(0, 200) + '...');
        try {
          return JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('JSON Parse Error for quiz:', parseError);
          console.error('Raw AI Response:', content.text);
          console.error('Cleaned Response:', cleanedText);
          throw new Error('AI response is not valid JSON');
        }
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate educational quiz');
    }
  }

  async generateLearningLinks(subject: string, age: number): Promise<LearningLinks[]> {
    const ageGroup = this.getAgeGroup(age);
    const prompt = `You are an educational resource curator. Suggest 3-4 high-quality, age-appropriate learning resources about "${subject}" for ${ageGroup} (age ${age}).

Requirements:
- Safe, educational websites suitable for children
- Age-appropriate content and reading level
- Reputable sources (educational institutions, museums, libraries, PBS Kids, National Geographic Kids, etc.)
- Interactive or engaging format when possible
- No commercial or advertising-heavy sites

Return your response as JSON array with this structure:
[
  {
    "title": "Resource title",
    "url": "https://example.com",
    "description": "Brief description of what they'll learn"
  }
]`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        system: "You are an expert educational resource curator. Always respond with valid JSON only. Only suggest real, safe educational websites."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedText = this.cleanJsonResponse(content.text);
        console.log('AI Learning Links Response (cleaned):', cleanedText.substring(0, 200) + '...');
        try {
          return JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('JSON Parse Error for learning links:', parseError);
          console.error('Raw AI Response:', content.text);
          console.error('Cleaned Response:', cleanedText);
          throw new Error('AI response is not valid JSON');
        }
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating learning links:', error);
      throw new Error('Failed to generate learning resources');
    }
  }

  private getAgeGroup(age: number): string {
    if (age <= 6) return "early elementary";
    if (age <= 9) return "elementary";
    if (age <= 12) return "middle elementary";
    if (age <= 15) return "middle school";
    return "high school";
  }

  async chatWithAgent(
    childMessage: string,
    childName: string,
    age: number,
    currentTasks: any[],
    learningGoals: any[],
    totalPoints: number,
    level: number,
    conversationHistory: ChatMessage[] = []
  ): Promise<AgentResponse> {
    const ageGroup = this.getAgeGroup(age);
    
    // Build context about the child's current situation
    const contextInfo = {
      pendingTasks: currentTasks.filter(task => !task.completedAt).length,
      completedToday: currentTasks.filter(task => {
        if (!task.completedAt) return false;
        const today = new Date().toISOString().split('T')[0];
        return new Date(task.completedAt).toISOString().startsWith(today);
      }).length,
      activeGoals: learningGoals.length,
      totalPoints,
      level
    };

    // Recent conversation context (last 5 messages)
    const recentChat = conversationHistory.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const agentPersona = `You are TaskTitan Agent, a friendly AI companion for ${childName}, a ${age}-year-old. 

YOUR PERSONALITY:
- Encouraging but never patronizing
- Uses language that feels natural for tweens (ages 10-15)
- Celebrates wins without being over-the-top
- Respects their growing independence
- Motivational but not preachy
- Sometimes uses light humor or emojis (sparingly)
- Treats them like the capable person they're becoming

CURRENT CONTEXT:
- ${childName} has ${contextInfo.pendingTasks} pending tasks
- Completed ${contextInfo.completedToday} tasks today  
- Has ${contextInfo.activeGoals} learning goals active
- Currently at Level ${contextInfo.level} with ${contextInfo.totalPoints} total points

CONVERSATION STYLE:
- Keep responses conversational and brief (1-3 sentences usually)
- Ask questions to engage them
- Give specific encouragement about their progress
- Suggest next steps when appropriate
- Be genuinely interested in what they're saying

AVOID:
- Talking down to them
- Being overly enthusiastic or fake
- Long lectures or advice dumps
- Treating them like a little kid`;

    const prompt = `Recent conversation:
${recentChat}

${childName} just said: "${childMessage}"

Respond as TaskTitan Agent. Keep it natural and engaging.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        system: agentPersona
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Determine response type based on content
        let responseType: 'reminder' | 'encouragement' | 'goal_coaching' | 'general_chat' = 'general_chat';
        const lowerMessage = content.text.toLowerCase();
        
        if (lowerMessage.includes('task') || lowerMessage.includes('chore') || lowerMessage.includes('remember')) {
          responseType = 'reminder';
        } else if (lowerMessage.includes('great') || lowerMessage.includes('awesome') || lowerMessage.includes('nice')) {
          responseType = 'encouragement';
        } else if (lowerMessage.includes('goal') || lowerMessage.includes('learn') || lowerMessage.includes('study')) {
          responseType = 'goal_coaching';
        }

        return {
          message: content.text,
          type: responseType,
          actionSuggestion: contextInfo.pendingTasks > 0 ? 'Check out your pending tasks!' : undefined
        };
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error in agent chat:', error);
      // Fallback response that's still in character
      return {
        message: "Hey there! I'm having a little tech trouble right now, but I'm still here for you. What's up?",
        type: 'general_chat'
      };
    }
  }

  async chatWithParent(
    parentMessage: string,
    parentName: string,
    familyContext: {
      children: Array<{
        id: string;
        name: string;
        age: number;
        level: number;
        totalPoints: number;
      }>;
      totalPendingTasks: number;
      tasksCompletedToday: number;
      activeLearningGoals: number;
      recentActivity?: string[];
    },
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AgentResponse> {
    // Build family status summary
    const childrenSummary = familyContext.children.map(child => 
      `${child.name} (${child.age}yo, Level ${child.level}, ${child.totalPoints} points)`
    ).join(', ');

    // Recent conversation context (last 5 messages)
    const recentChat = conversationHistory.slice(-5).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const agentPersona = `You are TaskTitan Agent, an AI companion helping ${parentName || 'this parent'} manage their family's activities and growth.

YOUR PERSONALITY:
- Professional but friendly and approachable
- Data-driven and insightful about family progress
- Supportive of parenting goals
- Practical and solution-oriented
- Understands the challenges of family management
- Respectful of parenting decisions

FAMILY CONTEXT:
- Children: ${childrenSummary || 'No children yet'}
- Pending Tasks: ${familyContext.totalPendingTasks}
- Completed Today: ${familyContext.tasksCompletedToday}
- Active Learning Goals: ${familyContext.activeLearningGoals}

YOUR CAPABILITIES:
- Provide insights about children's progress
- Suggest household organization strategies
- Offer encouragement and celebrate family wins
- Give data-driven observations about patterns
- Help with goal-setting and motivation strategies
- Answer questions about the TaskTitan system

CONVERSATION STYLE:
- Keep responses conversational (2-4 sentences typically)
- Be specific about family data when relevant
- Ask clarifying questions when helpful
- Provide actionable suggestions
- Acknowledge parenting challenges with empathy

AVOID:
- Giving medical, legal, or professional advice
- Being judgmental about parenting choices
- Overstepping into personal family matters
- Long explanations unless asked`;

    const prompt = `Recent conversation:
${recentChat || 'Starting new conversation'}

${parentName || 'Parent'} just said: "${parentMessage}"

Respond as TaskTitan Agent. Be helpful and conversational.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
        system: agentPersona
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Determine response type
        let responseType: 'reminder' | 'encouragement' | 'goal_coaching' | 'general_chat' | 'family_status' = 'general_chat';
        const lowerMessage = content.text.toLowerCase();
        
        if (lowerMessage.includes('progress') || lowerMessage.includes('status') || lowerMessage.includes('doing')) {
          responseType = 'family_status';
        } else if (lowerMessage.includes('task') || lowerMessage.includes('chore') || lowerMessage.includes('remember')) {
          responseType = 'reminder';
        } else if (lowerMessage.includes('great') || lowerMessage.includes('awesome') || lowerMessage.includes('congratulations')) {
          responseType = 'encouragement';
        } else if (lowerMessage.includes('goal') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
          responseType = 'goal_coaching';
        }

        return {
          message: content.text,
          type: responseType as any,
          actionSuggestion: familyContext.totalPendingTasks > 5 ? 'You have several pending tasks to review' : undefined
        };
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error in parent agent chat:', error);
      // Fallback response
      return {
        message: "I'm here to help! How can I assist you with managing your family's activities today?",
        type: 'general_chat'
      };
    }
  }

  async generateReminder(
    childName: string,
    age: number,
    pendingTasks: any[]
  ): Promise<string> {
    const ageGroup = this.getAgeGroup(age);
    
    const taskList = pendingTasks.map(task => 
      `- ${task.choreTemplate.name} (${task.choreTemplate.pointValue} points)`
    ).join('\n');

    const prompt = `You are TaskTitan Agent sending a friendly reminder to ${childName}, a ${age}-year-old.

PENDING TASKS:
${taskList}

Send a brief, encouraging reminder that feels natural for a tween. Be motivational but not pushy. Maybe mention the points they can earn or their progress.

Keep it to 1-2 sentences max.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a friendly AI agent for tweens. Keep reminders brief and encouraging."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating reminder:', error);
      return `Hey ${childName}! You've got ${pendingTasks.length} tasks waiting for you. Ready to earn some points? 💪`;
    }
  }

  async generateGoalSuggestions(
    age: number, 
    interests?: string[], 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<Array<{
    subject: string;
    rationale: string;
    suggestedTargetUnits: number;
    pointsPerUnit: number;
  }>> {
    const interestsText = interests?.length ? `Interests: ${interests.join(', ')}` : '';
    
    const prompt = `Generate 3 age-appropriate learning goals for a ${age}-year-old tween.

${interestsText}
Difficulty: ${difficulty}

For each goal, provide:
- subject: The learning topic/skill
- rationale: Why this is valuable for their age (1 sentence)
- suggestedTargetUnits: Number of learning activities to complete (3-8)
- pointsPerUnit: Points per activity (10-25 based on difficulty)

Focus on: STEM, creative skills, life skills, languages, or hobbies that build confidence and independence.

Return as JSON array.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
        system: "Generate educational suggestions for tweens. Return valid JSON only."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedResponse = this.cleanJsonResponse(content.text);
        return JSON.parse(cleanedResponse);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating learning goals:', error);
      // Fallback goals
      return [
        {
          subject: "Basic Coding with Scratch",
          rationale: "Programming builds logical thinking and creativity.",
          suggestedTargetUnits: 5,
          pointsPerUnit: 15
        }
      ];
    }
  }

  async generateTaskSuggestions(
    age: number,
    categories: string[] = ['educational', 'fitness', 'creative'],
    timeboxMinutes: number = 20
  ): Promise<Array<{
    title: string;
    description: string;
    category: string;
    pointValue: number;
    frequency: string;
  }>> {
    const categoriesText = categories.join(', ');
    
    const prompt = `Generate 4 engaging tasks for a ${age}-year-old that take about ${timeboxMinutes} minutes each.

Categories: ${categoriesText}
Age: ${age} years

For each task, provide:
- title: Clear, actionable task name
- description: What they'll do (1-2 sentences)
- category: One of: ${categoriesText}
- pointValue: Points earned (15-30 based on effort/time)
- frequency: "daily", "weekly", or "custom"

Make tasks fun, achievable, and age-appropriate. Mix easy wins with slight challenges.

Return as JSON array.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
        system: "Generate task suggestions for tweens. Return valid JSON only."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedResponse = this.cleanJsonResponse(content.text);
        return JSON.parse(cleanedResponse);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating task suggestions:', error);
      // Fallback tasks
      return [
        {
          title: "15-Minute Room Cleanup",
          description: "Organize and tidy your room, focusing on one area at a time.",
          category: "household",
          pointValue: 20,
          frequency: "daily"
        }
      ];
    }
  }

  async generateExercisePlan(
    age: number,
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<Array<{
    title: string;
    description: string;
    duration: number;
    equipment: string;
    pointValue: number;
    safetyNotes: string;
  }>> {
    const prompt = `Generate 3 safe, fun exercise activities for a ${age}-year-old at ${fitnessLevel} fitness level.

Requirements:
- No dangerous equipment
- Age-appropriate movements 
- Can be done at home or in a safe space
- Include warm-up guidance

For each exercise, provide:
- title: Fun, motivating name
- description: Clear instructions (2-3 sentences)  
- duration: Minutes (5-20 based on age/level)
- equipment: "none" or simple items like "towel", "water bottle"
- pointValue: Points earned (10-25)
- safetyNotes: Important safety tip (1 sentence)

Return as JSON array.`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
        system: "Generate safe exercise suggestions for tweens. Return valid JSON only."
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const cleanedResponse = this.cleanJsonResponse(content.text);
        return JSON.parse(cleanedResponse);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Error generating exercise plan:', error);
      // Fallback exercises
      return [
        {
          title: "10-Minute Dance Party",
          description: "Put on your favorite music and dance freely for 10 minutes. Move however feels good!",
          duration: 10,
          equipment: "none",
          pointValue: 15,
          safetyNotes: "Make sure you have enough space and avoid slippery surfaces."
        }
      ];
    }
  }
}

export const aiContentService = new AIContentService();