import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { 
  insertChildSchema,
  insertChoreTemplateSchema,
  insertAssignedChoreSchema,
  insertRewardSchema,
  insertGoalSelectionSchema,
  insertLearningGoalSchema,
  insertLearningActivitySchema,
  insertQuizAttemptSchema
} from "@shared/schema";
import { aiContentService } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {

  // User authentication route
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Children routes
  app.get('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const children = await storage.getChildrenByParent(parentId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.get('/api/children/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const child = await storage.getChild(id);
      
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      res.json(child);
    } catch (error) {
      console.error("Error fetching child:", error);
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const childData = insertChildSchema.parse({ ...req.body, parentId });
      const child = await storage.createChild(childData);
      res.json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.delete('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify child belongs to parent
      const child = await storage.getChild(id);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      if (child.parentId !== parentId) {
        return res.status(403).json({ message: "Not authorized to delete this child" });
      }
      
      await storage.deleteChild(id);
      res.json({ message: "Child deleted successfully" });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Chore template routes
  app.get('/api/chore-templates', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const templates = await storage.getChoreTemplatesByParent(parentId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching chore templates:", error);
      res.status(500).json({ message: "Failed to fetch chore templates" });
    }
  });

  app.post('/api/chore-templates', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const templateData = insertChoreTemplateSchema.parse({ ...req.body, parentId });
      const template = await storage.createChoreTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating chore template:", error);
      res.status(500).json({ message: "Failed to create chore template" });
    }
  });

  app.delete('/api/chore-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify template belongs to parent
      const template = await storage.getChoreTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Chore template not found" });
      }
      if (template.parentId !== parentId) {
        return res.status(403).json({ message: "Not authorized to delete this template" });
      }
      
      await storage.deleteChoreTemplate(id);
      res.json({ message: "Chore template deleted successfully" });
    } catch (error) {
      console.error("Error deleting chore template:", error);
      res.status(500).json({ message: "Failed to delete chore template" });
    }
  });

  // Assigned chores routes
  app.get('/api/children/:childId/chores', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const chores = await storage.getAssignedChoresByChild(childId);
      res.json(chores);
    } catch (error) {
      console.error("Error fetching assigned chores:", error);
      res.status(500).json({ message: "Failed to fetch assigned chores" });
    }
  });

  app.post('/api/assigned-chores', isAuthenticated, async (req: any, res) => {
    try {
      const choreData = insertAssignedChoreSchema.parse(req.body);
      const chore = await storage.assignChore(choreData);
      res.json(chore);
    } catch (error) {
      console.error("Error assigning chore:", error);
      res.status(500).json({ message: "Failed to assign chore" });
    }
  });

  app.patch('/api/assigned-chores/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.completeChore(id);
      res.json({ message: "Chore marked as completed" });
    } catch (error) {
      console.error("Error completing chore:", error);
      res.status(500).json({ message: "Failed to complete chore" });
    }
  });

  app.patch('/api/assigned-chores/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { pointsAwarded } = req.body;
      const approverId = req.user.claims.sub;
      
      await storage.approveChore(id, approverId, pointsAwarded);
      res.json({ message: "Chore approved and points awarded" });
    } catch (error) {
      console.error("Error approving chore:", error);
      res.status(500).json({ message: "Failed to approve chore" });
    }
  });

  app.delete('/api/assigned-chores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify assigned chore belongs to parent's child
      const chore = await storage.getAssignedChore(id);
      if (!chore) {
        return res.status(404).json({ message: "Assigned chore not found" });
      }
      
      // Get child to verify parent ownership
      const child = await storage.getChild(chore.childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Not authorized to delete this chore" });
      }
      
      await storage.deleteAssignedChore(id);
      res.json({ message: "Assigned chore deleted successfully" });
    } catch (error) {
      console.error("Error deleting assigned chore:", error);
      res.status(500).json({ message: "Failed to delete assigned chore" });
    }
  });

  // Rewards routes
  app.get('/api/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const rewards = await storage.getRewardsByParent(parentId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const rewardData = insertRewardSchema.parse({ ...req.body, parentId });
      const reward = await storage.createReward(rewardData);
      res.json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  app.delete('/api/rewards/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify reward belongs to parent
      const reward = await storage.getReward(id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      if (reward.parentId !== parentId) {
        return res.status(403).json({ message: "Not authorized to delete this reward" });
      }
      
      await storage.deleteReward(id);
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      console.error("Error deleting reward:", error);
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // Goal selection routes
  app.get('/api/children/:childId/goal', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const goal = await storage.getActiveGoal(childId);
      res.json(goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });

  app.post('/api/goal-selections', isAuthenticated, async (req: any, res) => {
    try {
      const goalData = insertGoalSelectionSchema.parse(req.body);
      const goal = await storage.selectGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error selecting goal:", error);
      res.status(500).json({ message: "Failed to select goal" });
    }
  });

  // Badges routes
  app.get('/api/children/:childId/badges', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const badges = await storage.getBadgesByChild(childId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // Stats routes
  app.get('/api/stats/:parentId', isAuthenticated, async (req: any, res) => {
    try {
      const { parentId } = req.params;
      const activity = await storage.getRecentActivity(parentId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Learning Goals routes
  app.get('/api/learning/goals', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const { childId } = req.query;
      
      let goals;
      if (childId) {
        // Verify parent owns this child
        const child = await storage.getChild(childId);
        if (!child || child.parentId !== parentId) {
          return res.status(403).json({ message: "Unauthorized access to child's goals" });
        }
        goals = await storage.getLearningGoalsByChild(childId);
      } else {
        goals = await storage.getLearningGoalsByParent(parentId);
      }
      
      res.json(goals);
    } catch (error) {
      console.error("Error fetching learning goals:", error);
      res.status(500).json({ message: "Failed to fetch learning goals" });
    }
  });

  app.get('/api/learning/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      const goal = await storage.getLearningGoal(id);
      if (!goal) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      
      // Verify parent owns this goal
      if (goal.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to goal" });
      }
      
      res.json(goal);
    } catch (error) {
      console.error("Error fetching learning goal:", error);
      res.status(500).json({ message: "Failed to fetch learning goal" });
    }
  });

  app.post('/api/learning/goals', isAuthenticated, async (req: any, res) => {
    try {
      const parentId = req.user.claims.sub;
      const goalData = insertLearningGoalSchema.parse({ ...req.body, parentId });
      
      // Verify parent owns the child
      const child = await storage.getChild(goalData.childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to child" });
      }
      
      const goal = await storage.createLearningGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating learning goal:", error);
      res.status(500).json({ message: "Failed to create learning goal" });
    }
  });

  app.patch('/api/learning/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const parentId = req.user.claims.sub;
      
      const goal = await storage.getLearningGoal(id);
      if (!goal || goal.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to goal" });
      }
      
      await storage.updateLearningGoalStatus(id, isActive);
      res.json({ message: "Goal status updated successfully" });
    } catch (error) {
      console.error("Error updating learning goal:", error);
      res.status(500).json({ message: "Failed to update learning goal" });
    }
  });

  app.delete('/api/learning/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parentId = req.user.claims.sub;
      
      const goal = await storage.getLearningGoal(id);
      if (!goal || goal.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to goal" });
      }
      
      await storage.deleteLearningGoal(id);
      res.json({ message: "Learning goal deleted successfully" });
    } catch (error) {
      console.error("Error deleting learning goal:", error);
      res.status(500).json({ message: "Failed to delete learning goal" });
    }
  });

  // AI Content Generation routes
  app.post('/api/learning/goals/:goalId/generate-synopsis', isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const parentId = req.user.claims.sub;
      
      const goal = await storage.getLearningGoal(goalId);
      if (!goal || goal.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to goal" });
      }
      
      const child = await storage.getChild(goal.childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      // Generate AI content
      const synopsis = await aiContentService.generateSynopsis(goal.subject, child.age, goal.difficulty as any);
      const learningLinks = await aiContentService.generateLearningLinks(goal.subject, child.age);
      
      // Create activity
      const activity = await storage.createActivity({
        goalId: goal.id,
        type: 'synopsis',
        title: synopsis.title,
        content: synopsis,
        resourceLinks: learningLinks,
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error generating synopsis:", error);
      res.status(500).json({ message: "Failed to generate synopsis" });
    }
  });

  app.post('/api/learning/goals/:goalId/generate-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const { questionCount = 5 } = req.body;
      const parentId = req.user.claims.sub;
      
      const goal = await storage.getLearningGoal(goalId);
      if (!goal || goal.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to goal" });
      }
      
      const child = await storage.getChild(goal.childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      // Generate AI quiz
      const quiz = await aiContentService.generateQuiz(goal.subject, child.age, goal.difficulty as any, questionCount);
      
      // Create activity
      const activity = await storage.createActivity({
        goalId: goal.id,
        type: 'quiz',
        title: quiz.title,
        content: quiz,
      });
      
      res.json(activity);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  // Learning Activities routes
  app.get('/api/learning/activities', isAuthenticated, async (req: any, res) => {
    try {
      const { childId, goalId } = req.query;
      const parentId = req.user.claims.sub;
      
      let activities;
      if (childId) {
        // Verify parent owns this child
        const child = await storage.getChild(childId);
        if (!child || child.parentId !== parentId) {
          return res.status(403).json({ message: "Unauthorized access to child's activities" });
        }
        activities = await storage.getActiveActivitiesByChild(childId);
      } else if (goalId) {
        // Verify parent owns this goal
        const goal = await storage.getLearningGoal(goalId);
        if (!goal || goal.parentId !== parentId) {
          return res.status(403).json({ message: "Unauthorized access to goal's activities" });
        }
        activities = await storage.getActivitiesByGoal(goalId);
      } else {
        return res.status(400).json({ message: "childId or goalId required" });
      }
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching learning activities:", error);
      res.status(500).json({ message: "Failed to fetch learning activities" });
    }
  });

  app.get('/api/learning/activities/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const activity = await storage.getActivity(id);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Quiz Attempts routes
  app.post('/api/learning/activities/:activityId/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const { activityId } = req.params;
      const { childId, answers } = req.body;
      const parentId = req.user.claims.sub;
      
      // Verify parent owns this child
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to child" });
      }
      
      const activity = await storage.getActivity(activityId);
      if (!activity || activity.type !== 'quiz') {
        return res.status(404).json({ message: "Quiz activity not found" });
      }
      
      const goal = await storage.getLearningGoal(activity.goalId);
      if (!goal) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      
      // Calculate score
      const quiz = activity.content as any;
      const questions = quiz.questions || [];
      let score = 0;
      
      answers.forEach((answerIndex: number, questionIndex: number) => {
        if (questions[questionIndex] && questions[questionIndex].correctIndex === answerIndex) {
          score++;
        }
      });
      
      const percentage = (score / questions.length) * 100;
      const passed = percentage >= (quiz.passingScore || 60);
      const pointsAwarded = passed ? goal.pointsPerUnit : 0;
      
      // Create quiz attempt
      const attempt = await storage.createQuizAttempt({
        activityId,
        childId,
        answers,
        score,
        totalQuestions: questions.length,
        passed,
        pointsAwarded,
      });
      
      res.json({
        ...attempt,
        percentage,
        feedback: passed ? "Great job! You passed the quiz!" : "Keep practicing! Try again to improve your score."
      });
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get('/api/learning/attempts', isAuthenticated, async (req: any, res) => {
    try {
      const { childId, activityId } = req.query;
      const parentId = req.user.claims.sub;
      
      if (childId) {
        // Verify parent owns this child
        const child = await storage.getChild(childId);
        if (!child || child.parentId !== parentId) {
          return res.status(403).json({ message: "Unauthorized access to child's attempts" });
        }
        const attempts = await storage.getAttemptsByChild(childId);
        res.json(attempts);
      } else if (activityId) {
        const attempts = await storage.getAttemptsByActivity(activityId);
        res.json(attempts);
      } else {
        return res.status(400).json({ message: "childId or activityId required" });
      }
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Child-specific learning goal routes (frontend API compatibility)
  app.get('/api/learning-goals/child/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify parent owns this child
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to child's learning goals" });
      }
      
      const goals = await storage.getLearningGoalsByChild(childId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching child's learning goals:", error);
      res.status(500).json({ message: "Failed to fetch learning goals" });
    }
  });

  // Child-specific learning activities route
  app.get('/api/learning-activities/child/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify parent owns this child
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to child's activities" });
      }
      
      const activities = await storage.getLearningActivitiesByChild(childId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching child's learning activities:", error);
      res.status(500).json({ message: "Failed to fetch learning activities" });
    }
  });

  // Active quiz for child route
  app.get('/api/quizzes/active/:childId', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      const parentId = req.user.claims.sub;
      
      // Verify parent owns this child
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to child's quizzes" });
      }
      
      const activeQuiz = await storage.getActiveQuizByChild(childId);
      res.json(activeQuiz);
    } catch (error) {
      console.error("Error fetching active quiz:", error);
      res.status(500).json({ message: "Failed to fetch active quiz" });
    }
  });

  // Generate content for learning goal route
  app.post('/api/learning-goals/:goalId/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const { goalId } = req.params;
      const parentId = req.user.claims.sub;
      
      // Get learning goal and verify ownership
      const goal = await storage.getLearningGoal(goalId);
      if (!goal) {
        return res.status(404).json({ message: "Learning goal not found" });
      }
      
      const child = await storage.getChild(goal.childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to learning goal" });
      }

      // Generate synopsis and learning links
      const synopsis = await aiContentService.generateSynopsis(goal.subject, child.age, goal.difficulty as 'easy' | 'medium' | 'hard');
      const learningLinks = await aiContentService.generateLearningLinks(goal.subject, child.age);
      
      // Create learning activity
      const activityData = {
        goalId: goal.id,
        type: 'synopsis' as const,
        title: `${goal.subject} Learning Adventure`,
        content: {
          synopsis,
          resourceLinks: learningLinks,
        },
        resourceLinks: learningLinks,
        status: 'new' as const,
      };
      
      const activity = await storage.createLearningActivity(activityData);

      // Generate quiz
      const quiz = await aiContentService.generateQuiz(goal.subject, child.age, goal.difficulty as 'easy' | 'medium' | 'hard');
      const firstQuestion = quiz.questions[0]; // Get the first question from the quiz
      const quizData = {
        learningGoalId: goal.id, // This matches the createQuiz method parameter
        question: firstQuestion.question,
        options: firstQuestion.choices,
        correctAnswer: firstQuestion.choices[firstQuestion.correctIndex],
        pointsReward: goal.pointsPerUnit,
      };
      
      const createdQuiz = await storage.createQuiz(quizData);

      res.json({ 
        message: "Content generated successfully",
        activity,
        quiz: createdQuiz
      });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Submit quiz answer route
  app.post('/api/quizzes/:quizId/submit', isAuthenticated, async (req: any, res) => {
    try {
      const { quizId } = req.params;
      const { childId, selectedAnswer } = req.body;
      const parentId = req.user.claims.sub;
      
      // Verify parent owns this child
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== parentId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Get quiz
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Check answer (quiz.content has the actual quiz data)
      const quizContent = quiz.content as any;
      const isCorrect = selectedAnswer === quizContent.correctAnswer;
      const pointsEarned = isCorrect ? (quizContent.pointsReward || 10) : 0;
      
      // Create quiz attempt (match schema exactly)
      const attemptData = {
        activityId: quizId, // quizId is actually the learning activity ID
        childId,
        answers: [selectedAnswer], // Schema expects JSONB array
        score: isCorrect ? 1 : 0,
        totalQuestions: 1,
        passed: isCorrect,
        pointsAwarded: pointsEarned,
      };
      
      const attempt = await storage.createQuizAttempt(attemptData);
      
      // Update child's total points if correct
      if (isCorrect) {
        await storage.updateChildPoints(childId, pointsEarned);
      }
      
      res.json({
        isCorrect,
        pointsEarned,
        attempt
      });
    } catch (error) {
      console.error("Error submitting quiz answer:", error);
      res.status(500).json({ message: "Failed to submit quiz answer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
