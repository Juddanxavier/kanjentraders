const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin users...');
    
    // Check if super admin exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@kajentraders.com' }
    });
    
    if (!existingSuperAdmin) {
      console.log('Creating super admin user...');
      const superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@kajentraders.com',
          name: 'Super Admin',
          role: 'super_admin',
          emailVerified: true,
          country: 'India',
          banned: false
        }
      });
      console.log('✅ Super admin created:', superAdmin.email);
    } else {
      console.log('✅ Super admin already exists:', existingSuperAdmin.email);
      
      // Ensure role is correct
      if (existingSuperAdmin.role !== 'super_admin') {
        await prisma.user.update({
          where: { id: existingSuperAdmin.id },
          data: { role: 'super_admin' }
        });
        console.log('✅ Super admin role updated');
      }
    }
    
    // Check admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true, email: true, name: true, role: true }
    });
    
    console.log('\n🔐 Admin Users:');
    adminUsers.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.role}) - ${admin.name}`);
    });
    
    console.log('\n🎉 Admin seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
