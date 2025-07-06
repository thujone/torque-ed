import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';

// Import our schema definitions
import { lists } from './schema';
import { components } from './admin/config';
import { nukeSchoolSystemData } from './lib/nukeSchoolSystemData';
import { checkOrphanedData } from './lib/checkOrphanedData';
import { seedStudents } from './lib/seedStudents';

// Set up our session configuration
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  console.warn('⚠️  SESSION_SECRET not found, using temporary secret for development');
}

const session = statelessSessions({
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secret: sessionSecret || 'dev-only-secret-replace-in-production',
});

// Set up auth
const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'id email firstName lastName roles schoolSystem { id }',
  secretField: 'password',
  initFirstItem: {
    fields: ['firstName', 'lastName', 'email', 'password', 'roles'],
  },
});

export default withAuth(
  config({
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://torqueed:password@localhost:5432/torqueed_dev',
      onConnect: async () => {
        console.log('Connected to database');
      },
      // Enable logging in development
      enableLogging: process.env.NODE_ENV === 'development',
    },
    lists,
    session,
    ui: {
      isAccessAllowed: (context) => !!context.session,
      publicPages: ['/attendance'],
      getAdditionalFiles: [
        async () => [
          {
            mode: 'write' as const,
            src: `import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}`,
            outputPath: 'pages/index.js',
          },
        ],
      ],
      ...components,
    },
    graphql: {
      playground: process.env.NODE_ENV !== 'production',
    },
    server: {
      cors: {
        origin: [process.env.FRONTEND_URL || 'http://localhost:3030'],
        credentials: true,
      },
      port: parseInt(process.env.PORT || '3030'),
      extendExpressApp: (app, commonContext) => {
        // Add body parsing middleware for JSON
        app.use(require('express').json());
        
        // Add REST API endpoint for nuke functionality
        app.post('/api/nuke-school-system', async (req, res) => {
          try {
            const context = await commonContext.withRequest(req, res);
            
            if (!context.session?.data) {
              return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { schoolSystemId } = req.body;
            
            if (!schoolSystemId) {
              return res.status(400).json({ success: false, message: 'schoolSystemId is required' });
            }

            const result = await nukeSchoolSystemData(null, { schoolSystemId }, context);
            
            return res.status(200).json(result);
            
          } catch (error) {
            console.error('API Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return res.status(500).json({ 
              success: false, 
              message: `Server error: ${errorMessage}` 
            });
          }
        });
        
        // Add seed data endpoint
        app.post('/api/seed-data', async (req, res) => {
          try {
            const context = await commonContext.withRequest(req, res);
            
            if (!context.session?.data?.roles?.includes('superAdmin')) {
              return res.status(401).json({ success: false, message: 'Only superAdmins can use this endpoint' });
            }

            // Import and run the seed script logic
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            await execAsync('npm run seed', { cwd: process.cwd() });
            
            return res.status(200).json({
              success: true,
              message: 'Sample data created successfully'
            });
            
          } catch (error) {
            console.error('Seed Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return res.status(500).json({ 
              success: false, 
              message: `Server error: ${errorMessage}` 
            });
          }
        });
        
        // Add seed students endpoint
        app.post('/api/seed-students', async (req, res) => {
          try {
            const context = await commonContext.withRequest(req, res);
            
            if (!context.session?.data?.roles?.includes('superAdmin')) {
              return res.status(401).json({ success: false, message: 'Only superAdmins can use this endpoint' });
            }

            const result = await seedStudents(null, {}, context);
            
            return res.status(200).json(result);
            
          } catch (error) {
            console.error('Seed Students Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return res.status(500).json({ 
              success: false, 
              message: `Server error: ${errorMessage}` 
            });
          }
        });
        
        // Add diagnostic endpoint
        app.get('/api/check-orphaned-data/:schoolSystemId', async (req, res) => {
          try {
            const context = await commonContext.withRequest(req, res);
            
            if (!context.session?.data?.roles?.includes('superAdmin')) {
              return res.status(401).json({ success: false, message: 'Only superAdmins can use this endpoint' });
            }

            const { schoolSystemId } = req.params;
            
            const result = await checkOrphanedData(schoolSystemId, context);
            
            return res.status(200).json({
              success: true,
              data: result
            });
            
          } catch (error) {
            console.error('Diagnostic Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return res.status(500).json({ 
              success: false, 
              message: `Server error: ${errorMessage}` 
            });
          }
        });
      },
    },
  })
);