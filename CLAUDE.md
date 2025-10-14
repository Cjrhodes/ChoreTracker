# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chore Buster is a family chore management application that gamifies household tasks for children and provides parents with organizational tools. Built as a full-stack TypeScript application with React frontend and Express backend, deployed on Replit with Neon PostgreSQL database.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server (runs tsx server/index.ts with Vite)
npm run build        # Build for production (Vite + esbuild)
npm start            # Run production build
```

### Database Operations
```bash
npm run db:push      # Push schema changes to database using Drizzle Kit
```

### Type Checking
```bash
npm run check        # Run TypeScript compiler check (tsc)
```

## Architecture Overview

### Monorepo Structure
The codebase uses a monorepo pattern with clear separation:
- `client/` - React frontend with Vite build
- `server/` - Express.js backend
- `shared/` - Shared TypeScript types and database schema (Drizzle ORM)

### Key Architectural Patterns

**Frontend Architecture:**
- React + TypeScript with Vite bundler
- shadcn/ui components built on Radix UI primitives
- TanStack Query for server state management
- Wouter for client-side routing
- React Hook Form + Zod for form validation
- Theme support via next-themes

**Backend Architecture:**
- Express.js REST API with middleware pattern
- Storage abstraction layer (`server/storage.ts`) - always use this instead of direct DB access
- Anthropic AI integration (`server/ai-service.ts`) using Claude Sonnet 4
- WebSocket support for real-time chat (path: `/ws`)
- Session-based authentication with PostgreSQL session store

**Database Layer:**
- Drizzle ORM with PostgreSQL (Neon serverless)
- Schema defined in `shared/schema.ts` with full type safety
- All database operations go through `storage.ts` abstraction

### Import Aliases
- `@/` - Resolves to `client/src/`
- `@shared/` - Resolves to `shared/`
- `@assets/` - Resolves to `attached_assets/`

## Critical Security Patterns

### Authorization Pattern (ESSENTIAL)
**Every child-scoped API endpoint MUST verify parent ownership:**

```typescript
// CORRECT - Always verify parent owns the child
const child = await storage.getChild(childId);
if (!child || child.parentId !== req.user.claims.sub) {
  return res.status(403).json({ message: "Access denied" });
}
```

This pattern prevents IDOR (Insecure Direct Object Reference) vulnerabilities and is implemented across:
- Child profile access (`/api/children/:id`)
- Child chores and tasks
- Child learning goals and activities
- Child chat history
- AI suggestions
- Scheduled tasks

**Never skip this check** - it's the primary authorization mechanism protecting child data.

### Authentication
- Replit OpenID Connect (OIDC) via Passport.js
- Session data stored in PostgreSQL `sessions` table (mandatory for Replit Auth)
- `isAuthenticated` middleware on all protected routes
- User ID available as `req.user.claims.sub`

## Database Schema Highlights

### Core Tables
- `users` - Parent accounts (Replit Auth required)
- `children` - Child profiles with gamification data (points, level, XP)
- `chore_templates` - Reusable task definitions by parent
- `assigned_chores` - Specific task assignments to children
- `rewards` - Reward catalog for points redemption
- `learning_goals` - AI-powered educational goals
- `learning_activities` - Generated learning content (synopsis, quiz, game)
- `ai_suggestions` - AI-generated task/goal suggestions (new/accepted/dismissed)
- `app_messages` - Universal chat history (supports both parent and child chat)
- `scheduled_tasks` - Calendar-based task scheduling

### Important Relationships
- Children belong to one parent (foreign key: `parentId`)
- All child data cascades on child deletion (see `storage.deleteChild()`)
- Learning activities belong to learning goals (foreign key: `goalId`)
- Quiz attempts link to activities (foreign key: `activityId`)

## AI Integration

### AI Service (`server/ai-service.ts`)
Uses Anthropic Claude API with model: `claude-sonnet-4-20250514`

**Key AI Capabilities:**
- `generateSynopsis()` - Age-appropriate educational content
- `generateQuiz()` - Multi-choice quizzes with explanations
- `generateLearningLinks()` - Curated learning resources
- `chatWithAgent()` - Child chat with personalized context
- `chatWithParent()` - Parent chat with family insights
- `generateGoalSuggestions()` - Personalized learning goals
- `generateTaskSuggestions()` - Custom task recommendations
- `generateExercisePlan()` - Safe, age-appropriate exercises
- `generateReminder()` - Motivational task reminders

**AI Response Handling:**
All AI methods include JSON response cleaning (`cleanJsonResponse()`) to handle markdown code fences. Always use try-catch with fallback responses.

### WebSocket Chat System
Real-time bidirectional chat on `/ws` endpoint:
- Supports both parent and child chat (distinguished by `partyType`)
- Authentication via session cookie validation
- Message persistence to `app_messages` table
- Connection map: `partyConnections` stores active WebSocket connections
- Automatic chat history pruning (keeps last 200 messages)

## Frontend Component Structure

### Dual Dashboard Pattern
- **Parent Dashboard** (`client/src/pages/parent-dashboard.tsx`) - 4-column layout for family management
- **Child Dashboard** (`client/src/pages/child-dashboard.tsx`) - Gamified task interface

### Key Component Categories
- `client/src/components/parent/` - Parent-specific components
- `client/src/components/child/` - Child-specific components
- `client/src/components/ui/` - shadcn/ui base components
- `client/src/hooks/` - Custom React hooks (useAuth, useToast, etc.)

## Common Development Patterns

### Adding a New API Endpoint
1. Define route in `server/routes.ts`
2. Add `isAuthenticated` middleware
3. Implement authorization check (verify parent owns child if applicable)
4. Use Zod schema validation from `@shared/schema`
5. Call storage layer methods (never direct DB access)
6. Handle errors with appropriate status codes

### Adding Database Tables
1. Define table in `shared/schema.ts` using Drizzle
2. Create insert schema with `createInsertSchema()` + Zod refinements
3. Add TypeScript types for select/insert
4. Define relations if needed
5. Add storage methods in `server/storage.ts`
6. Run `npm run db:push` to apply schema changes

### Working with Storage Layer
Always use the `storage` singleton from `server/storage.ts`:
- Provides consistent interface across codebase
- Includes authorization logic where appropriate
- Handles cascade deletions correctly
- Type-safe with Drizzle queries

## Environment Variables

Required environment variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `NODE_ENV` - "development" or "production"
- `REPLIT_DOMAINS` - Comma-separated allowed origins for CORS/WebSocket

## Development Notes

### Level Progression System
Children gain XP (experience points) equal to points earned. Level calculation in `storage.calculateChildLevel()`:
- Level 1: 0-99 XP
- Level 2: 100-299 XP
- Level 3: 300-599 XP
- Each level requires 100 + (level-1) * 200 total XP

### Daily Progress & Streaks
- Tracks category completion (household, exercise, educational, outdoor)
- Bonus points awarded for multi-category completion
- Streak tracking for consecutive active days

### Task Scheduling
Children can schedule tasks on specific dates/times via calendar view. Stored in `scheduled_tasks` table with support for three task types: chore, learning, exercise.

### Child Deletion Cascade
When deleting a child (`storage.deleteChild()`), the following are deleted in order:
1. Learning activities and quiz attempts
2. Learning goals
3. AI suggestions and chat messages
4. Daily progress and scheduled tasks
5. Badges, goal selections, assigned chores
6. Finally, the child record

This ensures no orphaned records and maintains referential integrity.
