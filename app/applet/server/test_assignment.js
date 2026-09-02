
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  try {
    const email = 'prigidwebcloud@gmail.com';
    console.log('Checking user:', email);
    
    let user = await prisma.user.findFirst({
      where: { googleEmail: email }
    });
    
    if (user) {
      console.log('User found:', user.id);
    } else {
      console.log('User not found in database.');
    }
    
    // Check Admin record
    const admin = await prisma.admin.findUnique({
      where: { email: email }
    });
    
    if (admin) {
      console.log('Admin record found with role:', admin.role);
    } else {
      console.log('No Admin record found.');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
