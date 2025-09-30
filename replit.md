# Overview

Chore Buster is a family chore management application designed to gamify household tasks for children while providing parents with organizational tools. The system allows parents to create and assign chores to their children, who can complete tasks to earn points and badges. Children can set goals for rewards and track their progress through an engaging, game-like interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a React-based frontend with TypeScript, built using Vite for fast development and optimized builds. The UI leverages shadcn/ui components built on top of Radix UI primitives, providing a comprehensive design system with Tailwind CSS for styling.

**Key Design Decisions:**
- **Dual Interface Pattern**: The app features toggleable interfaces (child mode vs parent mode) within a single application, allowing families to share one device while maintaining role-specific experiences
- **Mobile-First Design**: The interface is optimized for mobile devices with a maximum width container, recognizing that families often share tablets or phones
- **Component-Based Architecture**: Uses a modular component structure with reusable UI components and page-specific components separated by user role (child/ and parent/ directories)

**State Management:**
- TanStack Query for server state management and caching
- React Hook Form with Zod validation for form handling
- Local component state for UI interactions

**Routing:**
- Wouter for lightweight client-side routing
- Protected routes based on authentication status

## Backend Architecture

The backend follows a RESTful API design using Express.js with TypeScript. The server architecture emphasizes simplicity and maintainability.

**Key Design Decisions:**
- **Express.js with TypeScript**: Provides type safety while maintaining familiar Node.js patterns
- **File-based Route Organization**: Routes are organized in a single routes.ts file with clear separation by entity type
- **Middleware Pattern**: Uses Express middleware for authentication, logging, and error handling
- **Storage Abstraction**: Implements a storage interface pattern that abstracts database operations, making the system testable and database-agnostic

**API Structure:**
- RESTful endpoints organized by resource (children, chores, rewards, etc.)
- Consistent error handling and response formats
- Request validation using Zod schemas
- Authentication middleware protecting all data endpoints

## Data Storage Solutions

The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database interactions.

**Database Design:**
- **Relational Schema**: Uses foreign key relationships to maintain data integrity between users, children, chores, and rewards
- **UUID Primary Keys**: Ensures scalability and avoids potential security issues with sequential IDs
- **Audit Fields**: Includes created_at and updated_at timestamps for tracking
- **Session Storage**: Uses PostgreSQL for session persistence, required for Replit Auth integration

**Key Tables:**
- `users`: Parent accounts with profile information
- `children`: Child profiles linked to parents
- `chore_templates`: Reusable chore definitions created by parents
- `assigned_chores`: Individual chore instances assigned to children
- `rewards`: Reward definitions that children can work toward
- `earned_badges`: Achievement tracking system

## Authentication and Authorization

The system uses Replit's OpenID Connect (OIDC) authentication service with Passport.js for session management.

**Authentication Flow:**
- OIDC discovery for automatic configuration
- Passport.js middleware for authentication handling
- PostgreSQL-backed session storage for persistence
- Role-based access control (parents can only access their own children's data)

**Security Measures:**
- Session-based authentication with secure cookies
- CSRF protection through same-site cookie settings
- Request validation and sanitization
- Parent-child relationship verification on all child-related operations

# External Dependencies

## Third-Party Services

**Replit Authentication Service:**
- OpenID Connect provider for user authentication
- Handles user registration and login flows
- Provides user profile information and session management

## Database Services

**Neon Database (PostgreSQL):**
- Serverless PostgreSQL hosting
- Connection pooling for efficient database access
- Automatic backups and scaling

## Development and Build Tools

**Frontend Build Tools:**
- Vite for development server and production builds
- PostCSS and Autoprefixer for CSS processing
- TypeScript compiler for type checking

**Backend Runtime:**
- Node.js with ESM module support
- tsx for TypeScript execution in development
- esbuild for production bundling

## UI and Styling Libraries

**Component Libraries:**
- Radix UI for accessible component primitives
- shadcn/ui for pre-built component implementations
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography

**Form and Validation:**
- React Hook Form for form state management
- Zod for runtime type validation and schema definition
- Hookform resolvers for integration between form library and validation

## Database and ORM

**Drizzle ORM:**
- Type-safe database queries and schema definition
- Migration system for database versioning
- PostgreSQL dialect support

**Database Drivers:**
- @neondatabase/serverless for optimized PostgreSQL connections
- WebSocket support for real-time capabilities

# Recent Changes

**September 26, 2025:**
- **COMPLETED: Switchboard Layout Implementation** - Successfully implemented architect-recommended "switchboard" layout using CSS Grid with explicit track sizes
- Both dashboards now fit within 720px viewport without page scrolling (core requirement achieved)
- **Layout Details:**
  - Child dashboard: 4-row grid (64px header + 32px goal bar + flexible quests + 120px rewards/badges)
  - Parent dashboard: 3-row grid (64px KPI header + 48px action buttons + flexible micro-panels)
  - Uses h-[calc(100dvh-143px)] to account for sticky header and ensure perfect viewport fit
  - Internal scrolling only in content areas (no page-level scrolling)
- All key functionality visible in one view without scrolling requirement **ACHIEVED**
- Created custom Chore Buster logo with golden trophy design and integrated across app
- Confirmed Get Started button functionality and authentication flow

**September 29, 2025:**
- **COMPLETED: Universal Chat System Implementation** - Successfully implemented AI-powered chat agent for both parent and child users
- **Database Schema:**
  - Created `app_messages` table with polymorphic design (partyType, partyId) to support both parent and child conversations
  - Supports message history persistence with role (user/agent), type (chat/suggestion), and timestamp tracking
- **AI Service Enhancement:**
  - Extended AI service with `chatWithParent` method providing family status context, children's progress insights, and household management guidance
  - Maintains existing `chatWithAgent` for child conversations with encouragement and coaching functionality
- **Backend Implementation:**
  - Universal WebSocket handler supporting both parent and child authentication and message routing
  - REST endpoint for chat history retrieval: GET /api/app-chat/history?partyType={parent|child}&partyId={id}
  - Session-based WebSocket authentication with party context stored in WebSocket connection
- **Frontend Component:**
  - Created `UniversalChatWidget` component with party-type awareness (parent/child modes)
  - Positioned in bottom-right corner with toggle button, always-available design pattern
  - Real-time messaging with WebSocket connection status indicator
  - Integrated into both parent and child dashboards with appropriate context passing
- **End-to-End Testing:**
  - Verified parent chat functionality: family status queries, progress tracking, AI-powered suggestions
  - Verified child chat functionality: daily guidance, encouragement, task recommendations
  - Confirmed WebSocket authentication, message persistence, and chat history retrieval for both modes
- **Architecture Notes:**
  - Legacy child chat modal remains alongside new widget (can be consolidated in future refactor)
  - WebSocket security improvements noted for future enhancement (token-based auth vs session)

**September 30, 2025:**
- **COMPLETED: Parent Dashboard 4-Column Vertical Layout Redesign** - Transformed parent dashboard from scrollable panels to multi-column layout
- **Design Changes:**
  - Removed left navigation index with scroll-to-section links
  - Implemented 4-column grid layout with panels running vertically side-by-side
  - Column 1: Family Members - List view with brief summaries, click opens detailed modal
  - Column 2: Chores & Tasks - Template list with suggestion button at bottom
  - Column 3: Learning - Learning goals with content generation and suggestion button at bottom
  - Column 4: Exercise - Exercise tasks with suggestion button at bottom
  - Each panel has internal scrolling with scrollbar-hide utility
  - Top action bar with Add Child, Add Chore, Add Reward, and Review Approvals buttons
- **User Experience:**
  - All content categories visible at once in single viewport
  - Direct access to all features without scrolling or navigation clicks
  - Family member cards clickable to view detailed stats (level, XP, points, badges)
  - AI suggestion buttons positioned at bottom of each panel for easy access

- **COMPLETED: Auto-Generated Suggestions with Drag-and-Drop Assignment** - Implemented intelligent suggestion system with intuitive task assignment
- **Feature Implementation:**
  - Created `AutoSuggestions` component that auto-generates 3 AI suggestions per category on mount
  - Auto-generation triggers when no suggestions exist for a child, using useEffect with one-time guard
  - Generates suggestions for 3 categories: tasks (household chores), learning goals, and exercise activities
  - Quick add + buttons added to all panel headers for rapid item creation
- **Drag-and-Drop Interface:**
  - Suggestion tiles are draggable with visible grip handles (GripVertical icon)
  - Family member cards serve as drop targets with visual feedback
  - HTML5 drag API implementation with proper data transfer and preventDefault
  - Dragging suggestion to child card triggers instant assignment with toast confirmation
- **Backend Enhancement:**
  - Created POST /api/ai/suggestions/:id/assign endpoint for secure task assignment
  - Dual ownership verification: validates both original child and target child belong to authenticated parent
  - Materializes suggestions into actual chore templates or learning goals upon assignment
  - Returns appropriate error codes (400, 403, 404, 500) for various failure scenarios
- **Security & Performance:**
  - Fixed critical security vulnerability: endpoint now verifies suggestion's original child ownership
  - Added setTimeout cleanup in useEffect to prevent memory leaks on component unmount
  - Proper cache invalidation after assignment to update UI across all affected queries
- **End-to-End Testing:**
  - Verified auto-generation creates 3 suggestions per category on dashboard load
  - Confirmed drag-and-drop flow: grab suggestion tile, drop on family member card, task assigned
  - Validated backend security checks prevent cross-family task assignment
  - Toast notifications and UI updates confirmed working correctly