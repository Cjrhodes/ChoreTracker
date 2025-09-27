import {
  users,
  children,
  choreTemplates,
  assignedChores,
  rewards,
  earnedBadges,
  goalSelections,
  learningGoals,
  learningActivities,
  quizAttempts,
  type User,
  type UpsertUser,
  type Child,
  type InsertChild,
  type ChoreTemplate,
  type InsertChoreTemplate,
  type AssignedChore,
  type InsertAssignedChore,
  type Reward,
  type InsertReward,
  type EarnedBadge,
  type InsertEarnedBadge,
  type GoalSelection,
  type InsertGoalSelection,
  type LearningGoal,
  type InsertLearningGoal,
  type LearningActivity,
  type InsertLearningActivity,
  type QuizAttempt,
  type InsertQuizAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  // Child operations
  getChildrenByParent(parentId: string): Promise<Child[]>;
  getChild(id: string): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChildPoints(childId: string, points: number): Promise<void>;
  updateChildGoal(childId: string, goalId: string | null): Promise<void>;
  deleteChild(childId: string): Promise<void>;

  // Chore operations
  getChoreTemplatesByParent(parentId: string): Promise<ChoreTemplate[]>;
  getChoreTemplate(templateId: string): Promise<ChoreTemplate | undefined>;
  createChoreTemplate(template: InsertChoreTemplate): Promise<ChoreTemplate>;
  deleteChoreTemplate(templateId: string): Promise<void>;
  getAssignedChoresByChild(childId: string): Promise<(AssignedChore & { choreTemplate: ChoreTemplate })[]>;
  getAssignedChore(choreId: string): Promise<AssignedChore | undefined>;
  assignChore(chore: InsertAssignedChore): Promise<AssignedChore>;
  completeChore(choreId: string): Promise<void>;
  approveChore(choreId: string, approverId: string, pointsAwarded: number): Promise<void>;
  deleteAssignedChore(choreId: string): Promise<void>;

  // Reward operations
  getRewardsByParent(parentId: string): Promise<Reward[]>;
  getReward(rewardId: string): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  deleteReward(rewardId: string): Promise<void>;

  // Badge operations
  getBadgesByChild(childId: string): Promise<EarnedBadge[]>;
  awardBadge(badge: InsertEarnedBadge): Promise<EarnedBadge>;

  // Goal operations
  getActiveGoal(childId: string): Promise<(GoalSelection & { reward: Reward }) | undefined>;
  selectGoal(goal: InsertGoalSelection): Promise<GoalSelection>;
  deactivateCurrentGoal(childId: string): Promise<void>;

  // Learning Goals operations
  getLearningGoalsByParent(parentId: string): Promise<LearningGoal[]>;
  getLearningGoalsByChild(childId: string): Promise<LearningGoal[]>;
  getLearningGoal(goalId: string): Promise<LearningGoal | undefined>;
  createLearningGoal(goal: InsertLearningGoal): Promise<LearningGoal>;
  updateLearningGoalStatus(goalId: string, isActive: boolean): Promise<void>;
  deleteLearningGoal(goalId: string): Promise<void>;

  // Learning Activities operations
  getActivitiesByGoal(goalId: string): Promise<LearningActivity[]>;
  getActivity(activityId: string): Promise<LearningActivity | undefined>;
  createActivity(activity: InsertLearningActivity): Promise<LearningActivity>;
  createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity>; // Alias for routes compatibility
  updateActivityStatus(activityId: string, status: 'new' | 'in_progress' | 'completed'): Promise<void>;
  getActiveActivitiesByChild(childId: string): Promise<(LearningActivity & { goal: LearningGoal })[]>;
  getLearningActivitiesByChild(childId: string): Promise<LearningActivity[]>; // For API routes

  // Quiz operations (stored as learning activities with type='quiz')
  createQuiz(quizData: { learningGoalId: string; question: string; options: string[]; correctAnswer: string; pointsReward: number }): Promise<LearningActivity>;
  getQuiz(quizId: string): Promise<LearningActivity | undefined>;
  getActiveQuizByChild(childId: string): Promise<LearningActivity | undefined>;

  // Quiz Attempts operations
  getAttemptsByActivity(activityId: string): Promise<QuizAttempt[]>;
  getAttemptsByChild(childId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getLatestAttempt(activityId: string, childId: string): Promise<QuizAttempt | undefined>;

  // Stats
  getCompletedChoresCount(childId: string, date: Date): Promise<number>;
  getRecentActivity(parentId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all children of this user (which will cascade to their related records)
    const userChildren = await this.getChildrenByParent(userId);
    for (const child of userChildren) {
      await this.deleteChild(child.id);
    }
    
    // Delete user's chore templates and rewards
    await db.delete(choreTemplates).where(eq(choreTemplates.parentId, userId));
    await db.delete(rewards).where(eq(rewards.parentId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Child operations
  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChildPoints(childId: string, points: number): Promise<void> {
    await db
      .update(children)
      .set({ totalPoints: sql`${children.totalPoints} + ${points}` })
      .where(eq(children.id, childId));
  }

  async updateChildGoal(childId: string, goalId: string | null): Promise<void> {
    await db
      .update(children)
      .set({ currentGoalId: goalId })
      .where(eq(children.id, childId));
  }

  async deleteChild(childId: string): Promise<void> {
    // Delete related records first (to maintain referential integrity)
    await db.delete(earnedBadges).where(eq(earnedBadges.childId, childId));
    await db.delete(goalSelections).where(eq(goalSelections.childId, childId));
    await db.delete(assignedChores).where(eq(assignedChores.childId, childId));
    
    // Then delete the child
    await db.delete(children).where(eq(children.id, childId));
  }

  // Chore operations
  async getChoreTemplatesByParent(parentId: string): Promise<ChoreTemplate[]> {
    return await db.select().from(choreTemplates).where(eq(choreTemplates.parentId, parentId));
  }

  async getChoreTemplate(templateId: string): Promise<ChoreTemplate | undefined> {
    const [template] = await db.select().from(choreTemplates).where(eq(choreTemplates.id, templateId));
    return template;
  }

  async createChoreTemplate(template: InsertChoreTemplate): Promise<ChoreTemplate> {
    const [newTemplate] = await db.insert(choreTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteChoreTemplate(templateId: string): Promise<void> {
    // First delete all assigned chores using this template
    await db.delete(assignedChores).where(eq(assignedChores.choreTemplateId, templateId));
    
    // Then delete the template
    await db.delete(choreTemplates).where(eq(choreTemplates.id, templateId));
  }

  async getAssignedChoresByChild(childId: string): Promise<(AssignedChore & { choreTemplate: ChoreTemplate })[]> {
    return await db
      .select({
        id: assignedChores.id,
        childId: assignedChores.childId,
        choreTemplateId: assignedChores.choreTemplateId,
        assignedDate: assignedChores.assignedDate,
        completedAt: assignedChores.completedAt,
        approvedAt: assignedChores.approvedAt,
        approvedBy: assignedChores.approvedBy,
        pointsAwarded: assignedChores.pointsAwarded,
        createdAt: assignedChores.createdAt,
        choreTemplate: choreTemplates,
      })
      .from(assignedChores)
      .innerJoin(choreTemplates, eq(assignedChores.choreTemplateId, choreTemplates.id))
      .where(eq(assignedChores.childId, childId))
      .orderBy(desc(assignedChores.createdAt));
  }

  async getAssignedChore(choreId: string): Promise<AssignedChore | undefined> {
    const [chore] = await db.select().from(assignedChores).where(eq(assignedChores.id, choreId));
    return chore;
  }

  async assignChore(chore: InsertAssignedChore): Promise<AssignedChore> {
    const [newChore] = await db.insert(assignedChores).values(chore).returning();
    return newChore;
  }

  async completeChore(choreId: string): Promise<void> {
    await db
      .update(assignedChores)
      .set({ completedAt: new Date() })
      .where(eq(assignedChores.id, choreId));
  }

  async approveChore(choreId: string, approverId: string, pointsAwarded: number): Promise<void> {
    const [chore] = await db
      .update(assignedChores)
      .set({ 
        approvedAt: new Date(),
        approvedBy: approverId,
        pointsAwarded
      })
      .where(eq(assignedChores.id, choreId))
      .returning();

    if (chore) {
      await this.updateChildPoints(chore.childId, pointsAwarded);
    }
  }

  async deleteAssignedChore(choreId: string): Promise<void> {
    await db.delete(assignedChores).where(eq(assignedChores.id, choreId));
  }

  // Reward operations
  async getRewardsByParent(parentId: string): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.parentId, parentId));
  }

  async getReward(rewardId: string): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    return reward;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async deleteReward(rewardId: string): Promise<void> {
    // First deactivate any goals using this reward
    await db
      .update(goalSelections)
      .set({ isActive: false })
      .where(eq(goalSelections.rewardId, rewardId));
    
    // Then delete the reward
    await db.delete(rewards).where(eq(rewards.id, rewardId));
  }

  // Badge operations
  async getBadgesByChild(childId: string): Promise<EarnedBadge[]> {
    return await db.select().from(earnedBadges).where(eq(earnedBadges.childId, childId));
  }

  async awardBadge(badge: InsertEarnedBadge): Promise<EarnedBadge> {
    const [newBadge] = await db.insert(earnedBadges).values(badge).returning();
    return newBadge;
  }

  // Goal operations
  async getActiveGoal(childId: string): Promise<(GoalSelection & { reward: Reward }) | undefined> {
    const [goal] = await db
      .select({
        id: goalSelections.id,
        childId: goalSelections.childId,
        rewardId: goalSelections.rewardId,
        isActive: goalSelections.isActive,
        createdAt: goalSelections.createdAt,
        reward: rewards,
      })
      .from(goalSelections)
      .innerJoin(rewards, eq(goalSelections.rewardId, rewards.id))
      .where(and(eq(goalSelections.childId, childId), eq(goalSelections.isActive, true)));
    
    return goal;
  }

  async selectGoal(goal: InsertGoalSelection): Promise<GoalSelection> {
    // Deactivate current goal first
    await this.deactivateCurrentGoal(goal.childId);
    
    const [newGoal] = await db.insert(goalSelections).values(goal).returning();
    
    // Update child's current goal reference
    await this.updateChildGoal(goal.childId, newGoal.rewardId);
    
    return newGoal;
  }

  async deactivateCurrentGoal(childId: string): Promise<void> {
    await db
      .update(goalSelections)
      .set({ isActive: false })
      .where(and(eq(goalSelections.childId, childId), eq(goalSelections.isActive, true)));
  }

  // Stats
  async getCompletedChoresCount(childId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignedChores)
      .where(
        and(
          eq(assignedChores.childId, childId),
          sql`${assignedChores.completedAt} >= ${startOfDay}`,
          sql`${assignedChores.completedAt} <= ${endOfDay}`
        )
      );

    return Number(result.count);
  }

  async getRecentActivity(parentId: string): Promise<any[]> {
    return await db
      .select({
        type: sql<string>`'chore_completed'`,
        childName: children.name,
        choreName: choreTemplates.name,
        points: assignedChores.pointsAwarded,
        completedAt: assignedChores.completedAt,
        approvedAt: assignedChores.approvedAt,
        choreId: assignedChores.id,
      })
      .from(assignedChores)
      .innerJoin(children, eq(assignedChores.childId, children.id))
      .innerJoin(choreTemplates, eq(assignedChores.choreTemplateId, choreTemplates.id))
      .where(
        and(
          eq(children.parentId, parentId),
          sql`${assignedChores.completedAt} IS NOT NULL`
        )
      )
      .orderBy(desc(assignedChores.completedAt))
      .limit(10);
  }

  // Learning Goals operations
  async getLearningGoalsByParent(parentId: string): Promise<LearningGoal[]> {
    return await db.select().from(learningGoals).where(eq(learningGoals.parentId, parentId));
  }

  async getLearningGoalsByChild(childId: string): Promise<LearningGoal[]> {
    return await db.select().from(learningGoals).where(eq(learningGoals.childId, childId));
  }

  async getLearningGoal(goalId: string): Promise<LearningGoal | undefined> {
    const [goal] = await db.select().from(learningGoals).where(eq(learningGoals.id, goalId));
    return goal;
  }

  async createLearningGoal(goal: InsertLearningGoal): Promise<LearningGoal> {
    const [newGoal] = await db.insert(learningGoals).values(goal).returning();
    return newGoal;
  }

  async updateLearningGoalStatus(goalId: string, isActive: boolean): Promise<void> {
    await db
      .update(learningGoals)
      .set({ isActive })
      .where(eq(learningGoals.id, goalId));
  }

  async deleteLearningGoal(goalId: string): Promise<void> {
    // Delete related activities and quiz attempts first
    const activities = await this.getActivitiesByGoal(goalId);
    for (const activity of activities) {
      await db.delete(quizAttempts).where(eq(quizAttempts.activityId, activity.id));
    }
    await db.delete(learningActivities).where(eq(learningActivities.goalId, goalId));
    
    // Then delete the goal
    await db.delete(learningGoals).where(eq(learningGoals.id, goalId));
  }

  // Learning Activities operations
  async getActivitiesByGoal(goalId: string): Promise<LearningActivity[]> {
    return await db.select().from(learningActivities).where(eq(learningActivities.goalId, goalId));
  }

  async getActivity(activityId: string): Promise<LearningActivity | undefined> {
    const [activity] = await db.select().from(learningActivities).where(eq(learningActivities.id, activityId));
    return activity;
  }

  async createActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    const [newActivity] = await db.insert(learningActivities).values(activity).returning();
    return newActivity;
  }

  async updateActivityStatus(activityId: string, status: 'new' | 'in_progress' | 'completed'): Promise<void> {
    await db
      .update(learningActivities)
      .set({ status })
      .where(eq(learningActivities.id, activityId));
  }

  async getActiveActivitiesByChild(childId: string): Promise<(LearningActivity & { goal: LearningGoal })[]> {
    return await db
      .select({
        id: learningActivities.id,
        goalId: learningActivities.goalId,
        type: learningActivities.type,
        title: learningActivities.title,
        content: learningActivities.content,
        resourceLinks: learningActivities.resourceLinks,
        status: learningActivities.status,
        createdAt: learningActivities.createdAt,
        goal: learningGoals,
      })
      .from(learningActivities)
      .innerJoin(learningGoals, eq(learningActivities.goalId, learningGoals.id))
      .where(
        and(
          eq(learningGoals.childId, childId),
          eq(learningGoals.isActive, true)
        )
      );
  }

  // Quiz Attempts operations
  async getAttemptsByActivity(activityId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.activityId, activityId));
  }

  async getAttemptsByChild(childId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.childId, childId));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    
    // If the quiz was passed, award points and mark activity as completed
    if (newAttempt.passed && newAttempt.pointsAwarded > 0) {
      await this.updateChildPoints(newAttempt.childId, newAttempt.pointsAwarded);
      await this.updateActivityStatus(newAttempt.activityId, 'completed');
    }
    
    return newAttempt;
  }

  async getLatestAttempt(activityId: string, childId: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.activityId, activityId),
          eq(quizAttempts.childId, childId)
        )
      )
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);
    return attempt;
  }

  // Missing learning activity methods for API compatibility
  async createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    // Alias to createActivity for API route compatibility
    return await this.createActivity(activity);
  }

  async getLearningActivitiesByChild(childId: string): Promise<LearningActivity[]> {
    return await db
      .select({
        id: learningActivities.id,
        goalId: learningActivities.goalId,
        type: learningActivities.type,
        title: learningActivities.title,
        content: learningActivities.content,
        resourceLinks: learningActivities.resourceLinks,
        status: learningActivities.status,
        createdAt: learningActivities.createdAt,
      })
      .from(learningActivities)
      .innerJoin(learningGoals, eq(learningActivities.goalId, learningGoals.id))
      .where(eq(learningGoals.childId, childId));
  }

  // Quiz operations (stored as learning activities with type='quiz')
  async createQuiz(quizData: { learningGoalId: string; question: string; options: string[]; correctAnswer: string; pointsReward: number }): Promise<LearningActivity> {
    const quizActivity = {
      goalId: quizData.learningGoalId,
      type: 'quiz',
      title: 'Quiz Activity',
      content: {
        question: quizData.question,
        options: quizData.options,
        correctAnswer: quizData.correctAnswer,
        pointsReward: quizData.pointsReward,
      },
      status: 'new',
    };
    
    return await this.createActivity(quizActivity);
  }

  async getQuiz(quizId: string): Promise<LearningActivity | undefined> {
    const [quiz] = await db
      .select()
      .from(learningActivities)
      .where(
        and(
          eq(learningActivities.id, quizId),
          eq(learningActivities.type, 'quiz')
        )
      );
    return quiz;
  }

  async getActiveQuizByChild(childId: string): Promise<LearningActivity | undefined> {
    const [quiz] = await db
      .select({
        id: learningActivities.id,
        goalId: learningActivities.goalId,
        type: learningActivities.type,
        title: learningActivities.title,
        content: learningActivities.content,
        resourceLinks: learningActivities.resourceLinks,
        status: learningActivities.status,
        createdAt: learningActivities.createdAt,
      })
      .from(learningActivities)
      .innerJoin(learningGoals, eq(learningActivities.goalId, learningGoals.id))
      .where(
        and(
          eq(learningGoals.childId, childId),
          eq(learningGoals.isActive, true),
          eq(learningActivities.type, 'quiz'),
          eq(learningActivities.status, 'new')
        )
      )
      .orderBy(desc(learningActivities.createdAt))
      .limit(1);
    return quiz;
  }
}

export const storage = new DatabaseStorage();
