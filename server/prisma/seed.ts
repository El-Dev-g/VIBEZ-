import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vibez.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      role: 'SUPERADMIN',
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ Admin account created/updated successfully:');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${admin.password}`);
  console.log(`   Role:     ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
