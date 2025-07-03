const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateClassSessions(classId) {
  // Fetch class with semester and holiday data
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: true,
      semester: {
        include: {
          holidays: true
        }
      }
    }
  });

  if (!classData?.semester || !classData?.schedule) {
    console.error('Class or semester data not found');
    return 0;
  }

  const { schedule, semester } = classData;
  const { days, startTime, endTime } = schedule;
  
  // Convert day letters to day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'U': 0, // Sunday
    'M': 1, // Monday
    'T': 2, // Tuesday
    'W': 3, // Wednesday
    'R': 4, // Thursday
    'F': 5, // Friday
    'S': 6, // Saturday
  };

  const scheduledDays = days.map(d => dayMap[d]).filter(d => d !== undefined);
  
  // Create a set of holiday dates for quick lookup
  const holidayDates = new Set(
    semester.holidays?.map(h => h.date.toISOString().split('T')[0]) || []
  );

  // Parse dates
  const startDate = new Date(semester.startDate);
  const endDate = new Date(semester.endDate);
  const midtermStart = semester.midtermStartDate ? new Date(semester.midtermStartDate) : null;
  const midtermEnd = semester.midtermEndDate ? new Date(semester.midtermEndDate) : null;
  const finalStart = semester.finalStartDate ? new Date(semester.finalStartDate) : null;
  const finalEnd = semester.finalEndDate ? new Date(semester.finalEndDate) : null;

  const sessions = [];
  const currentDate = new Date(startDate);
  const midtermSessions = [];
  const finalSessions = [];

  // Iterate through each day in the semester
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if this day is scheduled for class and not a holiday
    if (scheduledDays.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      const session = {
        classId: classId,
        scheduledDate: new Date(dateStr),
        dayOfWeek: days[dayOfWeek],
        courseNumber: classData.course?.code || '',
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        sessionType: 'regular',
        status: 'scheduled',
        isMidterm: false,
        isFinal: false,
      };

      // Collect sessions that fall within midterm or final ranges
      if (midtermStart && midtermEnd && currentDate >= midtermStart && currentDate <= midtermEnd) {
        midtermSessions.push(session);
      } else if (finalStart && finalEnd && currentDate >= finalStart && currentDate <= finalEnd) {
        finalSessions.push(session);
      }
      
      sessions.push(session);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Mark only the last session in midterm range as midterm
  if (midtermSessions.length > 0) {
    const lastMidtermSession = midtermSessions[midtermSessions.length - 1];
    lastMidtermSession.sessionType = 'midterm';
    lastMidtermSession.isMidterm = true;
  }

  // Mark only the last session in final range as final
  if (finalSessions.length > 0) {
    const lastFinalSession = finalSessions[finalSessions.length - 1];
    lastFinalSession.sessionType = 'final';
    lastFinalSession.isFinal = true;
  }

  // Create all sessions in the database
  if (sessions.length > 0) {
    await prisma.classSession.createMany({
      data: sessions,
    });
  }
  
  return sessions.length;
}

async function main() {
  try {
    console.log('Starting session generation for existing classes...\n');

    // Get all classes
    const classes = await prisma.class.findMany({
      include: {
        course: true,
        semester: true,
        sessions: true
      }
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
        const count = await generateClassSessions(classItem.id);
        console.log(`✅ Generated ${count} sessions\n`);
      } catch (error) {
        console.error(`❌ Error generating sessions for ${classItem.course.code} - ${classItem.section}:`, error.message);
        console.log('');
      }
    }

    console.log('\n✨ Session generation complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();