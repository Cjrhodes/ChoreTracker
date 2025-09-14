import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertChildSchema,
  insertChoreTemplateSchema,
  insertAssignedChoreSchema,
  insertRewardSchema,
  insertGoalSelectionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
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

  app.get('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const child = await storage.getChild(id);
      
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      // Verify parent ownership
      if (child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
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

  // Assigned chores routes
  app.get('/api/children/:childId/chores', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      
      // Verify parent ownership
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      
      // Verify parent ownership of child
      const child = await storage.getChild(choreData.childId);
      if (!child || child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

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

  // Goal selection routes
  app.get('/api/children/:childId/goal', isAuthenticated, async (req: any, res) => {
    try {
      const { childId } = req.params;
      
      // Verify parent ownership
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      
      // Verify parent ownership of child
      const child = await storage.getChild(goalData.childId);
      if (!child || child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      
      // Verify parent ownership
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

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
      
      // Verify user is requesting their own stats
      if (parentId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const activity = await storage.getRecentActivity(parentId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
