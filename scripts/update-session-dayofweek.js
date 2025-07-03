const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Updating existing sessions with dayOfWeek field...\n');

    // Get all sessions without dayOfWeek
    const sessions = await prisma.classSession.findMany({
      where: {
        dayOfWeek: {
          equals: ''
        }
      },
      select: {
        id: true,
        scheduledDate: true
      }
    });

    console.log(`Found ${sessions.length} sessions to update\n`);

    if (sessions.length === 0) {
      console.log('No sessions need updating.');
      return;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let updated = 0;

    for (const session of sessions) {
      const date = new Date(session.scheduledDate);
      const dayOfWeek = days[date.getDay()];
      
      await prisma.classSession.update({
        where: { id: session.id },
        data: { dayOfWeek }
      });
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${sessions.length} sessions...`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} sessions with dayOfWeek field`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();