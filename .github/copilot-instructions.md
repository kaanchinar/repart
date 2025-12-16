# Repart Project Instructions

## Tech Stack & Architecture
- **Framework**: Next.js 16 (App Router) with TypeScript.
- **Database**: PostgreSQL using Drizzle ORM (`src/db/schema.ts`).
- **Auth**: Better-Auth (`src/lib/auth.ts`).
- **Styling**: Tailwind CSS with Lucide React icons.
- **Package Manager**: pnpm.

## Database & Migrations
- **Schema**: Define tables in `src/db/schema.ts`. Use `uuid` for IDs and `text` for foreign keys to `user` table (Better-Auth uses text IDs).
- **Workflow**:
  1. Modify `src/db/schema.ts`.
  2. Run `pnpm db:generate` to create SQL migrations in `drizzle/`.
  3. Run `pnpm db:migrate` to apply changes.
- **Querying**:
  - Server Components: Import `db` from `@/db` and query directly.
  - Client Components: Fetch from API routes (`src/app/api/`) or use Server Actions.

## Authentication Patterns
- **Server-Side**:
  ```typescript
  import { auth } from "@/lib/auth";
  import { headers } from "next/headers";
  const session = await auth.api.getSession({ headers: await headers() });
  ```
- **Client-Side**: Use `authClient` from `@/lib/auth-client`.

## Project Conventions
- **Dynamic Rendering**: Many pages use `export const dynamic = 'force-dynamic';` to ensure fresh data.
- **JSONB Data**: The `faultTree` column in `listings` is JSONB. Ensure proper typing when reading/writing.
- **Currency**: Use `formatAZN` from `@/lib/validators` for price display.
- **Images**: Stored as URL strings in arrays (e.g., `listings.photos`).

## Critical Workflows
- **Build**: `pnpm build` (Checks for type errors and linting).
- **Dev**: `pnpm dev`.
- **Lint**: `pnpm lint`.
