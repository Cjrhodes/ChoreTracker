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
  currentGoalId: varchar("current_goal_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const choreTemplates = pgTable("chore_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  pointValue: integer("point_value").notNull(),
  icon: varchar("icon").notNull().default("🧹"),
  frequency: varchar("frequency").notNull().default("daily"), // daily, weekly, custom
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  imageUrl: varchar("image_url"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  choreTemplates: many(choreTemplates),
  rewards: many(rewards),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  assignedChores: many(assignedChores),
  earnedBadges: many(earnedBadges),
  goalSelections: many(goalSelections),
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

// Insert schemas
export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertChoreTemplateSchema = createInsertSchema(choreTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertAssignedChoreSchema = createInsertSchema(assignedChores).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertEarnedBadgeSchema = createInsertSchema(earnedBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertGoalSelectionSchema = createInsertSchema(goalSelections).omit({
  id: true,
  createdAt: true,
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
