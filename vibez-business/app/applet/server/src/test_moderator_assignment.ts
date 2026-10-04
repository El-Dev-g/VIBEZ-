
import { PrismaClient } from '@prisma/client';
import { emailService } from '../../../../server/src/lib/email';

const prisma = new PrismaClient();

async function testAssignment() {
  const email = 'prigidwebcloud@gmail.com';
  const role = 'MODERATOR';
  
  console.log(`Starting test for ${email} as ${role}...`);

  try {
    // 1. Find or create the user
    let user = await prisma.user.findFirst({
      where: { googleEmail: email }
    });

    if (!user) {
      console.log('User not found, creating test user...');
      user = await prisma.user.create({
        data: {
          googleEmail: email,
          phoneNumber: '+10000000000',
          name: 'Test Moderator'
        }
      });
    }

    console.log(`User found/created: ${user.id}`);

    // 2. Update role (Simulating the AdminController logic)
    // In VIBEZ, the Admin model is separate or roles are on the User model?
    // Let's check the schema again.
    // Looking at AdminController.ts earlier, it used prisma.admin.update for admin roles.
    
    const admin = await prisma.admin.findUnique({
      where: { email: email }
    });

    if (admin) {
      await prisma.admin.update({
        where: { email: email },
        data: { role: 'MODERATOR' }
      });
      console.log('Admin record updated to MODERATOR.');
    } else {
      await prisma.admin.create({
        data: {
          email: email,
          role: 'MODERATOR',
          name: 'Test Moderator'
        }
      });
      console.log('Admin record created as MODERATOR.');
    }

    // 3. Send Notification
    console.log('Sending notification...');
    const result = await emailService.sendRoleAssignmentNotification(
      email,
      'MODERATOR',
      'VIBEZ System'
    );

    if (result.success) {
      console.log('SUCCESS: Notification sent successfully.');
    } else {
      console.log(`FAILURE: Notification failed: ${result.error}`);
    }

  } catch (error) {
    console.error('TEST ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignment();
