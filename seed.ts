import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if we have existing data first
  const existingSchoolSystem = await prisma.schoolSystem.findFirst({
    where: { name: 'San Diego Community College District' },
  });

  // Create a sample school system if it doesn't exist
  const schoolSystem = existingSchoolSystem || await prisma.schoolSystem.create({
    data: {
      name: 'San Diego Community College District',
      subdomain: 'sdccd',
      settings: {
        attendanceGracePeriod: 30,
        defaultClassDuration: 90,
        minimumAttendancePercentage: 70,
      },
    },
  });

  console.log(existingSchoolSystem ? '✅ Using existing school system:' : '✅ Created school system:', schoolSystem.name);

  // Check if school exists
  const existingSchool = await prisma.school.findFirst({
    where: { 
      name: 'San Diego Miramar College',
      schoolSystemId: schoolSystem.id
    },
  });

  // Create a sample school if it doesn't exist
  const school = existingSchool || await prisma.school.create({
    data: {
      name: 'San Diego Miramar College',
      address: '10440 Black Mountain Road, San Diego, CA 92126',
      schoolSystemId: schoolSystem.id,
    },
  });

  console.log(existingSchool ? '✅ Using existing school:' : '✅ Created school:', school.name);

  // Check if semester exists
  const existingSemester = await prisma.semester.findFirst({
    where: { 
      name: 'Spring 2026',
      schoolSystemId: schoolSystem.id
    },
  });

  // Create a sample semester if it doesn't exist
  const semester = existingSemester || await prisma.semester.create({
    data: {
      name: 'Spring 2026',
      startDate: '2026-01-19T00:00:00.000Z',
      endDate: '2026-05-15T00:00:00.000Z',
      midtermStartDate: '2026-03-02T00:00:00.000Z',
      midtermEndDate: '2026-03-06T00:00:00.000Z',
      finalStartDate: '2026-05-04T00:00:00.000Z',
      finalEndDate: '2026-05-15T00:00:00.000Z',
      schoolSystemId: schoolSystem.id,
    },
  });

  console.log(existingSemester ? '✅ Using existing semester:' : '✅ Created semester:', semester.name);

  // Check if we already have holidays for this semester
  const existingHolidays = await prisma.holiday.findMany({
    where: { semesterId: semester.id }
  });

  // Only create holidays if none exist
  if (existingHolidays.length === 0) {
    // Create spring holidays and break
    const holidays = await prisma.holiday.createMany({
      data: [
        {
          name: 'Martin Luther King Jr. Day',
          date: '2026-01-19T00:00:00.000Z',
          semesterId: semester.id,
        },
      {
        name: 'Presidents Day',
        date: '2026-02-16T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Spring Break Monday',
        date: '2026-03-16T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Spring Break Tuesday',
        date: '2026-03-17T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Spring Break Wednesday',
        date: '2026-03-18T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Spring Break Thursday',
        date: '2026-03-19T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Spring Break Friday',
        date: '2026-03-20T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Good Friday',
        date: '2026-04-03T00:00:00.000Z',
        semesterId: semester.id,
      },
      {
        name: 'Memorial Day',
        date: '2026-05-25T00:00:00.000Z',
        semesterId: semester.id,
      },
    ],
  });

    console.log('✅ Created holidays');
  } else {
    console.log('✅ Using existing holidays');
  }

  // Check for existing courses
  const existingCourse1 = await prisma.course.findFirst({
    where: { 
      code: 'AUTO-101',
      schoolSystemId: schoolSystem.id
    },
  });

  const existingCourse2 = await prisma.course.findFirst({
    where: { 
      code: 'AUTO-302',
      schoolSystemId: schoolSystem.id
    },
  });

  // Create sample courses if they don't exist
  const course1 = existingCourse1 || await prisma.course.create({
    data: {
      code: 'AUTO-101',
      name: 'Introduction to Automotive Technology',
      description: 'Fundamentals of automotive systems and basic repair techniques.',
      prerequisites: 'None',
      schoolSystemId: schoolSystem.id,
    },
  });

  const course2 = existingCourse2 || await prisma.course.create({
    data: {
      code: 'AUTO-302',
      name: 'Transmission Repair',
      description: 'Advanced transmission diagnosis and repair procedures.',
      prerequisites: 'AUTO-101, AUTO-201',
      schoolSystemId: schoolSystem.id,
    },
  });

  console.log(existingCourse1 && existingCourse2 ? '✅ Using existing courses' : '✅ Created courses:', course1.code, course2.code);

  // Check for existing superAdmin users
  const existingRyan = await prisma.user.findFirst({
    where: { email: 'rmonroy@sdccd.edu' },
  });

  const existingRich = await prisma.user.findFirst({
    where: { email: 'rich@comfypants.org' },
  });

  // Create superAdmin users if they don't exist
  const ryan = existingRyan || await prisma.user.create({
    data: {
      email: 'rmonroy@sdccd.edu',
      password: 'temppass123',
      firstName: 'Ryan',
      lastName: 'Monroy',
      roles: 'superAdmin',
      schoolSystemId: schoolSystem.id,
    },
  });

  const rich = existingRich || await prisma.user.create({
    data: {
      email: 'rich@comfypants.org',
      password: 'temppass123',
      firstName: 'Rich',
      lastName: 'Goldman',
      roles: 'superAdmin',
      schoolSystemId: schoolSystem.id,
    },
  });

  console.log(existingRyan && existingRich ? '✅ Using existing superAdmin users' : '✅ Created superAdmin users:', ryan.email, rich.email);

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Visit http://localhost:3030');
  console.log('3. Create your first admin user when prompted');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });