/** @format */

import { PrismaClient } from '../src/generated/prisma';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string) {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

// Sample data
const countries = ['SG', 'MY', 'TH', 'PH', 'ID', 'VN'];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia',
  'Robert', 'Sophia', 'William', 'Isabella', 'Richard', 'Mia', 'Joseph',
  'Charlotte', 'Thomas', 'Amelia', 'Christopher', 'Harper'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

// Generate random phone number
function generatePhoneNumber(countryCode: string): string {
  const countryPhonePrefixes: Record<string, string> = {
    'SG': '+65',
    'MY': '+60',
    'TH': '+66',
    'PH': '+63',
    'ID': '+62',
    'VN': '+84'
  };
  
  const prefix = countryPhonePrefixes[countryCode] || '+65';
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${number}`;
}

// Generate random user data
function generateUserData(index: number, role: string, country: string) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
  
  return {
    email,
    name,
    role,
    country,
    phoneNumber: generatePhoneNumber(country),
    phoneNumberVerified: Math.random() > 0.5,
    emailVerified: Math.random() > 0.3,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  };
}

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // Create super admin
    console.log('👑 Creating super admin...');
    const superAdminPassword = await hashPassword('superadmin123');
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@kajentraders.com',
        name: 'Super Admin',
        role: 'super_admin',
        country: 'SG',
        emailVerified: true,
        phoneNumber: '+6590123456',
        phoneNumberVerified: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
        accounts: {
          create: {
            id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId: 'superadmin@kajentraders.com',
            providerId: 'credential',
            password: superAdminPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });

    // Create country admins (one for each country)
    console.log('👤 Creating country admins...');
    for (const country of countries) {
      const adminPassword = await hashPassword('admin123');
      const admin = await prisma.user.create({
        data: {
          email: `admin.${country.toLowerCase()}@kajentraders.com`,
          name: `${country} Admin`,
          role: 'admin',
          country,
          emailVerified: true,
          phoneNumber: generatePhoneNumber(country),
          phoneNumberVerified: true,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin-${country}`,
          accounts: {
            create: {
              id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              accountId: `admin.${country.toLowerCase()}@kajentraders.com`,
              providerId: 'credential',
              password: adminPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      });
      console.log(`  ✓ Created admin for ${country}: ${admin.email}`);
    }

    // Create regular users (10-15 per country)
    console.log('👥 Creating regular users...');
    let userIndex = 1;
    
    for (const country of countries) {
      const userCount = Math.floor(Math.random() * 6) + 10; // 10-15 users per country
      
      for (let i = 0; i < userCount; i++) {
        const userData = generateUserData(userIndex++, 'user', country);
        const userPassword = await hashPassword('user123');
        
        // Some users might be banned
        const isBanned = Math.random() > 0.95; // 5% chance of being banned
        
        const user = await prisma.user.create({
          data: {
            ...userData,
            banned: isBanned,
            banReason: isBanned ? 'Violation of terms of service' : null,
            banExpires: isBanned ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from now
            accounts: {
              create: {
                id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${userIndex}`,
                accountId: userData.email,
                providerId: 'credential',
                password: userPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          },
        });
        
        // Create sessions for some users (simulating active users)
        if (Math.random() > 0.4 && !isBanned) { // 60% chance of having active sessions
          const sessionCount = Math.floor(Math.random() * 3) + 1; // 1-3 sessions
          
          for (let s = 0; s < sessionCount; s++) {
            await prisma.session.create({
              data: {
                id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${s}`,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                token: `session-${user.id}-${s}-${Date.now()}`,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
                updatedAt: new Date(),
                ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: s === 0 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' : 
                          s === 1 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' :
                                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                userId: user.id,
              },
            });
          }
        }
      }
      
      console.log(`  ✓ Created ${userCount} users for ${country}`);
    }

    // Create some test users with known credentials
    console.log('🧪 Creating test users...');
    const testUsers = [
      { email: 'test.user@example.com', name: 'Test User', role: 'user', country: 'SG' },
      { email: 'test.admin@example.com', name: 'Test Admin', role: 'admin', country: 'MY' },
      { email: 'banned.user@example.com', name: 'Banned User', role: 'user', country: 'TH', banned: true },
    ];

    for (const testUser of testUsers) {
      const password = await hashPassword('test123');
      await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          role: testUser.role as any,
          country: testUser.country,
          emailVerified: true,
          phoneNumber: generatePhoneNumber(testUser.country),
          phoneNumberVerified: false,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testUser.email}`,
          banned: testUser.banned || false,
          banReason: testUser.banned ? 'Test ban for demo purposes' : null,
          accounts: {
            create: {
              id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              accountId: testUser.email,
              providerId: 'credential',
              password: password,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      });
      console.log(`  ✓ Created test user: ${testUser.email}`);
    }

    // Get final counts
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    const superAdminCount = await prisma.user.count({ where: { role: 'super_admin' } });
    const sessionCount = await prisma.session.count();

    console.log('\n✅ Seed completed successfully!');
    console.log(`📊 Database statistics:`);
    console.log(`  - Total users: ${userCount}`);
    console.log(`  - Super admins: ${superAdminCount}`);
    console.log(`  - Country admins: ${adminCount}`);
    console.log(`  - Regular users: ${userCount - adminCount - superAdminCount}`);
    console.log(`  - Active sessions: ${sessionCount}`);
    console.log('\n🔑 Login credentials:');
    console.log('  Super Admin: superadmin@kajentraders.com / superadmin123');
    console.log('  Country Admins: admin.{country}@kajentraders.com / admin123');
    console.log('    (e.g., admin.sg@kajentraders.com, admin.my@kajentraders.com)');
    console.log('  Test Users:');
    console.log('    - test.user@example.com / test123');
    console.log('    - test.admin@example.com / test123');
    console.log('    - banned.user@example.com / test123');
    console.log('  Regular Users: {firstname}.{lastname}{number}@example.com / user123');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
