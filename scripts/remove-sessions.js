const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting removal of existing class sessions...\n');

    // Get count of existing sessions
    const sessionCount = await prisma.classSession.count();
    console.log(`Found ${sessionCount} existing sessions\n`);

    if (sessionCount === 0) {
      console.log('No sessions to remove.');
      return;
    }

    // Confirm deletion
    console.log('⚠️  This will permanently delete all existing class sessions.');
    console.log('🔄 Proceeding with deletion...\n');

    // Delete all sessions
    const result = await prisma.classSession.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} sessions\n`);
    console.log('✨ You can now run the generate-sessions script to recreate them with the dayOfWeek field.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();