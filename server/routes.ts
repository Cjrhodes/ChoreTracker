import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { 
  insertChildSchema,
  insertChoreTemplateSchema,
  insertAssignedChoreSchema,
  insertRewardSchema,
  insertGoalSelectionSchema
} from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
