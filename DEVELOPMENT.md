# Development Setup Guide

## Quick Start (No Database)

For development without setting up a database, the application will run with fallback configurations:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

The application will start at `http://localhost:3000` with the following defaults:
- Authentication will use development secrets
- Database operations will be mocked/fallback
- All security features remain active

## Full Development Setup (With Database)

### 1. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create a database
createdb parceltracking_dev

# Update .env.local with your database URL
DATABASE_URL=postgresql://username:password@localhost:5432/parceltracking_dev
```

**Option B: Docker PostgreSQL**
```bash
# Run PostgreSQL in Docker
docker run --name parcel-postgres \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev123 \
  -e POSTGRES_DB=parceltracking_dev \
  -p 5432:5432 \
  -d postgres:15

# Update .env.local
DATABASE_URL=postgresql://dev:dev123@localhost:5432/parceltracking_dev
```

**Option C: Cloud Database (Neon, Supabase, etc.)**
```bash
# Create a database on your preferred cloud provider
# Update .env.local with the connection string
DATABASE_URL=your_cloud_database_url
```

### 2. Environment Variables

Update `.env.local` with your configuration:

```bash
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-development-secret-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your_database_url

# Optional
SECURITY_HEADERS_ENABLED=true
LOG_LEVEL=debug
```

### 3. Database Migration

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

### 4. Development Commands

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run security audit
npm run security:audit

# Database studio (visual interface)
npm run db:studio
```

## Environment Variables

### Required for Production
- `BETTER_AUTH_SECRET`: 32+ character secret for signing tokens
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_API_URL`: Your domain URL

### Optional
- `REDIS_URL`: For production rate limiting
- `SMTP_*`: For email notifications
- `LOG_LEVEL`: debug, info, warn, error
- `SECURITY_HEADERS_ENABLED`: Enable/disable security headers

## Troubleshooting

### Database Connection Issues
1. Check if PostgreSQL is running
2. Verify connection string format
3. Ensure database exists
4. Check firewall/network settings

### Environment Variable Issues
1. Restart development server after changes
2. Check `.env.local` syntax
3. Ensure no extra spaces or quotes

### Authentication Issues
1. Clear browser cookies/storage
2. Check auth secret length (32+ chars)
3. Verify database schema is up to date

### Edge Runtime Errors
1. Restart development server
2. Clear `.next` cache: `npm run clean && npm run dev`
3. Check for Node.js API usage in middleware

## Security Notes

- Never commit `.env.local` or `.env` with real credentials
- Use strong secrets in production (32+ characters)
- Enable HTTPS in production
- Set up proper CORS for production
- Configure rate limiting with Redis in production

## Production Deployment

See `SECURITY.md` for complete production deployment checklist.
