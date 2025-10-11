# Overview

Chore Buster is a family chore management application that gamifies household tasks for children and provides parents with organizational tools. It enables parents to assign chores, allowing children to earn points and badges, set reward goals, and track progress through an engaging interface. The project aims to enhance family cooperation and task management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a React-based frontend with TypeScript, built with Vite. It leverages shadcn/ui components (built on Radix UI) and Tailwind CSS for styling. Key design decisions include a dual interface pattern for child and parent modes, a mobile-first approach, and a component-based architecture organized by user role. State management is handled by TanStack Query for server state and React Hook Form with Zod for forms, while Wouter manages client-side routing with protected routes.

## Backend Architecture

The backend is a RESTful API built with Express.js and TypeScript, emphasizing simplicity and maintainability. It uses Express middleware for authentication, logging, and error handling, and implements a storage abstraction layer for database operations. The API features RESTful endpoints organized by resource, consistent error handling, Zod for request validation, and authentication middleware for data protection.

## Data Storage Solutions

PostgreSQL is the primary database, accessed via Drizzle ORM for type-safe interactions. The database design uses a relational schema with foreign key relationships, UUID primary keys, and audit fields. PostgreSQL also stores session data for Replit Auth integration. Key tables include `users`, `children`, `chore_templates`, `assigned_chores`, `rewards`, and `earned_badges`.

## Authentication and Authorization

The system integrates Replit's OpenID Connect (OIDC) service with Passport.js for session management. It uses OIDC for authentication, Passport.js middleware, and PostgreSQL-backed session storage. Role-based access control ensures parents only access their children's data. Security measures include session-based authentication, CSRF protection, request validation, and comprehensive parent-child relationship verification across all child data endpoints to prevent IDOR (Insecure Direct Object Reference) vulnerabilities.

### Authorization Pattern
All child-scoped API endpoints verify parent ownership by checking `req.user.claims.sub === child.parentId` before returning data or performing actions. This pattern is consistently applied across endpoints including:
- Child profile access (GET /api/children/:id)
- Child chores and available tasks
- Child goals and badges
- Task scheduling and self-assignment

## Core Features

- **Dual Dashboards:** Separate, role-specific interfaces for parents and children.
- **AI-Powered Chat:** A universal chat system providing guidance and suggestions for both parents and children, with message history persistence and WebSocket-based real-time communication.
- **Calendar Scheduling:** Children can schedule available tasks on specific dates with time selection through a tabbed interface (Tasks/Calendar views), with friendly empty state messaging when no tasks are available.
- **Dynamic Parent Dashboard:** A 4-column vertical layout for managing family members, chores, learning, and exercise, with internal scrolling for content areas.
- **AI-Generated Suggestions:** Automatic generation of task, learning, and exercise suggestions tailored to children's profiles.
- **Drag-and-Drop Assignment:** Intuitive drag-and-drop functionality for assigning both AI-generated and user-created tasks, learning goals, and exercise activities to children.
- **Child-Specific Settings & AI Personalization:** Settings for each child (goals, interests, reminders) to personalize AI suggestions and task generation.
- **Child Management:** Parents can delete children from both the Settings page and the Family Members panel, with confirmation dialogs to prevent accidental deletions. All related child data (tasks, goals, badges, AI suggestions, etc.) is safely removed through cascading deletions.

# External Dependencies

## Third-Party Services

- **Replit Authentication Service:** OpenID Connect provider for user authentication and session management.

## Database Services

- **Neon Database (PostgreSQL):** Serverless PostgreSQL hosting with connection pooling, automatic backups, and scaling.

## Development and Build Tools

- **Frontend Build Tools:** Vite, PostCSS, Autoprefixer, TypeScript compiler.
- **Backend Runtime:** Node.js with ESM, tsx (development), esbuild (production).

## UI and Styling Libraries

- **Component Libraries:** Radix UI, shadcn/ui, Tailwind CSS, Lucide React.
- **Form and Validation:** React Hook Form, Zod, Hookform resolvers.

## Database and ORM

- **Drizzle ORM:** Type-safe database queries, schema definition, and migration system.
- **Database Drivers:** @neondatabase/serverless for PostgreSQL connections.