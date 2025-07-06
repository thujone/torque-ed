import { KeystoneContext } from '@keystone-6/core/types';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

export async function seedStudents(
  source: any,
  args: any,
  context: KeystoneContext
) {
  // Check if user is a superAdmin
  if (!context.session?.data?.roles?.includes('superAdmin')) {
    throw new Error('Only superAdmins can perform this operation');
  }

  try {
    console.log('Starting student data seeding...');

    // Read and parse the CSV file
    const csvPath = path.join(process.cwd(), 'data', 'sample-student-roster.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} student records in CSV`);

    // Get the default school system and school
    const schoolSystem = await context.query.SchoolSystem.findOne({
      where: { name: 'San Diego Community College District' },
    });

    if (!schoolSystem) {
      throw new Error('Default school system "San Diego Community College District" not found');
    }

    const schools = await context.query.School.findMany({
      where: { 
        name: { equals: 'San Diego Miramar College' },
        schoolSystem: { id: { equals: schoolSystem.id } }
      },
    });

    const school = schools[0];

    if (!school) {
      throw new Error('Default school "San Diego Miramar College" not found');
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Process each student record
    for (const record of records) {
      const studentId = record['Student ID'];
      const fullName = record['Name']; // "Last,First Middle"
      const personalEmail = record['Personal Email'];

      // Parse the name
      const [lastName, firstPart] = fullName.split(',');
      const nameParts = firstPart.trim().split(' ');
      const firstName = nameParts[0];

      // Check if student already exists
      const existingStudent = await context.query.Student.findOne({
        where: { studentId: studentId },
      });

      if (existingStudent) {
        console.log(`Skipping existing student: ${studentId}`);
        skippedCount++;
        continue;
      }

      // Create the student
      try {
        await context.query.Student.createOne({
          data: {
            studentId: studentId,
            firstName: firstName,
            lastName: lastName.trim(),
            email: personalEmail,
            qrCode: uuidv4(),
            schoolSystem: { connect: { id: schoolSystem.id } },
            school: { connect: { id: school.id } },
          },
        });

        console.log(`Created student: ${firstName} ${lastName} (${studentId})`);
        createdCount++;
      } catch (error) {
        console.error(`Failed to create student ${studentId}:`, error);
      }
    }

    console.log(`Student seeding completed!`);
    console.log(`- Created: ${createdCount} students`);
    console.log(`- Skipped: ${skippedCount} existing students`);

    return {
      success: true,
      message: `Successfully created ${createdCount} students (skipped ${skippedCount} existing)`,
      created: createdCount,
      skipped: skippedCount
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error during student seeding:', error);
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}