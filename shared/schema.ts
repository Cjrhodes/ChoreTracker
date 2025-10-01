import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  age: integer("age").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").notNull().default(0),
  currentGoalId: varchar("current_goal_id"),
  goals: text("goals"), // Child's personal goals and aspirations
  interests: text("interests"), // Child's hobbies and interests
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  reminderMethod: varchar("reminder_method").notNull().default("notification"), // notification, email, none
  createdAt: timestamp("created_at").defaultNow(),
});

export const choreTemplates = pgTable("chore_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  pointValue: integer("point_value").notNull(),
  icon: varchar("icon").notNull().default("🧹"),
  category: varchar("category").notNull().default("household"), // household, exercise, educational, outdoor
  frequency: varchar("frequency").notNull().default("daily"), // daily, weekly, custom
  requiresImage: boolean("requires_image").notNull().default(false), // Whether task requires image proof of completion
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignedChores = pgTable("assigned_chores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  choreTemplateId: varchar("chore_template_id").notNull().references(() => choreTemplates.id),
  assignedDate: date("assigned_date").notNull(),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  pointsAwarded: integer("points_awarded"),
  requiresImage: boolean("requires_image").notNull().default(false), // Copied from template when assigned
  completionImageUrl: text("completion_image_url"), // Base64 or URL of completion proof image
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  imageUrl: varchar("image_url"),
  itemUrl: varchar("item_url"), // URL to Amazon item or any external product link
  category: varchar("category").notNull().default("item"), // item, cash, experience
  createdAt: timestamp("created_at").defaultNow(),
});

export const earnedBadges = pgTable("earned_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  badgeName: varchar("badge_name").notNull(),
  badgeIcon: varchar("badge_icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const goalSelections = pgTable("goal_selections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning Goals tables for AI-powered educational content
export const learningGoals = pgTable("learning_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  subject: varchar("subject").notNull(),
  difficulty: varchar("difficulty").notNull(), // 'easy', 'medium', 'hard'
  targetUnits: integer("target_units").notNull(), // number of activities to complete
  pointsPerUnit: integer("points_per_unit").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningActivities = pgTable("learning_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goalId: varchar("goal_id").notNull().references(() => learningGoals.id),
  type: varchar("type").notNull(), // 'synopsis', 'quiz', 'game'
  title: varchar("title").notNull(),
  content: jsonb("content"), // AI-generated content (synopsis text, quiz data, etc.)
  resourceLinks: jsonb("resource_links"), // Array of {title, url} for additional learning
  status: varchar("status").notNull().default("new"), // 'new', 'in_progress', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull().references(() => learningActivities.id),
  childId: varchar("child_id").notNull().references(() => children.id),
  answers: jsonb("answers"), // Array of selected answer indices
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Daily activity tracking for level progression and bonus points
export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  date: date("date").notNull(),
  categoriesCompleted: jsonb("categories_completed").notNull(), // Array of completed categories
  totalTasksCompleted: integer("total_tasks_completed").notNull().default(0),
  bonusPointsEarned: integer("bonus_points_earned").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0), // Days in a row with activity
  createdAt: timestamp("created_at").defaultNow(),
});

// AI chat messages for persistent conversation history
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  role: varchar("role").notNull(), // 'agent' or 'child'
  type: varchar("type").notNull(), // 'reminder', 'encouragement', 'goal_coaching', 'general_chat'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Universal app messages for both parent and child chat (replaces child-only ai_messages)
export const appMessages = pgTable("app_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyType: varchar("party_type").notNull(), // 'parent' or 'child'
  partyId: varchar("party_id").notNull(), // userId (if parent) or childId (if child)
  role: varchar("role").notNull(), // 'agent' or 'user'
  type: varchar("type").notNull(), // 'reminder', 'encouragement', 'goal_coaching', 'general_chat', 'family_status'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated suggestions that can be accepted/dismissed
export const aiSuggestions = pgTable("ai_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  kind: varchar("kind").notNull(), // 'learning_goal', 'task', 'exercise'
  payload: jsonb("payload").notNull(), // Normalized JSON structure for the suggestion
  status: varchar("status").notNull().default("new"), // 'new', 'accepted', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

// Scheduled tasks for calendar view
export const scheduledTasks = pgTable("scheduled_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id),
  taskType: varchar("task_type").notNull(), // 'chore', 'learning', 'exercise'
  taskId: varchar("task_id").notNull(), // Reference to choreTemplate, learningGoal, or aiSuggestion id
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time"), // Optional time in HH:MM format
  title: varchar("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  choreTemplates: many(choreTemplates),
  rewards: many(rewards),
  learningGoals: many(learningGoals),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  assignedChores: many(assignedChores),
  earnedBadges: many(earnedBadges),
  goalSelections: many(goalSelections),
  learningGoals: many(learningGoals),
  quizAttempts: many(quizAttempts),
  dailyProgress: many(dailyProgress),
  aiMessages: many(aiMessages),
  aiSuggestions: many(aiSuggestions),
  scheduledTasks: many(scheduledTasks),
}));

export const choreTemplatesRelations = relations(choreTemplates, ({ one, many }) => ({
  parent: one(users, {
    fields: [choreTemplates.parentId],
    references: [users.id],
  }),
  assignedChores: many(assignedChores),
}));

export const assignedChoresRelations = relations(assignedChores, ({ one }) => ({
  child: one(children, {
    fields: [assignedChores.childId],
    references: [children.id],
  }),
  choreTemplate: one(choreTemplates, {
    fields: [assignedChores.choreTemplateId],
    references: [choreTemplates.id],
  }),
  approver: one(users, {
    fields: [assignedChores.approvedBy],
    references: [users.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  parent: one(users, {
    fields: [rewards.parentId],
    references: [users.id],
  }),
  goalSelections: many(goalSelections),
}));

export const earnedBadgesRelations = relations(earnedBadges, ({ one }) => ({
  child: one(children, {
    fields: [earnedBadges.childId],
    references: [children.id],
  }),
}));

export const goalSelectionsRelations = relations(goalSelections, ({ one }) => ({
  child: one(children, {
    fields: [goalSelections.childId],
    references: [children.id],
  }),
  reward: one(rewards, {
    fields: [goalSelections.rewardId],
    references: [rewards.id],
  }),
}));

export const learningGoalsRelations = relations(learningGoals, ({ one, many }) => ({
  child: one(children, {
    fields: [learningGoals.childId],
    references: [children.id],
  }),
  parent: one(users, {
    fields: [learningGoals.parentId],
    references: [users.id],
  }),
  activities: many(learningActivities),
}));

export const learningActivitiesRelations = relations(learningActivities, ({ one, many }) => ({
  goal: one(learningGoals, {
    fields: [learningActivities.goalId],
    references: [learningGoals.id],
  }),
  quizAttempts: many(quizAttempts),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  activity: one(learningActivities, {
    fields: [quizAttempts.activityId],
    references: [learningActivities.id],
  }),
  child: one(children, {
    fields: [quizAttempts.childId],
    references: [children.id],
  }),
}));

export const dailyProgressRelations = relations(dailyProgress, ({ one }) => ({
  child: one(children, {
    fields: [dailyProgress.childId],
    references: [children.id],
  }),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  child: one(children, {
    fields: [aiMessages.childId],
    references: [children.id],
  }),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  child: one(children, {
    fields: [aiSuggestions.childId],
    references: [children.id],
  }),
}));

export const scheduledTasksRelations = relations(scheduledTasks, ({ one }) => ({
  child: one(children, {
    fields: [scheduledTasks.childId],
    references: [children.id],
  }),
}));

// Insert schemas
export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertChoreTemplateSchema = createInsertSchema(choreTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(['household', 'exercise', 'educational', 'outdoor']),
});

export const insertAssignedChoreSchema = createInsertSchema(assignedChores).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
}).extend({
  itemUrl: z.string().trim().optional().refine(
    (url) => !url || /^https?:\/\/.+/i.test(url),
    "Only HTTP/HTTPS URLs are allowed"
  ).or(z.literal("")),
});

export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertGoalSelectionSchema = createInsertSchema(goalSelections).omit({
  id: true,
  createdAt: true,
});

export const insertLearningGoalSchema = createInsertSchema(learningGoals).omit({
  id: true,
  createdAt: true,
}).extend({
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const insertLearningActivitySchema = createInsertSchema(learningActivities).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(['synopsis', 'quiz', 'game']),
  status: z.enum(['new', 'in_progress', 'completed']).optional(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(['agent', 'child']),
  type: z.enum(['reminder', 'encouragement', 'goal_coaching', 'general_chat']),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
}).extend({
  kind: z.enum(['learning_goal', 'task', 'exercise']),
  status: z.enum(['new', 'accepted', 'dismissed']).optional(),
});

export const insertAppMessageSchema = createInsertSchema(appMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  partyType: z.enum(['parent', 'child']),
  role: z.enum(['agent', 'user']),
  type: z.enum(['reminder', 'encouragement', 'goal_coaching', 'general_chat', 'family_status']),
});

export const insertScheduledTaskSchema = createInsertSchema(scheduledTasks).omit({
  id: true,
  createdAt: true,
}).extend({
  taskType: z.enum(['chore', 'learning', 'exercise']),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type ChoreTemplate = typeof choreTemplates.$inferSelect;
export type InsertChoreTemplate = z.infer<typeof insertChoreTemplateSchema>;
export type AssignedChore = typeof assignedChores.$inferSelect;
export type InsertAssignedChore = z.infer<typeof insertAssignedChoreSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type EarnedBadge = typeof earnedBadges.$inferSelect;
export type InsertEarnedBadge = z.infer<typeof insertEarnedBadgeSchema>;
export type GoalSelection = typeof goalSelections.$inferSelect;
export type InsertGoalSelection = z.infer<typeof insertGoalSelectionSchema>;
export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = z.infer<typeof insertLearningGoalSchema>;
export type LearningActivity = typeof learningActivities.$inferSelect;
export type InsertLearningActivity = z.infer<typeof insertLearningActivitySchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type AppMessage = typeof appMessages.$inferSelect;
export type InsertAppMessage = z.infer<typeof insertAppMessageSchema>;
export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = z.infer<typeof insertScheduledTaskSchema>;
