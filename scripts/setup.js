#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Parcel Tracking Frontend...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local not found. Please create it with the following variables:');
  console.log(`
# Copy from .env.example and fill in your values:
NEXTAUTH_SECRET=your_secret_key_here_minimum_32_characters_required
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
REDIS_URL=redis://localhost:6379  # Optional but recommended for caching
`);
  process.exit(1);
}

// Check for Redis connection
try {
  console.log('🔍 Checking Redis connection...');
  const redis = require('ioredis');
  const client = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  client.on('ready', () => {
    console.log('✅ Redis is running and connected');
    client.disconnect();
  });
  
  client.on('error', (err) => {
    console.log('⚠️  Redis connection failed:', err.message);
    console.log('💡 Redis is optional but recommended for better performance');
    console.log('   You can start Redis with: redis-server');
    client.disconnect();
  });
  
} catch (error) {
  console.log('⚠️  Redis not available (optional):', error.message);
  console.log('💡 Install Redis for better caching performance');
}

// Check database connection
try {
  console.log('🔍 Checking database setup...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database is connected and schema is up to date');
} catch (error) {
  console.log('❌ Database setup failed:', error.message);
  console.log('💡 Make sure your DATABASE_URL is correct in .env.local');
  process.exit(1);
}

// Run database seed if needed
try {
  console.log('🌱 Seeding database...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.log('⚠️  Database seeding failed (might be already seeded)');
}

console.log('\n🎉 Setup complete! You can now run:');
console.log('   npm run dev     - Start development server');
console.log('   npm run build   - Build for production');
console.log('   npm run start   - Start production server');
console.log('\n📊 Admin credentials:');
console.log('   Email: superadmin@kajentraders.com');
console.log('   Password: superadmin123');
