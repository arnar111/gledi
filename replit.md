# Gleðinefnd - Social Committee Portal

## Overview

This is a workplace social committee management portal ("Gleðinefnd" is Icelandic for "social committee"). The application helps organize workplace events, track meetings, manage tasks, and maintain committee procedures. It features AI-powered poster generation for events using OpenAI's image generation capabilities.

The stack consists of a React frontend with TypeScript, Express backend, PostgreSQL database with Drizzle ORM, and integrates with OpenAI for AI features like chat and image generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with hot module replacement

The frontend follows a pages-based structure under `client/src/pages/` with three main views:
- Events page (/) - Event management with AI poster generation
- Meetings page (/meetings) - Committee meeting tracking
- Handbook page (/handbook) - Committee procedures and guidelines

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: REST endpoints defined in `server/routes.ts` with Zod validation
- **Shared Types**: Schema and route definitions in `shared/` directory for type safety across client and server

The server uses a storage abstraction pattern (`server/storage.ts`) that wraps database operations, making it easier to mock for testing or swap implementations.

### AI Integrations
Located in `server/replit_integrations/`:
- **Chat**: Conversational AI with conversation history stored in database
- **Image**: AI image generation for event posters using OpenAI's gpt-image-1 model
- **Batch**: Utility for batch processing with rate limiting and retries

### Database Schema
Core tables in `shared/schema.ts`:
- `users` - User accounts
- `events` - Social events with title, date, budget, status, and AI-generated poster URL
- `eventAttendees` - Event RSVP tracking
- `meetings` - Committee meetings with chairperson, secretary, and minutes
- `tasks` - Task assignments
- `conversations` and `messages` - Chat history for AI conversations

### Build Process
- Development: `npm run dev` - runs Vite dev server with Express backend
- Production: `npm run build` - bundles client with Vite, server with esbuild
- Database: `npm run db:push` - pushes schema changes via Drizzle Kit

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for:
  - Chat completions (conversational AI)
  - Image generation (event posters)
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `express-session` with `connect-pg-simple` - Session management
- `zod` - Runtime validation for API inputs
- `drizzle-zod` - Zod schemas generated from Drizzle tables
- Full shadcn/ui component suite (Radix UI primitives)