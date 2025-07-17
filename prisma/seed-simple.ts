import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const users = [
      {
        email: 'superadmin@kajentraders.com',
        name: 'Super Admin',
        password: await bcrypt.hash('superadmin123', 10),
        role: 'super_admin',
        country: 'India',
        whiteLabel: 'default',
        status: 'active',
        emailVerified: new Date(),
      },
      {
        email: 'admin.sg@kajentraders.com',
        name: 'Singapore Admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        country: 'Singapore',
        whiteLabel: 'default',
        status: 'active',
        emailVerified: new Date(),
      },
      {
        email: 'admin.my@kajentraders.com',
        name: 'Malaysia Admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        country: 'Malaysia',
        whiteLabel: 'default',
        status: 'active',
        emailVerified: new Date(),
      },
      {
        email: 'test.user@example.com',
        name: 'Test User',
        password: await bcrypt.hash('test123', 10),
        role: 'user',
        country: 'India',
        whiteLabel: 'default',
        status: 'active',
        emailVerified: new Date(),
      },
      {
        email: 'user.sg@example.com',
        name: 'Singapore User',
        password: await bcrypt.hash('user123', 10),
        role: 'user',
        country: 'Singapore',
        whiteLabel: 'default',
        status: 'active',
        emailVerified: new Date(),
      },
    ];

    const createdUsers = [];

    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData,
      });
      createdUsers.push(user);
      console.log(`✓ Created user: ${user.email} (${user.role})`);
    }

    console.log(`\n🎉 Database seeding completed successfully!`);
    console.log(`Created ${createdUsers.length} users`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`Super Admin: superadmin@kajentraders.com / superadmin123`);
    console.log(`Admin (SG): admin.sg@kajentraders.com / admin123`);
    console.log(`Admin (MY): admin.my@kajentraders.com / admin123`);
    console.log(`Test User: test.user@example.com / test123`);
    console.log(`User (SG): user.sg@example.com / user123`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
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
