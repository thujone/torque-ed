import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import { generateClassSessions } from '../lib/generateClassSessions';
import * as PrismaModule from '.prisma/client';

async function generateSessionsForExistingClasses() {
  // Create a Keystone context
  const context = getContext(config, PrismaModule);

  try {
    console.log('Starting session generation for existing classes...\n');

    // Get all classes that have a semester and schedule
    const classes = await context.query.Class.findMany({
      query: `
        id
        section
        course {
          code
          name
        }
        semester {
          name
        }
        schedule
        sessions {
          id
        }
      `
    });

    console.log(`Found ${classes.length} classes\n`);

    for (const classItem of classes) {
      // Skip if class already has sessions
      if (classItem.sessions && classItem.sessions.length > 0) {
        console.log(`⏭️  Skipping ${classItem.course.code} - ${classItem.section} (already has ${classItem.sessions.length} sessions)`);
        continue;
      }

      // Skip if no schedule
      if (!classItem.schedule) {
        console.log(`⚠️  Skipping ${classItem.course.code} - ${classItem.section} (no schedule defined)`);
        continue;
      }

      // Skip if no semester
      if (!classItem.semester) {
        console.log(`⚠️  Skipping ${classItem.course.code} - ${classItem.section} (no semester assigned)`);
        continue;
      }

      console.log(`🔄 Generating sessions for ${classItem.course.code} - ${classItem.section} (${classItem.semester.name})...`);
      
      try {
        await generateClassSessions(context, classItem.id);
        
        // Get the count of generated sessions
        const updatedClass = await context.query.Class.findOne({
          where: { id: classItem.id },
          query: `sessions { id }`
        });
        
        console.log(`✅ Generated ${updatedClass.sessions.length} sessions\n`);
      } catch (error) {
        console.error(`❌ Error generating sessions for ${classItem.course.code} - ${classItem.section}:`, error);
        console.log('');
      }
    }

    console.log('\n✨ Session generation complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from the database
    await context.prisma.$disconnect();
  }
}

// Run the script
generateSessionsForExistingClasses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });