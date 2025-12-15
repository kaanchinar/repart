# RePart Project Instructions

## Project Overview
RePart is a circular electronics marketplace for Azerbaijan, built with Next.js 15, Better-Auth, and PostgreSQL.

## Tech Stack
- **Frontend:** Next.js 15 (App Router, TypeScript)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (via Docker)
- **ORM:** Drizzle ORM
- **Auth:** Better-Auth
- **Styling:** Tailwind CSS

## Setup
1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgres://postgres:password@localhost:5432/repart"
   BETTER_AUTH_SECRET="your_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

3. **Database Setup:**
   Start the database using Docker:
   ```bash
   docker-compose up -d
   ```
   
   Generate and apply migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Run Development Server:**
   ```bash
   pnpm dev
   ```

## Key Features Implementation Status
- [x] Project Scaffolding (Next.js)
- [x] Database Schema (Drizzle)
- [x] Auth Setup (Better-Auth)
- [ ] Sell Wizard
- [ ] Marketplace Feed
- [ ] Orders & Escrow Logic
