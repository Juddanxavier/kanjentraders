# Database Setup Guide

This guide covers how to set up and work with the PostgreSQL database for this project.

## Current Database Configuration

**Database Provider:** PostgreSQL (Neon)  
**Connection String:** `postgresql://webside_owner:yqPz7nSsH3YU@ep-round-glade-a1cm9zkc-pooler.ap-southeast-1.aws.neon.tech/webside?sslmode=require&channel_binding=require`

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The database URL is already configured in `.env.local`:
```env
DATABASE_URL=postgresql://webside_owner:yqPz7nSsH3YU@ep-round-glade-a1cm9zkc-pooler.ap-southeast-1.aws.neon.tech/webside?sslmode=require&channel_binding=require
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Push Schema to Database
```bash
npm run db:push
```

### 5. Seed Admin Users
```bash
npm run db:seed-admin
```

## Available Scripts

### Database Management
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (GUI)
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database (force push)

### Seeding
- `npm run db:seed` - Run all seed scripts
- `npm run db:seed-admin` - Seed admin users only

## Database Schema

### Core Models
- **User** - User accounts with roles (user, admin, super_admin)
- **Session** - Better-auth session management
- **Account** - OAuth/credential accounts
- **Verification** - Email/phone verification tokens

### Business Models
- **Lead** - Lead management
- **Shipment** - Shipment tracking
- **Notification** - User notifications

### Enums
- **LeadStatus** - NEW, CONTACTED, SHIPPED, FAILED
- **ShipmentStatus** - PENDING, IN_TRANSIT, DELIVERED, etc.
- **NotificationType** - Various notification types

## Admin Users

### Super Admin
- **Email:** `superadmin@kajentraders.com`
- **Role:** `super_admin`
- **Access:** All admin features

### Regional Admins
- **SG:** `admin.sg@kajentraders.com`
- **MY:** `admin.my@kajentraders.com`
- **TH:** `admin.th@kajentraders.com`
- **PH:** `admin.ph@kajentraders.com`
- **ID:** `admin.id@kajentraders.com`
- **VN:** `admin.vn@kajentraders.com`

All regional admins have `admin` role with country-specific access.

## Database Connection

The application uses:
- **Prisma** as ORM
- **PostgreSQL** as database
- **Neon** as cloud provider
- **Connection pooling** enabled
- **SSL** required

## Security Features

- Row-level security patterns
- Encrypted sensitive data
- Audit logging
- Session management
- Role-based access control

## Troubleshooting

### Connection Issues
1. Check if DATABASE_URL is correctly set
2. Verify network connectivity
3. Check SSL certificates

### Schema Issues
1. Run `npm run db:generate` to regenerate client
2. Use `npm run db:push` to sync schema
3. Check Prisma logs for errors

### Migration Issues
1. Use `npm run db:reset` to force reset (development only)
2. Check migration history
3. Verify schema compatibility

## Development Workflow

1. **Schema Changes:** Update `prisma/schema.prisma`
2. **Push Changes:** Run `npm run db:push`
3. **Generate Client:** Run `npm run db:generate`
4. **Test:** Use `npm run db:studio` to verify changes
5. **Seed Data:** Run `npm run db:seed-admin` if needed

## Production Considerations

- Use proper migrations instead of `db:push`
- Set up backup strategies
- Monitor connection pooling
- Configure logging
- Set up monitoring and alerts

## Support

For database-related issues:
1. Check logs in Neon dashboard
2. Verify connection string
3. Check Prisma client generation
4. Review schema compatibility
