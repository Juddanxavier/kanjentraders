# Prisma Setup

This project uses Prisma as the ORM with PostgreSQL database, integrated with Better Auth for authentication.

## Configuration

- **Database**: PostgreSQL (hosted on Neon)
- **Connection**: Configured via `DATABASE_URL` in `.env`
- **Client Generation**: Custom output to `src/generated/prisma`
- **Authentication**: Better Auth with Prisma adapter

## Available Scripts

```bash
# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Push schema changes to database (for prototyping)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Usage

```typescript
import { prisma } from '@/lib/prisma';

// Example: Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// Example: Find users
const users = await prisma.user.findMany();
```

## Database Schema

The current schema includes Better Auth tables:
- **User** model with authentication fields (id, email, name, emailVerified, image, role, banned, etc.)
- **Session** model for user sessions
- **Account** model for OAuth/provider accounts
- **Verification** model for email verification tokens

## Better Auth Integration

### Regenerating Schema
If you modify the Better Auth configuration, regenerate the Prisma schema:
```bash
npx @better-auth/cli generate --config src/lib/auth/auth.ts
```

### Usage
```typescript
import { authClient } from '@/lib/auth/auth-client';

// Sign in
const { error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: session } = authClient.useSession();
```

## Development Workflow

1. Modify schema in `prisma/schema.prisma` or Better Auth config
2. If Better Auth config changed, run `npx @better-auth/cli generate --config src/lib/auth/auth.ts`
3. Run `npm run db:migrate` to create and apply migration
4. The Prisma client will be automatically regenerated

## Files Structure

```
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration files
src/
├── lib/
│   └── prisma.ts         # Prisma client configuration
└── generated/
    └── prisma/           # Generated Prisma client
```
