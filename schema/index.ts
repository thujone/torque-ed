import { list } from '@keystone-6/core';
import { Lists } from '.keystone/types';

// Import all our schema definitions
import { User } from './User';
import { SchoolSystem } from './SchoolSystem';
import { School } from './School';
import { Course } from './Course';
import { Semester } from './Semester';
import { Holiday } from './Holiday';
import { Class } from './Class';
import { Student } from './Student';
import { Enrollment } from './Enrollment';
import { ClassMeeting } from './ClassMeeting';
import { AttendanceRecord } from './AttendanceRecord';

export const lists: Lists = {
  User,
  SchoolSystem,
  School,
  Course,
  Semester,
  Holiday,
  Class,
  Student,
  Enrollment,
  ClassMeeting,
  AttendanceRecord,
};