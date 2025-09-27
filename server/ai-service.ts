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

export interface QuizContent {
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
}

class AIContentService {
  
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
        return JSON.parse(content.text);
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
        return JSON.parse(content.text);
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
        return JSON.parse(content.text);
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
}

export const aiContentService = new AIContentService();