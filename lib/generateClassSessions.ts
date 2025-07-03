import { KeystoneContext } from '@keystone-6/core/types';

interface ClassData {
  id: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  course?: {
    code: string;
  };
  semester?: {
    id: string;
    startDate: string;
    endDate: string;
    midtermStartDate?: string;
    midtermEndDate?: string;
    finalStartDate?: string;
    finalEndDate?: string;
    holidays?: Array<{
      date: string;
    }>;
  };
}

export async function generateClassSessions(
  context: KeystoneContext,
  classId: string
) {
  // Fetch class with semester and holiday data
  const classData = await context.query.Class.findOne({
    where: { id: classId },
    query: `
      id
      schedule
      course {
        code
      }
      semester {
        id
        startDate
        endDate
        midtermStartDate
        midtermEndDate
        finalStartDate
        finalEndDate
        holidays {
          date
        }
      }
    `
  }) as ClassData;

  if (!classData?.semester || !classData?.schedule) {
    console.error('Class or semester data not found');
    return;
  }

  const { schedule, semester } = classData;
  const { days, startTime, endTime } = schedule;
  
  // Convert day letters to day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
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
    semester.holidays?.map(h => h.date.split('T')[0]) || []
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
        class: { connect: { id: classId } },
        scheduledDate: dateStr,
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
    await context.db.ClassSession.createMany({
      data: sessions,
    });
    
    console.log(`Generated ${sessions.length} sessions for class ${classId}`);
  }
}