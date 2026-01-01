# THE TROUBLESOME TWO - Movie Sync Application

## Overview

A real-time movie synchronization application that allows two users to watch movies together remotely. The app features a "classified/spy" themed interface with synchronized video playback, voice chat, screen sharing, and live messaging. Built for a specific use case of family members watching movies together across different locations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and dev server.

**Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style). The app uses a custom dark theme with emerald/green "matrix" colors to match the spy aesthetic.

**State Management**: 
- TanStack React Query for server state
- Local React state with useState/useEffect for UI state
- Socket.io client for real-time synchronization

**Routing**: Wouter (lightweight React router) with three main routes:
- `/` - Home page with room creation/joining
- `/room/:id` - Video sync room
- `/lists` - Movie watchlist management

**Key UI Patterns**:
- Framer Motion for animations
- Mobile-responsive design with Sheet components for mobile chat
- Custom loading screens with themed animations

### Backend Architecture

**Server**: Express.js with TypeScript running on Node.js. Single entry point at `server/index.ts`.

**Real-time Communication**: Socket.io handles all live features:
- Room joining/leaving
- Video playback synchronization (play, pause, seek)
- Chat messages with typing indicators
- Voice chat signaling (WebRTC)
- Screen sharing signaling (WebRTC)

**API Structure**: RESTful endpoints under `/api/` prefix:
- `/api/watch-history` - CRUD for watch history
- `/api/movie-list/:listType` - Movie list management (favorites, to-watch)

**Room State**: In-memory Map storing room data (users, video URL, playback state, current time). Note: This is not persistent - rooms reset on server restart.

### Data Storage

**Database**: PostgreSQL with Drizzle ORM. Schema defined in `shared/schema.ts`.

**Tables**:
- `users` - Basic user accounts (id, username, password)
- `watch_history` - Movies watched together with ratings
- `movie_list` - Saved movies by list type (favorites, to-watch)

**Database Push**: Use `npm run db:push` to apply schema changes.

### WebRTC Implementation

Voice chat and screen sharing use WebRTC with:
- STUN servers from Google for NAT traversal
- Socket.io as the signaling server
- Peer connections created per user for voice, single connection for screen share

## External Dependencies

### Third-Party Services

**Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)

**WebRTC STUN Servers**: 
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

### Key NPM Packages

- `socket.io` / `socket.io-client` - Real-time bidirectional communication
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations
- `wouter` - Client-side routing
- `@radix-ui/*` - Accessible UI primitives (via shadcn/ui)

### Build & Development

- Vite for frontend bundling with HMR
- esbuild for server bundling in production
- TypeScript with strict mode
- Path aliases: `@/` for client source, `@shared/` for shared code

## Features

### Quick Features
- **Sound notifications** - Plays notification sound when partner sends message
- **Typing indicator** - Shows when partner is typing in chat
- **Emoji reactions** - Quick emoji reactions for messages (heart, thumbs up, laugh)

### Movie Management
- **Watch History** - Automatically tracks movies watched together with ratings
- **To Watch List** - Shared list of movies to watch next
- **Favorites List** - Collection of favorite movies and shows

### Themes
Six movie-themed color schemes available:
- Stranger Things (default green)
- The Matrix (digital green)
- Star Wars (blue & gold)
- Marvel Noir (red cinematic)
- Ocean Deep (calm blue)
- Sunset Cinema (warm orange)

### Security
- API routes protected with username-based authorization
- Only authorized members (Ismael, Aidan) can access movie lists and history
- Username passed via `x-username` header on API requests